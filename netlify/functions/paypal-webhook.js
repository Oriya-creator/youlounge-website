// netlify/functions/paypal-webhook.js
const fetch = require('node-fetch'); // if needed, but Netlify includes it

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('Event type:', body.event_type);

    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const email = body.resource?.payer?.email_address;
      const transactionId = body.resource?.id;

      if (!email || !transactionId) {
        console.error('Missing email or transaction ID');
        return { statusCode: 200, body: 'Missing data, but still acknowledged' };
      }

      // Call your PHP endpoint
      const phpEndpoint = 'https://yoursite.com/payment-webhook.php'; // change to your actual URL
      const secret = 'your-secret-key-here'; // same as in PHP

      const response = await fetch(phpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          email,
          transaction_id: transactionId,
          status: 'active'
        })
      });

      if (!response.ok) {
        console.error('PHP endpoint error:', await response.text());
      } else {
        console.log('Payment recorded for', email);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 500, body: 'Error' };
  }
};
