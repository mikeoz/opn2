import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  relationshipCardId: string;
  toEmail: string;
  fromUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { relationshipCardId, toEmail, fromUserId }: RequestBody = await req.json();

    console.log("Sending relationship invitation:", { relationshipCardId, toEmail, fromUserId });

    // Fetch the relationship card details
    const { data: card, error: cardError } = await supabase
      .from("relationship_cards")
      .select(`
        *,
        from_profile:profiles!relationship_cards_from_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", relationshipCardId)
      .single();

    if (cardError || !card) {
      console.error("Error fetching relationship card:", cardError);
      throw new Error("Relationship card not found");
    }

    const fromProfile = card.from_profile;
    const fromName = `${fromProfile.first_name || ''} ${fromProfile.last_name || ''}`.trim() || 'Someone';
    const inviteUrl = `${supabaseUrl.replace('.supabase.co', '')}/accept-relationship?token=${card.invitation_token}`;

    // Send the invitation email
    const emailResponse = await resend.emails.send({
      from: "Opnli <onboarding@resend.dev>",
      to: [toEmail],
      subject: `${fromName} has invited you to connect on Opnli`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .relationship-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .btn:hover { background: #5568d3; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🤝 Relationship Invitation</h1>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p><strong>${fromName}</strong> has invited you to establish a relationship on Opnli.</p>
                
                <div class="relationship-box">
                  <h3>Proposed Relationship:</h3>
                  <p><strong>${fromName}</strong> is your <strong>${card.relationship_label_to}</strong></p>
                  <p>You are their <strong>${card.relationship_label_from}</strong></p>
                  ${card.metadata?.nickname ? `<p><em>Nickname: ${card.metadata.nickname}</em></p>` : ''}
                  ${card.metadata?.notes ? `<p>${card.metadata.notes}</p>` : ''}
                </div>

                <p>This bilateral relationship model allows both parties to define their perspective. You can:</p>
                <ul>
                  <li>✅ Accept the proposed labels</li>
                  <li>✏️ Modify the labels to match your perspective</li>
                  <li>❌ Decline the invitation</li>
                </ul>

                <p style="text-align: center;">
                  <a href="${inviteUrl}" class="btn">Review Invitation</a>
                </p>

                <div class="footer">
                  <p>This invitation expires in 30 days.</p>
                  <p>Opnli - Trusted Relationships, Your Way</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-relationship-invitation function:", error);
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
