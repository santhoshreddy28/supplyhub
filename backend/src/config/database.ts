import { neon, Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

export const sql = neon(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});