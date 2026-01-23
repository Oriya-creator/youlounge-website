// Simple storage for testing
const testPayments = {
  // Test payments for development
  'test-21day-001': {
    valid: true,
    paymentStatus: 'completed',
    program: '21-day',
    orderId: 'test-21day-001',
    amount: '15000.00',
    verified: new Date().toISOString()
  },
  'test-90day-standard-001': {
    valid: true,
    paymentStatus: 'completed',
    program: '90-day',
    tier: 'standard',
    orderId: 'test-90day-standard-001',
    amount: '15000.00',
    verified: new Date().toISOString()
  },
  'test-90day-premium-001': {
    valid: true,
    paymentStatus: 'completed',
    program: '90-day',
    tier: 'premium',
    orderId: 'test-90day-premium-001',
    amount: '30000.00',
    verified: new Date().toISOString()
  }
};

exports.handler = async function(event, context) {
  console.log('🔍 Verify Payment Function Called');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { program, tier, userId, orderId } = JSON.parse(event.body);
    
    console.log('📋 Verification Request:', { 
      program, 
      tier, 
      orderId,
      timestamp: new Date().toISOString() 
    });
    
    // Check test payments first
    if (testPayments[orderId]) {
      console.log('✅ Test payment verified');
      return {
        statusCode: 200,
        body: JSON.stringify({
          ...testPayments[orderId],
          userId: userId,
          accessGranted: true,
          expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      };
    }
    
    // In production, you would:
    // 1. Query your database for this orderId
    // 2. Check with PayPal API for payment status
    // 3. Return appropriate response
    
    // For now, simulate a database query
    const paymentFound = false; // Change this when you have a database
    
    if (paymentFound) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: true,
          paymentStatus: 'completed',
          program: program,
          tier: tier,
          orderId: orderId,
          userId: userId,
          accessGranted: true,
          verified: new Date().toISOString(),
          expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      };
    }
    
    // Payment not found (still processing or not exists)
    console.log('⏳ Payment not found - still processing');
    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: false,
        paymentStatus: 'processing',
        message: 'Payment verification in progress. Please wait...',
        retryIn: 5000 // milliseconds
      })
    };
    
  } catch (error) {
    console.error('💥 Verification Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Verification failed',
        details: error.message 
      })
    };
  }
};
