const crypto = require('crypto');

// Simple in-memory store for testing
const paymentStore = {};

exports.handler = async function(event, context) {
  console.log('🔔 PayPal Webhook Called:', new Date().toISOString());
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = event.body;
    const eventData = JSON.parse(payload);
    
    console.log('📦 Event Type:', eventData.event_type);
    console.log('🆔 Resource ID:', eventData.resource?.id);
    console.log('💰 Amount:', eventData.resource?.amount?.value);
    console.log('🏷️ Custom ID:', eventData.resource?.custom_id);
    
    // Handle different event types
    switch (eventData.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        return await handlePaymentCompleted(eventData);
        
      case 'PAYMENT.CAPTURE.DENIED':
        console.log('❌ Payment denied');
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        console.log('↩️ Payment refunded');
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
        
      case 'CUSTOMER.DISPUTE.CREATED':
        console.log('⚠️ Dispute created');
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
        
      default:
        console.log('ℹ️ Unhandled event:', eventData.event_type);
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }
    
  } catch (error) {
    console.error('💥 Webhook Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

async function handlePaymentCompleted(eventData) {
  const resource = eventData.resource;
  const orderId = resource.id;
  const amount = resource.amount?.value || '0';
  const customId = resource.custom_id || '';
  const description = resource.description || '';
  const payerEmail = resource.payer?.email_address || '';
  
  console.log('💰 PAYMENT DETAILS:', {
    orderId,
    amount: `$${amount}`,
    customId,
    description,
    payerEmail: payerEmail ? payerEmail.substring(0, 3) + '***' : 'not provided'
  });
  
  // Determine which program was purchased
  let program = 'unknown';
  let tier = 'standard';
  
  // Check custom_id from PayPal button
  if (customId.includes('21day')) {
    program = '21-day';
    console.log('✅ PROGRAM: 21-Day Executive Governance');
  } 
  else if (customId.includes('90day')) {
    program = '90-day';
    
    if (customId.includes('premium') || amount === '30000.00') {
      tier = 'premium';
      console.log('✅ PROGRAM: 90-Day Premium ($30,000)');
    } else {
      tier = 'standard';
      console.log('✅ PROGRAM: 90-Day Standard ($15,000)');
    }
  }
  // Fallback: Check by amount
  else if (amount === '15000.00') {
    program = '90-day';
    tier = 'standard';
    console.log('⚠️ $15,000 - assuming 90-Day Standard');
  }
  else if (amount === '30000.00') {
    program = '90-day';
    tier = 'premium';
    console.log('⚠️ $30,000 - assuming 90-Day Premium');
  }
  else {
    console.log('❓ Unknown payment type');
  }
  
  // Store payment for verification
  paymentStore[orderId] = {
    status: 'completed',
    program,
    tier,
    orderId,
    amount,
    customId,
    email: payerEmail,
    verified: new Date().toISOString(),
    expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  console.log('💾 Payment stored:', orderId);
  console.log('📊 Store size:', Object.keys(paymentStore).length);
  
  // TODO: Send email confirmation
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      success: true,
      message: 'Payment processed',
      data: {
        program,
        tier,
        orderId,
        amount
      }
    })
  };
}
