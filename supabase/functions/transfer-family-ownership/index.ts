import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransferOwnershipRequest {
  familyUnitId: string;
  proposedOwnerEmail: string;
  message?: string;
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
      familyUnitId,
      proposedOwnerEmail,
      message
    }: TransferOwnershipRequest = await req.json();

    // Validate required fields
    if (!familyUnitId || !proposedOwnerEmail) {
      throw new Error("Missing required fields");
    }

    // Get family unit and current owner info
    const { data: familyUnit, error: familyError } = await supabase
      .from("family_units")
      .select("family_label, trust_anchor_user_id, profiles!family_units_trust_anchor_user_id_fkey(first_name, last_name, email)")
      .eq("id", familyUnitId)
      .single();

    if (familyError || !familyUnit) {
      throw new Error("Family unit not found");
    }

    // Verify user is the current owner
    if (familyUnit.trust_anchor_user_id !== user.id) {
      throw new Error("Only the current owner can transfer ownership");
    }

    const currentOwnerProfile = familyUnit.profiles as any;
    const currentOwnerName = `${currentOwnerProfile.first_name} ${currentOwnerProfile.last_name}`.trim();

    // Get the transfer record to get the token
    const { data: transfers } = await supabase
      .from("family_ownership_transfers")
      .select("transfer_token")
      .eq("family_unit_id", familyUnitId)
      .eq("proposed_owner_email", proposedOwnerEmail)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!transfers || transfers.length === 0) {
      throw new Error("Transfer record not found");
    }

    const transferToken = transfers[0].transfer_token;

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const acceptUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/accept-ownership?token=${transferToken}`;
    const declineUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/decline-ownership?token=${transferToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Family Unit Ownership Transfer Request</h2>
        <p>Hello,</p>
        <p>${currentOwnerName} has requested to transfer ownership of the <strong>${familyUnit.family_label}</strong> family unit to you.</p>
        ${message ? `<div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>` : ''}
        <p>As the new owner (trust anchor), you will have full control over:</p>
        <ul>
          <li>Managing family members</li>
          <li>Editing family unit settings</li>
          <li>Inviting new members</li>
          <li>Family unit configuration</li>
        </ul>
        <p><strong>This transfer request will expire in 7 days.</strong></p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" 
             style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
            Accept Transfer
          </a>
          <a href="${declineUrl}" 
             style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
            Decline Transfer
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated message from Opn2. If you have questions about this transfer, please contact ${currentOwnerName} at ${currentOwnerProfile.email}.
        </p>
      </div>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Opn2 <notifications@opn2.com>",
      to: [proposedOwnerEmail],
      subject: `${currentOwnerName} wants to transfer "${familyUnit.family_label}" family unit ownership to you`,
      html: emailHtml
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error("Failed to send transfer notification email");
    }

    console.log("Transfer notification email sent successfully:", emailData);

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
    console.error("Error in transfer-family-ownership:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
