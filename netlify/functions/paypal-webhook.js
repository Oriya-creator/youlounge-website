exports.handler = async (event, context) => {
  console.log('PayPal webhook received at:', new Date().toISOString());
  
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('Event type:', body.event_type);
    console.log('Full webhook data:', JSON.stringify(body, null, 2));
    
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      console.log('✅ $1 PAYMENT COMPLETED SUCCESSFULLY!');
      console.log('Payment ID:', body.resource?.id);
      console.log('Amount:', body.resource?.amount?.value);
      console.log('Customer email:', body.resource?.payer?.email_address);
      
      // Save this payment data
      const paymentData = {
        payment_id: body.resource?.id,
        amount: body.resource?.amount?.value,
        customer_email: body.resource?.payer?.email_address,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
      
      console.log('Payment data to save:', paymentData);
      
      // TODO: Save to your database (Firebase, Airtable, etc.)
      // TODO: Send welcome email
      // TODO: Unlock access for user
      
    } else if (body.event_type === 'CHECKOUT.ORDER.COMPLETED') {
      console.log('🛒 ORDER COMPLETED');
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        message: 'Webhook received',
        timestamp: new Date().toISOString()
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
