import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Initialize Supabase with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { invitationToken }: AcceptInvitationRequest = await req.json();

    if (!invitationToken) {
      return new Response(
        JSON.stringify({ error: 'Missing invitation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing invitation acceptance for user ${user.email} with token ${invitationToken}`);

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
      console.error('Invitation fetch error:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found valid invitation for family unit: ${invitation.family_units.family_label}`);

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
      return new Response(
        JSON.stringify({ error: 'User is already a member of this family unit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use a transaction to update invitation and create membership
    const { error: transactionError } = await supabase.rpc('accept_family_invitation_transaction', {
      p_invitation_id: invitation.id,
      p_user_id: user.id,
      p_trust_anchor_user_id: invitation.family_units.trust_anchor_user_id,
      p_relationship_role: invitation.relationship_role,
      p_invited_by: invitation.invited_by
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      
      // Fallback to individual operations if RPC doesn't exist
      console.log('Falling back to individual operations...');
      
      // Update invitation status
      const { error: updateError } = await supabase
        .from('family_invitations')
        .update({ 
          status: 'accepted', 
          accepted_at: new Date().toISOString() 
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Failed to update invitation:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to accept invitation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create organization membership
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .insert({
          individual_user_id: user.id,
          organization_user_id: invitation.family_units.trust_anchor_user_id,
          relationship_label: invitation.relationship_role,
          permissions: { family_member: true },
          is_family_unit: true,
          membership_type: 'member',
          status: 'active',
          created_by: invitation.invited_by
        });

      if (membershipError) {
        console.error('Failed to create membership:', membershipError);
        return new Response(
          JSON.stringify({ error: 'Failed to create family membership' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Successfully accepted invitation for user ${user.email}`);

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