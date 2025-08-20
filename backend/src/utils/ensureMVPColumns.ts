import pool from './database';

export async function ensureMVPColumns() {
  try {
    // Ensure file_content column exists for storing binary file data in MVP
    await pool.query(
      `ALTER TABLE IF EXISTS file_uploads
         ADD COLUMN IF NOT EXISTS file_content BYTEA`
    );
  } catch (err) {
    console.error('ensureMVPColumns: failed to ensure columns', err);
  }
}
