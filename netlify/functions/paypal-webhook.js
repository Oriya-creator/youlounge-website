// netlify/functions/paypal-webhook.js
exports.handler = async (event, context) => {
  console.log('PayPal webhook received:', new Date().toISOString());
  
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('Event type:', body.event_type);
    
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      console.log('✅ PAYMENT COMPLETED!');
      console.log('Payment ID:', body.resource?.id);
      console.log('Amount:', body.resource?.amount?.value);
      console.log('Customer:', body.resource?.payer?.email_address);
      
      // You could save to a database here
      // Example: Save to a simple JSON file or Google Sheets
      
      // Log the payment to console for now
      const paymentData = {
        payment_id: body.resource?.id,
        amount: body.resource?.amount?.value,
        email: body.resource?.payer?.email_address,
        status: 'completed',
        date: new Date().toISOString(),
        program: '21-day'
      };
      
      console.log('Payment to record:', JSON.stringify(paymentData, null, 2));
      
      // TODO: Save this to your preferred database
      // Options: 
      // 1. Google Sheets (simple, free)
      // 2. Airtable (user-friendly)
      // 3. Firebase (powerful)
      // 4. Supabase (PostgreSQL, free tier)
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        message: 'Webhook received'
      })
    };
    
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
