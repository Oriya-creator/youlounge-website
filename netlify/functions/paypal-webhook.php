
<?php
// paypal-webhook.php on your server
header('Content-Type: application/json');

// Get the webhook data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Simple logging
file_put_contents('payments.log', date('Y-m-d H:i:s') . " - " . json_encode($data) . "\n", FILE_APPEND);

// Check event type
if (isset($data['event_type'])) {
    
    // Payment completed - GRANT ACCESS
    if ($data['event_type'] == 'PAYMENT.CAPTURE.COMPLETED') {
        
        $transaction_id = $data['resource']['id'];
        $payer_email = $data['resource']['payer']['email_address'];
        $amount = $data['resource']['amount']['value'];
        
        // Only grant access for $1700 payments
        if ($amount == '1700.00') {
            // Save to database or file
            $access_data = [
                'transaction_id' => $transaction_id,
                'email' => $payer_email,
                'access_granted' => date('Y-m-d H:i:s'),
                'status' => 'active'
            ];
            
            // Save to JSON file (simple method)
            $payments = file_exists('payments.json') ? json_decode(file_get_contents('payments.json'), true) : [];
            $payments[$transaction_id] = $access_data;
            file_put_contents('payments.json', json_encode($payments));
            
            // Send welcome email (optional)
            // mail($payer_email, "Access Granted", "Your course is ready...");
        }
    }
    
    // Payment refunded - REVOKE ACCESS
    if ($data['event_type'] == 'PAYMENT.CAPTURE.REFUNDED') {
        $transaction_id = $data['resource']['id'];
        
        // Remove from access list
        if (file_exists('payments.json')) {
            $payments = json_decode(file_get_contents('payments.json'), true);
            if (isset($payments[$transaction_id])) {
                $payments[$transaction_id]['status'] = 'refunded';
                file_put_contents('payments.json', json_encode($payments));
            }
        }
    }
}

// Always return 200 OK to PayPal
http_response_code(200);
echo json_encode(['status' => 'ok']);
?>

