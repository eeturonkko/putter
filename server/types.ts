// server/types.ts
import { z } from "zod";

export const CreateSessionSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const AddPuttsSchema = z
  .object({
    distance_m: z.number().int().positive(),
    attempts: z.number().int().nonnegative(),
    makes: z.number().int().nonnegative(),
  })
  .refine((v) => v.makes <= v.attempts, {
    message: "makes cannot exceed attempts",
  });

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type AddPuttsDto = z.infer<typeof AddPuttsSchema>;

export interface SessionRow {
  id: number;
  user_id: string;
  name: string;
  date: string; // YYYY-MM-DD
  created_at: string; // ISO datetime
}

export interface SessionListRow {
  id: number;
  name: string;
  date: string;
  created_at: string;
}

export interface PuttRow {
  id: number;
  session_id: number;
  distance_m: number;
  attempts: number;
  makes: number;
  created_at: string;
}
