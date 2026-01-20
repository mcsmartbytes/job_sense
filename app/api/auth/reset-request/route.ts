import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { resend } from "@/lib/email/resend";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  const user = result[0];

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset?token=${token}`;

  if (resend) {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Job Sense <noreply@jobsense.app>",
      to: user.email,
      subject: "Reset your Job Sense password",
      html: `<p>Reset your password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
