// netlify/functions_DISABLED/paypal-webhook.js
const { google } = require('googleapis');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const email = body.resource?.payer?.email_address;
      
      // FREE WAY 1: Store in Google Sheets (takes 5 mins to setup)
      // Go to: sheet.best - free tier, connect Google Sheet
      await fetch('https://sheet.best/api/sheets/YOUR_ID', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          status: 'active',
          date: new Date().toISOString()
        })
      });
      
      // OR FREE WAY 2: Store in Airtable (even simpler)
      // Sign up at airtable.com - free tier
      await fetch('https://api.airtable.com/v0/YOUR_BASE_ID/Payments', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              Email: email,
              Status: 'active'
            }
          }]
        })
      });
    }
    
    return { statusCode: 200 };
  } catch (error) {
    return { statusCode: 500 };
  }
};
