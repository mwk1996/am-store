// lib/validations.ts – shared Zod schemas
import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── Product ──────────────────────────────────────────────────────────────────
export const productSchema = z.object({
  name:        z.object({ en: z.string().min(1).max(150), ar: z.string().optional(), tr: z.string().optional(), ku: z.string().optional() }),
  description: z.object({ en: z.string(), ar: z.string().optional(), tr: z.string().optional(), ku: z.string().optional() }),
  price:       z.number().positive().max(100_000),
  category:    z.string().optional(),
  imageUrl:    z.string().url().optional(),
});

// ─── Review ───────────────────────────────────────────────────────────────────
export const reviewSchema = z.object({
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ─── Message ──────────────────────────────────────────────────────────────────
export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});
