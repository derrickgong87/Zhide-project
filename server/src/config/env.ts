import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  JWT_SECRET: z.string().min(1, "JWT Secret is required"),
  API_KEY: z.string().min(1, "Google Gemini API Key is required"),
});

export const env = envSchema.parse(process.env);