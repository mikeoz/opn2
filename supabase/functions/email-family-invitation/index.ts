import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { Resend } from "npm:resend@2.0.0";

// Development mode - set to false when ready for real emails
const DEVELOPMENT_MODE = true;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface EmailInvitationRequest {
  invitationToken: string;
  origin?: string;
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

    const { invitationToken, origin }: EmailInvitationRequest = await req.json();

    // Validate required fields
    if (!invitationToken) {
      throw new Error("Missing invitation token");
    }

    // Get invitation details by token
    const { data: invitation, error: inviteError } = await supabase
      .from('family_invitations')
      .select(`
        *,
        family_units!inner(family_label, trust_anchor_user_id),
        profiles!family_invitations_invited_by_fkey(first_name, last_name)
      `)
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteError) {
      console.error('Error fetching invitation:', inviteError);
      throw new Error(`Failed to fetch invitation: ${inviteError.message}`);
    }

    if (!invitation) {
      throw new Error("Invalid or expired invitation token");
    }

    // Check if invitation hasn't expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new Error("Invitation has expired");
    }

    // Check if already sent recently (within 5 minutes to prevent spam)
    if (invitation.sent_at) {
      const sentAt = new Date(invitation.sent_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (sentAt > fiveMinutesAgo) {
        throw new Error("Invitation email was already sent recently");
      }
    }

    const senderName = invitation.profiles 
      ? `${invitation.profiles.first_name} ${invitation.profiles.last_name}`.trim()
      : 'Family member';

    const familyLabel = invitation.family_units.family_label;

    // Construct invitation URL
    const invitationUrl = `${origin || 'https://app.example.com'}/register?invitation=${invitationToken}`;

    const emailSubject = `${senderName} invited you to join the ${familyLabel} family`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're invited to join the ${familyLabel} family!</h2>
        
        <p>Hi ${invitation.invitee_name || 'there'},</p>
        
        <p><strong>${senderName}</strong> has invited you to join their family unit as their <strong>${invitation.relationship_role}</strong>.</p>
        
        ${invitation.personal_message ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${invitation.personal_message}"</p>
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
    `;

    let emailId = 'dev-email-' + Date.now();

    if (DEVELOPMENT_MODE) {
      // Development mode: Log email content and simulate success
      console.log('📧 DEVELOPMENT MODE - Email would be sent:');
      console.log('To:', invitation.invitee_email);
      console.log('Subject:', emailSubject);
      console.log('Invitation URL:', invitationUrl);
      console.log('Content preview:', emailContent.substring(0, 200) + '...');
      
      // Store mock email data for review
      await supabase
        .from('family_invitations')
        .update({ 
          sent_at: new Date().toISOString(),
          // Store email content in personal_message for development review
          personal_message: invitation.personal_message ? 
            `${invitation.personal_message}\n\n[DEV] Invitation URL: ${invitationUrl}` : 
            `[DEV] Invitation URL: ${invitationUrl}`
        })
        .eq('invitation_token', invitationToken);

      console.log('✅ Development mode: Email "sent" successfully');
    } else {
      // Production mode: Send real email via Resend
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error('Missing RESEND_API_KEY secret');
        throw new Error('Email service is not configured');
      }
      const resend = new Resend(resendApiKey);

      const emailResponse = await resend.emails.send({
        from: "Family Connect <onboarding@resend.dev>",
        to: [invitation.invitee_email],
        subject: emailSubject,
        html: emailContent,
      });

      if (emailResponse.error) {
        console.error('Email sending error:', emailResponse.error);
        throw new Error(`Failed to send email: ${emailResponse.error.message}`);
      }

      emailId = emailResponse.data?.id || 'unknown';
      
      // Update invitation with sent timestamp
      await supabase
        .from('family_invitations')
        .update({ sent_at: new Date().toISOString() })
        .eq('invitation_token', invitationToken);

      console.log('📧 Production: Email sent successfully via Resend:', emailResponse);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId,
        developmentMode: DEVELOPMENT_MODE,
        invitationUrl: DEVELOPMENT_MODE ? invitationUrl : undefined
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
    console.error("Error in email-family-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});