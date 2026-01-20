import { NextResponse } from "next/server";
import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const tokenHash = hashToken(token);

  const records = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  const record = records[0];
  if (!record) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, record.userId));

  await db
    .update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(verificationTokens.id, record.id));

  return NextResponse.json({ ok: true });
}
