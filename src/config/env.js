/**
 * Configuration service for environment variables
 * Safe for production and development with Vercel/Railway
 */

// Check if we have import.meta.env (Vite environment)
const isViteEnv = typeof import.meta !== 'undefined' && import.meta.env;

// Try to load environment variables from different sources based on environment
const config = {
    // Production uses environment variables from Vercel/Railway
    // Development uses import.meta.env from Vite or falls back to empty strings
    GROQ_API_KEY: isViteEnv ? import.meta.env.VITE_GROQ_API_KEY : '',
    SUPABASE_URL: isViteEnv ? import.meta.env.VITE_SUPABASE_URL : '',
    SUPABASE_KEY: isViteEnv ? import.meta.env.VITE_SUPABASE_KEY : '',
    APP_NAME: isViteEnv ? import.meta.env.VITE_APP_NAME || 'SmartSaku' : 'SmartSaku',
    APP_ENVIRONMENT: isViteEnv ? import.meta.env.VITE_APP_ENVIRONMENT || 'development' : 'development'
};

// Try to load from window.ENV if available (for local development with config.local.js)
if (typeof window !== 'undefined' && window.ENV) {
    if (window.ENV.GROQ_API_KEY) config.GROQ_API_KEY = window.ENV.GROQ_API_KEY;
    if (window.ENV.SUPABASE_URL) config.SUPABASE_URL = window.ENV.SUPABASE_URL;
    if (window.ENV.SUPABASE_ANON_KEY) config.SUPABASE_KEY = window.ENV.SUPABASE_ANON_KEY;
}

// Function to get configuration
export function getEnvConfig() {
    return config;
}

// Function to check if the API key is configured
export function isApiKeyConfigured() {
    return !!config.GROQ_API_KEY && config.GROQ_API_KEY.trim() !== '';
}

// For testing purposes only - don't use in production
export function setEnvConfig(key, value) {
    if (key in config) {
        config[key] = value;
        return true;
    }
    return false;
}

export function clearEnvConfig() {
    // This only clears the runtime values, not the actual environment
    console.warn('Environment variables cannot be cleared at runtime');
}