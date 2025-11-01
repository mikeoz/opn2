import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt + 1}/${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏱️ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

interface AcceptInvitationRequest {
  invitationToken: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Accept invitation function called');
    
    // Initialize Supabase with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('✅ Supabase client initialized');

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ User authenticated: ${user.email} (${user.id})`);

    // Parse request body
    const { invitationToken }: AcceptInvitationRequest = await req.json();
    console.log(`📨 Processing invitation token: ${invitationToken}`);

    if (!invitationToken) {
      console.error('❌ Missing invitation token in request');
      return new Response(
        JSON.stringify({ error: 'Missing invitation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('family_invitations')
      .select(`
        *,
        family_units!inner(
          id,
          trust_anchor_user_id,
          family_label
        )
      `)
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      console.error('❌ Invitation fetch error:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found invitation ID: ${invitation.id}`);
    console.log(`   Family: ${invitation.family_units.family_label}`);
    console.log(`   Trust anchor: ${invitation.family_units.trust_anchor_user_id}`);

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.error('❌ Invitation expired');
      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already a member of this family unit
    const { data: existingMembership } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('individual_user_id', user.id)
      .eq('organization_user_id', invitation.family_units.trust_anchor_user_id)
      .eq('is_family_unit', true)
      .eq('status', 'active')
      .single();

    if (existingMembership) {
      console.log('⚠️ User already member of this family');
      return new Response(
        JSON.stringify({ error: 'User is already a member of this family unit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

      console.log('🔄 Creating membership with retry logic...');

      // Use retry logic with the atomic transaction function
      const result = await retryWithBackoff(async () => {
        console.log('📞 Calling accept_family_invitation_transaction RPC...');
        
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'accept_family_invitation_transaction',
          {
            p_invitation_id: invitation.id,
            p_user_id: user.id,
            p_trust_anchor_user_id: invitation.family_units.trust_anchor_user_id,
            p_relationship_role: invitation.relationship_role,
            p_invited_by: invitation.invited_by
          }
        );

        console.log('📨 RPC Response:', { rpcResult, rpcError });

        if (rpcError) {
          console.error('❌ RPC Error:', rpcError);
          throw new Error(`RPC failed: ${rpcError.message}`);
        }

        // Check if the RPC function returned an error in its result
        if (rpcResult && !rpcResult.success) {
          console.error('❌ RPC returned error:', rpcResult.error);
          throw new Error(rpcResult.error);
        }

        console.log('✅ RPC completed successfully:', rpcResult);
        return rpcResult;
      }, 3, 2000); // 3 retries, 2-second base delay

      console.log('✅ Membership creation successful:', result);

    console.log(`✅ Successfully accepted invitation for user ${user.email}`);
    console.log(`   Family: ${invitation.family_units.family_label}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation accepted successfully',
        familyLabel: invitation.family_units.family_label
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});