import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  recipientEmail: string;
  recipientName?: string;
  merchantName: string;
  customMessage?: string;
  invitationType: 'customer_onboarding' | 'card_share' | 'loyalty_program';
  invitationData?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const {
      recipientEmail,
      recipientName,
      merchantName,
      customMessage,
      invitationType,
      invitationData
    }: InvitationRequest = await req.json();

    if (!recipientEmail || !merchantName || !invitationType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "https://app.opn2.com";
    const invitationUrl = `${baseUrl}/invitation/${invitationToken}`;

    // Create email content based on invitation type
    let subject = "";
    let htmlContent = "";

    switch (invitationType) {
      case 'customer_onboarding':
        subject = `Welcome to ${merchantName} - Complete Your Profile`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Welcome to ${merchantName}!</h1>
            <p>Hi ${recipientName || 'there'},</p>
            <p>You've been invited to join ${merchantName}'s customer community. Complete your profile to unlock exclusive benefits and personalized experiences.</p>
            ${customMessage ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>Personal message from ${merchantName}:</strong></p><p style="font-style: italic;">${customMessage}</p></div>` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Complete Your Profile
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation will expire in 30 days.</p>
          </div>
        `;
        break;

      case 'card_share':
        subject = `${merchantName} wants to share their business card with you`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">${merchantName} - Business Card</h1>
            <p>Hi ${recipientName || 'there'},</p>
            <p>${merchantName} has shared their digital business card with you. View their contact information and connect with them directly.</p>
            ${customMessage ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>Message:</strong></p><p style="font-style: italic;">${customMessage}</p></div>` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Business Card
              </a>
            </div>
          </div>
        `;
        break;

      case 'loyalty_program':
        subject = `Join ${merchantName}'s Loyalty Program`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Join Our Loyalty Program!</h1>
            <p>Hi ${recipientName || 'there'},</p>
            <p>You're invited to join ${merchantName}'s exclusive loyalty program. Earn rewards, get special offers, and enjoy member-only benefits.</p>
            ${customMessage ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>Special offer:</strong></p><p style="font-style: italic;">${customMessage}</p></div>` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Join Loyalty Program
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Start earning rewards today!</p>
          </div>
        `;
        break;
    }

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "OpenLI <noreply@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Log the invitation in the database
    const { error: dbError } = await supabase
      .from('card_invitations')
      .insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        invitation_token: invitationToken,
        status: 'sent',
        invitation_data: {
          type: invitationType,
          merchantName,
          customMessage,
          ...invitationData
        },
        bulk_import_job_id: invitationData?.bulkImportJobId || crypto.randomUUID(), // Temporary fallback
        sent_at: new Date().toISOString()
      });

    if (dbError) {
      console.error("Database error:", dbError);
      // Continue anyway as email was sent successfully
    }

    console.log("Invitation sent successfully:", {
      emailId: emailResponse.data?.id,
      recipient: recipientEmail,
      type: invitationType
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
        invitationToken
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-customer-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);