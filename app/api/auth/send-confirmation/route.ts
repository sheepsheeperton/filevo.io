import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Generate a new confirmation token
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (tokenError || !tokenData) {
      console.error("Error generating confirmation link:", tokenError);
      return NextResponse.json({ error: "Failed to generate confirmation link" }, { status: 500 });
    }

    // Extract the confirmation URL from the generated link
    const confirmationUrl = tokenData.properties.action_link;

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Filevo <onboarding@resend.dev>',
      to: [email],
      subject: 'Confirm your Filevo account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Filevo!</h1>
          <p>Thank you for signing up. Please confirm your email address to get started.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${confirmationUrl}">${confirmationUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you didn't sign up for Filevo, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Confirmation email sent successfully",
      emailId: emailData?.id 
    });

  } catch (error) {
    console.error("Error in send-confirmation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
