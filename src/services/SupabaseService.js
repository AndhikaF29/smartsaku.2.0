import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

const supabaseUrl = 'https://wkanwzqxmhqqfcwjgtdb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYW53enF4bWhxcWZjd2pndGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODI1NzUsImV4cCI6MjA2ODE1ODU3NX0.OQQrNbgM9plDmql1YCWZAirrPveDmvxcu2FOI1zKWSY'

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
}

export const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export default supabase