import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export interface User {
  id: number;
  email: string;
  password: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: number;
  user_id: number;
  business_type: string;
  business_size: string;
  industry: string;
  region: string;
  experience_years: number;
  annual_revenue?: number;
  employee_count?: number;
  bin?: string;
  oked_code?: string;
  desired_loan_amount?: number;
  business_goals?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface BusinessProgram {
  id: number;
  title: string;
  description: string;
  organization: string;
  program_type: string;
  target_audience: string;
  funding_amount?: number;
  application_deadline?: Date;
  requirements: string;
  benefits: string;
  application_process: string;
  contact_info: string;
  is_active: boolean;
  supported_regions?: string[];
  min_loan_amount?: number;
  max_loan_amount?: number;
  oked_filters?: string[];
  required_documents?: any;
  application_steps?: any[];
  created_at: Date;
  updated_at: Date;
}

export interface Application {
  id: number;
  user_id: number;
  program_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  application_data: any;
  submitted_at: Date;
  updated_at: Date;
}

export default pool;
