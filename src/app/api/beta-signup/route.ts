import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { BETA_CODE, PRO_DAYS } from "@/lib/constants";

// Sends the shared beta code by email the moment someone submits the /beta
// form — replaces the old mailto: flow (BetaClient.tsx), which depended on
// the visitor's own email client being configured. Falls back to reporting
// failure so the client can show the code on-screen instead; it never
// silently drops a signup.

export const runtime = "nodejs";

const FROM_ADDRESS = "StratoBot <onboarding@resend.dev>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface BetaSignupBody {
  name?: string;
  email?: string;
  experience?: string;
  style?: string;
  notes?: string;
}

function buildEmailHtml(name: string): string {
  return `
    <p>Hi ${name},</p>
    <p>Thanks for joining the StratoBot beta. Here's your access code:</p>
    <p style="font-size:20px;font-weight:700;letter-spacing:0.05em;font-family:monospace;">${BETA_CODE}</p>
    <p>Enter it on the Unlock screen (after describing a strategy and running the free logic check) to get ${PRO_DAYS} days of unlimited simulations, strategies, and downloads — no charge.</p>
    <p>Reply to this email any time with what's confusing, broken, or missing.</p>
  `;
}

export async function POST(req: NextRequest) {
  let body: BetaSignupBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const experience = typeof body.experience === "string" ? body.experience.trim() : "";

  if (!name || !email || !experience) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[/api/beta-signup] RESEND_API_KEY not set");
    return NextResponse.json({ error: "Email sending is not configured" }, { status: 502 });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your StratoBot beta access code",
      html: buildEmailHtml(name),
    });
    if (error) {
      console.error("[/api/beta-signup] Resend rejected the send", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/beta-signup] Unexpected error sending email", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }
}
