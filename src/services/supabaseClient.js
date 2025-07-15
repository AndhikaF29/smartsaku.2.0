import { createClient } from '@supabase/supabase-js';

// Supabase configuration - replace with your actual values
const supabaseUrl = 'https://wkanwzqxmhqqfcwjgtdb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYW53enF4bWhxcWZjd2pndGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODI1NzUsImV4cCI6MjA2ODE1ODU3NX0.OQQrNbgM9plDmql1YCWZAirrPveDmvxcu2FOI1zKWSY'

// Create Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export default supabaseClient;