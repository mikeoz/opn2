import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClaimInvitationRequest {
  profileId: string;
  inviteeEmail: string;
  inviteeName: string;
  familyUnitId: string;
  invitationToken: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const {
      profileId,
      inviteeEmail,
      inviteeName,
      familyUnitId,
      invitationToken
    }: ClaimInvitationRequest = await req.json();

    // Validate required fields
    if (!profileId || !inviteeEmail || !familyUnitId || !invitationToken) {
      throw new Error("Missing required fields");
    }

    // Get family unit and sender info
    const { data: familyUnit, error: familyError } = await supabase
      .from("family_units")
      .select("family_label, trust_anchor_user_id, profiles!family_units_trust_anchor_user_id_fkey(first_name, last_name)")
      .eq("id", familyUnitId)
      .single();

    if (familyError || !familyUnit) {
      throw new Error("Family unit not found");
    }

    const senderProfile = familyUnit.profiles as any;
    const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`.trim();

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const claimUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/claim-profile?token=${invitationToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You've Been Added to a Family Unit!</h2>
        <p>Hello ${inviteeName},</p>
        <p>${senderName} has created a profile for you in the <strong>${familyUnit.family_label}</strong> family unit on Opn2.</p>
        <p>To claim your profile and join the Opn2 community:</p>
        <ol>
          <li>Click the button below to review the information</li>
          <li>Create your Opn2 account or log in if you already have one</li>
          <li>Confirm or update your profile information</li>
        </ol>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${claimUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Claim Your Profile
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This invitation will expire in 30 days. If you have any questions, please contact ${senderName}.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated message from Opn2. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Opn2 <invitations@opn2.com>",
      to: [inviteeEmail],
      subject: `${senderName} invited you to join their family on Opn2`,
      html: emailHtml
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error("Failed to send invitation email");
    }

    console.log("Invitation email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailData?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in email-profile-claim-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
