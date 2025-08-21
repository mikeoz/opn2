import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { Resend } from "npm:resend@2.0.0";
// Function deployed - retry after 401 fix
// Resend client will be initialized within the request handler after validating secrets

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface FamilyInvitationRequest {
  familyUnitId: string;
  inviteeEmail: string;
  inviteeName?: string;
  relationshipRole: string;
  personalMessage?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header (optional since verify_jwt = false)
    const authHeader = req.headers.get("authorization");
    let user = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: authError } = await supabase.auth.getUser(token);
        if (!authError && userData) {
          user = userData.user;
        }
      } catch (error) {
        console.log('Auth header provided but invalid, continuing without user context');
      }
    }

    if (!user) {
      throw new Error("User authentication required to send family invitations");
    }

    const {
      familyUnitId,
      inviteeEmail,
      inviteeName,
      relationshipRole,
      personalMessage,
    }: FamilyInvitationRequest = await req.json();

    // Validate required fields
    if (!familyUnitId || !inviteeEmail || !relationshipRole) {
      throw new Error("Missing required fields");
    }

    // Verify user owns the family unit
    const { data: familyUnit, error: familyError } = await supabase
      .from('family_units')
      .select('family_label, trust_anchor_user_id')
      .eq('id', familyUnitId)
      .eq('trust_anchor_user_id', user.id)
      .single();

    if (familyError || !familyUnit) {
      throw new Error("Family unit not found or access denied");
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile 
      ? `${senderProfile.first_name} ${senderProfile.last_name}`.trim()
      : 'Family member';

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('family_invitations')
      .insert({
        family_unit_id: familyUnitId,
        invited_by: user.id,
        invitee_email: inviteeEmail,
        invitee_name: inviteeName,
        relationship_role: relationshipRole,
        personal_message: personalMessage,
      })
      .select('invitation_token')
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }

    // Construct invitation URL
    const invitationUrl = `${req.headers.get('origin') || 'https://app.example.com'}/register?invitation=${invitation.invitation_token}`;

    // Initialize Resend and send invitation email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY secret');
      throw new Error('Email service is not configured');
    }
    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: "Family Connect <noreply@resend.dev>",
      to: [inviteeEmail],
      subject: `${senderName} invited you to join the ${familyUnit.family_label} family`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're invited to join the ${familyUnit.family_label} family!</h2>
          
          <p>Hi ${inviteeName || 'there'},</p>
          
          <p><strong>${senderName}</strong> has invited you to join their family unit as their <strong>${relationshipRole}</strong>.</p>
          
          ${personalMessage ? `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
            </div>
          ` : ''}
          
          <p>To accept this invitation and create your account, click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation & Sign Up
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days. If you have any questions, please contact ${senderName} directly.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            If you can't click the button above, copy and paste this link into your browser:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Email sending error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    // Update invitation with sent timestamp
    await supabase
      .from('family_invitations')
      .update({ sent_at: new Date().toISOString() })
      .eq('invitation_token', invitation.invitation_token);

    console.log('Family invitation sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.invitation_token,
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-family-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});