exports.handler = async (event) => {
  console.log('PayPal webhook called');
  
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Webhook is working!',
        time: new Date().toISOString()
      })
    };
  }
  
  if (event.httpMethod === 'POST') {
    console.log('Payment data:', event.body);
    
    try {
      const data = JSON.parse(event.body);
      console.log('Event:', data.event_type);
      
      if (data.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const amount = data.resource?.amount?.value;
        const email = data.resource?.payer?.email_address;
        
        console.log(`Payment: $${amount} from ${email}`);
        
        if (amount === '1700.00') {
          console.log('✅ $1700 payment - grant access');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
    
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }
  
  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
