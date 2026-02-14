<?php
// Secret key to verify the request comes from your Netlify function (change to a strong random string)
define('WEBHOOK_SECRET', 'your-secret-key-here');

// Get the raw POST data
$input = json_decode(file_get_contents('php://input'), true);

// Verify secret
if (!isset($input['secret']) || $input['secret'] !== WEBHOOK_SECRET) {
    http_response_code(403);
    die('Forbidden');
}

// Extract payment info
$email = $input['email'] ?? '';
$transaction_id = $input['transaction_id'] ?? '';
$status = $input['status'] ?? 'active';

if (!$email || !$transaction_id) {
    http_response_code(400);
    die('Missing data');
}

// Load existing payments
$file = 'payments.json';
$payments = [];
if (file_exists($file)) {
    $payments = json_decode(file_get_contents($file), true) ?: [];
}

// Add new payment (avoid duplicates by transaction_id or email)
$payments[] = [
    'email' => $email,
    'transaction_id' => $transaction_id,
    'status' => $status,
    'timestamp' => time()
];

// Save back with file locking
file_put_contents($file, json_encode($payments, JSON_PRETTY_PRINT), LOCK_EX);

http_response_code(200);
echo 'OK';
