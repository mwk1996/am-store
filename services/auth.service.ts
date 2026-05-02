import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

const JWT_SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";
const JWT_EXPIRES_IN = "7d";

export const authService = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
    shopName?: string;
  }): Promise<{ user: { id: string; email: string; name: string; role: Role }; token: string }> {
    const role = data.role ?? Role.BUYER;

    const result = await prisma.$transaction(async (tx) => {
      // Check email uniqueness
      const existing = await tx.user.findUnique({ where: { email: data.email } });
      if (existing) throw new Error("Email already registered");

      // For SELLER: check shopName uniqueness
      if (role === Role.SELLER && data.shopName) {
        const shopTaken = await tx.user.findFirst({ where: { shopName: data.shopName } });
        if (shopTaken) throw new Error("Shop name already taken");
      }

      const passwordHash = await bcrypt.hash(data.password, 12);
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role,
          shopName: role === Role.SELLER ? (data.shopName ?? null) : null,
          emailVerified: false,
          verificationToken,
          verificationTokenExp,
        },
        select: { id: true, email: true, name: true, role: true, verificationToken: true },
      });

      return user;
    });

    // Fire-and-forget verification email — never fail registration due to email errors
    authService.sendVerificationEmail(result.email, result.verificationToken!).catch(() => {});

    const token = authService.signToken({ userId: result.id, email: result.email, role: result.role });

    return { user: { id: result.id, email: result.email, name: result.name, role: result.role }, token };
  },

  async login(
    email: string,
    password: string
  ): Promise<{ user: { id: string; email: string; name: string; role: Role }; token: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid email or password");

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error("Invalid email or password");

    const token = authService.signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
  },

  signToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  },

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@marketplace.local",
      to: email,
      subject: "Verify your email",
      html: `<p>Click <a href="${baseUrl}/en/verify-email?token=${token}">here</a> to verify your email. Link expires in 24 hours.</p>`,
    });
  },

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) throw new Error("Invalid or expired verification token");
    if (user.verificationTokenExp && user.verificationTokenExp < new Date()) {
      throw new Error("Verification token expired");
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationTokenExp: null },
    });
  },

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return; // silent: don't reveal if email exists
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExp },
    });
    await authService.sendVerificationEmail(email, verificationToken);
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // silent: don't reveal if email exists (per D-09 security guidance)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@marketplace.local",
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${baseUrl}/en/reset-password?token=${resetToken}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user) throw new Error("Invalid or expired reset token");
    if (user.resetTokenExp && user.resetTokenExp < new Date()) {
      throw new Error("Reset token expired");
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExp: null },
    });
  },
};
