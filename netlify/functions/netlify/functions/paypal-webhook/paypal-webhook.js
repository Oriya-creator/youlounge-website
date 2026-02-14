// Netlify Functions ONLY run JavaScript - this works!
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    // PayPal sends webhook here
    const payload = JSON.parse(event.body);
    
    // Check if it's a completed payment
    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const email = payload.resource?.payer?.email_address;
      const transactionId = payload.resource?.id;
      
      console.log('Payment completed for:', email);
      
      // Since we CAN'T write to files on Netlify,
      // we need to store this data somewhere else:
      
      // OPTION 1: Use Supabase (free database)
      // Sign up at https://supabase.com
      /*
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      
      await supabase.from('payments').insert({
        email: email,
        transaction_id: transactionId,
        status: 'active',
        created_at: new Date()
      });
      */
      
      // OPTION 2: Use Airtable (free, simple)
      // Sign up at https://airtable.com
      /*
      const Airtable = require('airtable');
      const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base('YOUR_BASE_ID');
      
      await base('Payments').create({
        Email: email,
        'Transaction ID': transactionId,
        Status: 'active'
      });
      */
      
      // OPTION 3: Send to Google Sheets (via webhook)
      // Use https://sheet.best or similar service
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500 };
  }
};
