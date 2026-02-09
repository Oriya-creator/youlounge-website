exports.handler = async (event, context) => {
  console.log('PayPal webhook received at:', new Date().toISOString());
  
  try {
    // Parse the webhook data
    const body = JSON.parse(event.body || '{}');
    
    // Log everything for debugging
    console.log('Full webhook data:', JSON.stringify(body, null, 2));
    console.log('Event type:', body.event_type);
    console.log('Resource ID:', body.resource?.id);
    console.log('Amount:', body.resource?.amount?.value);
    console.log('Customer email:', body.resource?.payer?.email_address);
    
    // Handle different PayPal events
    if (body.event_type === 'CHECKOUT.ORDER.COMPLETED') {
      console.log('✅ CHECKOUT ORDER COMPLETED');
      console.log('Order ID:', body.resource?.id);
      
      // Save this information - you would normally save to a database
      const orderData = {
        id: body.resource?.id,
        status: 'completed',
        amount: body.resource?.amount?.value,
        currency: body.resource?.amount?.currency_code,
        customer_email: body.resource?.payer?.email_address,
        custom_id: body.resource?.custom_id,
        timestamp: new Date().toISOString()
      };
      
      console.log('Order data to save:', orderData);
      
      // TODO: Save to your database (Firebase, Airtable, etc.)
      // TODO: Send email confirmation
      // TODO: Unlock access for user
      
    } else if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      console.log('💰 PAYMENT CAPTURE COMPLETED');
      console.log('Payment ID:', body.resource?.id);
      
      const paymentData = {
        payment_id: body.resource?.id,
        order_id: body.resource?.supplementary_data?.related_ids?.order_id,
        amount: body.resource?.amount?.value,
        status: body.resource?.status,
        timestamp: new Date().toISOString()
      };
      
      console.log('Payment data:', paymentData);
      
      // This is where you unlock access
      // You would typically:
      // 1. Save to database
      // 2. Send welcome email
      // 3. Create user account
      
    } else if (body.event_type === 'PAYMENT.CAPTURE.DENIED') {
      console.log('❌ PAYMENT DENIED');
    } else {
      console.log('📨 Other event:', body.event_type);
    }
    
    // Always return 200 OK to acknowledge receipt
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Webhook received successfully',
        event_type: body.event_type,
        received_at: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack 
      })
    };
  }
};
