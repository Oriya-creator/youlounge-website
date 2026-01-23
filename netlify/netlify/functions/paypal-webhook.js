const crypto = require('crypto');

// In-memory store (for testing - replace with database in production)
const payments = {
  '21-day': [],
  '90-day': {
    standard: [],
    premium: []
  }
};

exports.handler = async function(event, context) {
  console.log('🟢 PayPal Webhook Called:', event.httpMethod, new Date().toISOString());
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = event.body;
    const headers = event.headers;
    const eventData = JSON.parse(payload);
    
    console.log('📦 PayPal Event Type:', eventData.event_type);
    console.log('📝 Resource ID:', eventData.resource?.id);
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
        console.log('ℹ️ Unhandled event type:', eventData.event_type);
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
  const payerEmail = resource.payer?.email_address || 'unknown@example.com';
  
  console.log('💰 PAYMENT RECEIVED - Full Details:', {
    orderId,
    amount: `$${amount}`,
    customId,
    description,
    payerEmail
  });
  
  // DETERMINE PROGRAM FROM custom_id
  let program = 'unknown';
  let tier = 'standard';
  
  // Check custom_id (most reliable)
  if (customId.includes('21day')) {
    program = '21-day';
    console.log('✅ PROGRAM IDENTIFIED: 21-Day Executive Governance');
  } 
  else if (customId.includes('90day')) {
    program = '90-day';
    
    // Check if premium or standard
    if (customId.includes('premium')) {
      tier = 'premium';
      console.log('✅ PROGRAM IDENTIFIED: 90-Day Premium ($30,000)');
    } else {
      tier = 'standard';
      console.log('✅ PROGRAM IDENTIFIED: 90-Day Standard ($15,000)');
    }
  }
  // Fallback: Check by amount
  else if (amount === '15000.00') {
    console.log('⚠️ $15,000 payment without clear program identifier');
    program = '90-day'; // Default to 90-day
    tier = 'standard';
  }
  else if (amount === '30000.00') {
    program = '90-day';
    tier = 'premium';
    console.log('✅ PROGRAM IDENTIFIED BY AMOUNT: 90-Day Premium');
  }
  else {
    console.log('❓ Unknown payment type - check custom_id or amount');
  }
  
  // Store payment record (in production, save to database)
  const paymentRecord = {
    id: orderId,
    amount: amount,
    program: program,
    tier: tier,
    customId: customId,
    email: payerEmail,
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Simple in-memory storage (for testing)
  if (program === '21-day') {
    payments['21-day'].push(paymentRecord);
  } else if (program === '90-day') {
    payments[program][tier].push(paymentRecord);
  }
  
  console.log('💾 Payment stored successfully');
  console.log('📊 Current payment counts:', {
    '21-day': payments['21-day'].length,
    '90-day-standard': payments['90-day'].standard.length,
    '90-day-premium': payments['90-day'].premium.length
  });
  
  // TODO: In production, save to database and send email
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      success: true,
      message: 'Payment processed successfully',
      data: {
        program: program,
        tier: tier,
        orderId: orderId,
        amount: amount,
        email: payerEmail
      }
    })
  };
}
