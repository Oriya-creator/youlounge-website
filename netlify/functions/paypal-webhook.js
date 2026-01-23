const crypto = require('crypto');

// Simple in-memory store for testing
const paymentStore = {};

exports.handler = async function(event, context) {
  console.log('🔔 PayPal Webhook Triggered');
  console.log('📋 Method:', event.httpMethod);
  console.log('📍 Path:', event.path);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed');
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = event.body;
    const headers = event.headers;
    
    // Parse the webhook event
    const eventData = JSON.parse(payload);
    
    console.log('📦 PayPal Event Type:', eventData.event_type);
    console.log('🆔 Resource ID:', eventData.resource?.id);
    console.log('💰 Amount:', eventData.resource?.amount?.value);
    
    // Store for debugging
    paymentStore[eventData.id || Date.now()] = {
      event: eventData.event_type,
      received: new Date().toISOString()
    };
    
    // Handle different event types
    switch (eventData.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        console.log('✅ Payment capture completed');
        return await handlePaymentCompleted(eventData);
        
      case 'PAYMENT.CAPTURE.DENIED':
        console.log('❌ Payment capture denied');
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        console.log('↩️ Payment capture refunded');
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
        
      case 'CUSTOMER.DISPUTE.CREATED':
        console.log('⚠️ Customer dispute created');
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
        
      case 'CHECKOUT.ORDER.COMPLETED':
        console.log('🛒 Checkout order completed');
        return await handleOrderCompleted(eventData);
        
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
        message: error.message,
        timestamp: new Date().toISOString()
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
  
  console.log('💰 PAYMENT COMPLETE DETAILS:', {
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
    console.log('✅ PROGRAM DETECTED: 21-Day Executive Governance');
  } 
  else if (customId.includes('90day')) {
    program = '90-day';
    
    if (customId.includes('premium') || amount === '30000.00') {
      tier = 'premium';
      console.log('✅ PROGRAM DETECTED: 90-Day Premium ($30,000)');
    } else {
      tier = 'standard';
      console.log('✅ PROGRAM DETECTED: 90-Day Standard ($15,000)');
    }
  }
  // Fallback: Check by amount
  else if (amount === '15000.00') {
    program = '90-day';
    tier = 'standard';
    console.log('⚠️ $15,000 payment - assuming 90-Day Standard');
  }
  else if (amount === '30000.00') {
    program = '90-day';
    tier = 'premium';
    console.log('⚠️ $30,000 payment - assuming 90-Day Premium');
  }
  else {
    console.log('❓ Unknown payment type:', { amount, customId, description });
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
  
  console.log('💾 Payment stored for verification:', orderId);
  
  // Send email confirmation (you'll need to implement this)
  await sendConfirmationEmail(payerEmail, program, tier, orderId);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      success: true,
      message: 'Payment processed successfully',
      data: {
        program,
        tier,
        orderId,
        amount
      }
    })
  };
}

async function handleOrderCompleted(eventData) {
  const resource = eventData.resource;
  const orderId = resource.id;
  const amount = resource.purchase_units?.[0]?.amount?.value || '0';
  const customId = resource.purchase_units?.[0]?.custom_id || '';
  
  console.log('🛒 ORDER COMPLETED:', { orderId, amount, customId });
  
  // Process similar to payment capture
  return await handlePaymentCompleted({
    ...eventData,
    resource: {
      ...resource,
      custom_id: customId,
      amount: { value: amount }
    }
  });
}

async function sendConfirmationEmail(email, program, tier, orderId) {
  // TODO: Implement email sending with SendGrid, AWS SES, etc.
  console.log(`📧 Would send email to: ${email}`);
  console.log(`   Program: ${program} ${tier}`);
  console.log(`   Order: ${orderId}`);
  
  // Example using fetch to an email service
  /*
  try {
    const response = await fetch('https://api.your-email-service.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`
      },
      body: JSON.stringify({
        to: email,
        subject: `Sovereign Protocol ${program} Access Confirmation`,
        html: `<h2>Your ${program} ${tier} access has been activated!</h2><p>Order ID: ${orderId}</p>`
      })
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
  */
  
  return true;
}
