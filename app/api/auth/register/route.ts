import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/validation";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { resend } from "@/lib/email/resend";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(users)
    .values({ email: normalizedEmail, passwordHash })
    .returning({ id: users.id, email: users.email });

  const user = inserted[0];
  if (!user) {
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify?token=${token}`;

  if (resend) {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Job Sense <noreply@jobsense.app>",
      to: user.email,
      subject: "Verify your Job Sense account",
      html: `<p>Welcome to Job Sense.</p><p>Verify your email to activate your account:</p><p><a href=\"${verifyUrl}\">Verify email</a></p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
