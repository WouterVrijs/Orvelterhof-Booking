import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

const TOKEN_EXPIRY_MINUTES = 60;

// Generate a cryptographically secure reset token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Hash the token before storing (we only store the hash, not the plain token)
async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

// Create a password reset token for a user
// Returns the plain token (to include in the email link) or null if user not found
export async function createPasswordResetToken(
  email: string
): Promise<{ token: string; userName: string } | null> {
  const [user] = await db
    .select({ id: users.id, name: users.name, isActive: users.isActive })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.isActive) return null;

  // Invalidate any existing unused tokens for this user
  const now = new Date();
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  // Generate and store new token
  const plainToken = generateToken();
  const tokenHash = await hashToken(plainToken);
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return { token: plainToken, userName: user.name };
}

// Validate a reset token and return the userId if valid
export async function validateResetToken(
  plainToken: string
): Promise<{ userId: string; tokenId: string } | null> {
  const now = new Date();

  // Get all unexpired, unused tokens
  const candidates = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    );

  // Check the plain token against each stored hash
  for (const candidate of candidates) {
    const isMatch = await bcrypt.compare(plainToken, candidate.tokenHash);
    if (isMatch) {
      return { userId: candidate.userId, tokenId: candidate.id };
    }
  }

  return null;
}

// Consume a token (mark as used) and update the user's password
export async function consumeTokenAndResetPassword(
  tokenId: string,
  userId: string,
  newPassword: string
): Promise<boolean> {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date();

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, tokenId));

  // Invalidate all other tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt)
      )
    );

  // Update password
  await db
    .update(users)
    .set({ passwordHash, updatedAt: now })
    .where(eq(users.id, userId));

  return true;
}
