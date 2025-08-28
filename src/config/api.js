// API Configuration
// This file centralizes API configuration for different environments

const API_CONFIG = {
  // Development: Uses Vite proxy to localhost:5000
  development: '/api',
  
  // Production: Set this to your actual backend server URL
  production: import.meta.env.VITE_API_BASE_URL || 'https://your-production-api.com/api',
  
  // Test: For testing environments
  test: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
};

// Get current environment
const currentEnv = import.meta.env.MODE || 'development';

// Export the appropriate base URL
export const API_BASE_URL = API_CONFIG[currentEnv] || API_CONFIG.development;

// Usage example:
// import { API_BASE_URL } from '../config/api.js';
// axios.defaults.baseURL = API_BASE_URL; 