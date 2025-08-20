import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FamilyConnectionRequest {
  targetFamilyUnitId: string;
  connectionDirection: 'invitation' | 'request'; // invitation = I invite them, request = I request to join them
  connectionType?: string;
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

    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Set the auth for the request
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const {
      targetFamilyUnitId,
      connectionDirection,
      connectionType = 'hierarchical',
      personalMessage,
    }: FamilyConnectionRequest = await req.json();

    // Validate required fields
    if (!targetFamilyUnitId || !connectionDirection) {
      throw new Error("Missing required fields");
    }

    // Get user's family unit
    const { data: userFamilyUnit, error: userFamilyError } = await supabase
      .from('family_units')
      .select('id, family_label, trust_anchor_user_id')
      .eq('trust_anchor_user_id', user.id)
      .single();

    if (userFamilyError || !userFamilyUnit) {
      throw new Error("You must have a family unit to create connections");
    }

    // Get target family unit
    const { data: targetFamilyUnit, error: targetFamilyError } = await supabase
      .from('family_units')
      .select('id, family_label, trust_anchor_user_id, profiles!trust_anchor_user_id(first_name, last_name, email)')
      .eq('id', targetFamilyUnitId)
      .single();

    if (targetFamilyError || !targetFamilyUnit) {
      throw new Error("Target family unit not found");
    }

    // Prevent self-connection
    if (userFamilyUnit.id === targetFamilyUnit.id) {
      throw new Error("Cannot connect a family unit to itself");
    }

    // Get user profile for email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const userName = userProfile 
      ? `${userProfile.first_name} ${userProfile.last_name}`.trim()
      : 'Family member';

    // Determine parent and child based on connection direction
    let parentFamilyUnitId: string;
    let childFamilyUnitId: string;
    let emailSubject: string;
    let emailContent: string;

    if (connectionDirection === 'invitation') {
      // I'm inviting them to be my child unit
      parentFamilyUnitId = userFamilyUnit.id;
      childFamilyUnitId = targetFamilyUnit.id;
      emailSubject = `${userName} invited ${targetFamilyUnit.family_label} to connect families`;
      emailContent = `
        <h2>Family Connection Invitation</h2>
        <p>Hi there,</p>
        <p><strong>${userName}</strong> from the <strong>${userFamilyUnit.family_label}</strong> family has invited your family unit to connect as a child family.</p>
        ${personalMessage ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
          </div>
        ` : ''}
        <p>This would create a hierarchical family tree connection where <strong>${userFamilyUnit.family_label}</strong> becomes the parent family unit of <strong>${targetFamilyUnit.family_label}</strong>.</p>
      `;
    } else {
      // I'm requesting to join them as their child unit
      parentFamilyUnitId = targetFamilyUnit.id;
      childFamilyUnitId = userFamilyUnit.id;
      emailSubject = `${userName} requested to connect to ${targetFamilyUnit.family_label} family`;
      emailContent = `
        <h2>Family Connection Request</h2>
        <p>Hi there,</p>
        <p><strong>${userName}</strong> from the <strong>${userFamilyUnit.family_label}</strong> family has requested to connect to your family unit as a child family.</p>
        ${personalMessage ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
          </div>
        ` : ''}
        <p>This would create a hierarchical family tree connection where <strong>${targetFamilyUnit.family_label}</strong> becomes the parent family unit of <strong>${userFamilyUnit.family_label}</strong>.</p>
      `;
    }

    // Create connection record
    const { data: connection, error: connectionError } = await supabase
      .from('family_unit_connections')
      .insert({
        parent_family_unit_id: parentFamilyUnitId,
        child_family_unit_id: childFamilyUnitId,
        connection_type: connectionType,
        initiated_by: user.id,
        connection_direction: connectionDirection,
        personal_message: personalMessage,
      })
      .select('invitation_token')
      .single();

    if (connectionError) {
      console.error('Error creating connection:', connectionError);
      throw new Error(`Failed to create connection: ${connectionError.message}`);
    }

    // Construct action URL
    const actionUrl = `${req.headers.get('origin') || 'https://app.example.com'}/family-connection?token=${connection.invitation_token}`;

    // Send email to target family unit's trust anchor
    const targetEmail = (targetFamilyUnit.profiles as any)?.email;
    if (targetEmail) {
      const emailResponse = await resend.emails.send({
        from: "Family Connect <noreply@resend.dev>",
        to: [targetEmail],
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailContent}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                ${connectionDirection === 'invitation' ? 'Accept Invitation' : 'Review Request'}
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This ${connectionDirection} will expire in 30 days. You can manage family connections from your Family Management dashboard.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you can't click the button above, copy and paste this link into your browser:<br>
              <a href="${actionUrl}">${actionUrl}</a>
            </p>
          </div>
        `,
      });

      if (emailResponse.error) {
        console.error('Email sending error:', emailResponse.error);
        // Don't fail the connection creation if email fails
        console.warn('Connection created but email failed to send');
      } else {
        console.log('Family connection email sent successfully:', emailResponse);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        connectionId: connection.invitation_token,
        connectionDirection,
        message: `Family connection ${connectionDirection} sent successfully!`
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
    console.error("Error in send-family-connection function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});