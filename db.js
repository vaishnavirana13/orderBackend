if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config(); // Load environment variables from .env in development
  }
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Load Supabase credentials from environment variables
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; // Support VITE-prefixed env variables
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  
  // Ensure the credentials are available
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase URL or API key is missing. Please check your environment variables.');
    process.exit(1); // Exit the process with an error code
  }
  
  // Create a new Supabase client instance
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Test the database connection using Supabase (only in development)
  if (process.env.NODE_ENV !== 'production') {
    async function testConnection() {
      try {
        // Query to test the connection
        const { data, error } = await supabase
          .from('products')  // Ensure you are querying the correct table
          .select('*')        // Select all columns from 'products' table
          .limit(5);          // Fetch a small sample of products
  
        if (error) {
          console.error('Error fetching products:', error);
          return;
        }
  
        console.log('Connected to the database using Supabase!');
        console.log('Sample Data:', data); // Log the sample data
      } catch (err) {
        console.error('Error connecting to the database:', err.message);
      }
    }
  
    testConnection(); // Call the test function
  }
  
  // Export the Supabase client for use in other files
  module.exports = supabase;
  