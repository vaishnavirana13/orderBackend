if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config(); 
  }
  
  const { createClient } = require('@supabase/supabase-js');
  
  
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; 
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  
 
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase URL or API key is missing. Please check your environment variables.');
    process.exit(1); 
  }
  
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  
  if (process.env.NODE_ENV !== 'production') {
    async function testConnection() {
      try {
        
        const { data, error } = await supabase
          .from('products')  
          .select('*')        
          .limit(5);          
  
        if (error) {
          console.error('Error fetching products:', error);
          return;
        }
  
        console.log('Connected to the database using Supabase!');
        console.log('Sample Data:', data); 
      } catch (err) {
        console.error('Error connecting to the database:', err.message);
      }
    }
  
    testConnection(); 
  }
  
  
  module.exports = supabase;
  