<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$status = [
    'state' => 'ready',
    'version' => '',
    'message' => 'ESP GYM is ready.',
    'updated_at_utc' => ''
];
$statusPath = __DIR__ . DIRECTORY_SEPARATOR . '.espgym-deployment-status.json';

if (is_file($statusPath) && filesize($statusPath) <= 4096) {
    $decoded = json_decode((string) @file_get_contents($statusPath), true);
    if (is_array($decoded) && in_array(($decoded['state'] ?? ''), ['deploying', 'ready', 'failed'], true)) {
        $status['state'] = (string) $decoded['state'];
        $status['version'] = preg_match('/^20\d{6}[A-Za-z][A-Za-z0-9._-]*$/', (string) ($decoded['version'] ?? ''))
            ? (string) $decoded['version']
            : '';
        $status['message'] = trim((string) ($decoded['message'] ?? ''));
        $status['updated_at_utc'] = trim((string) ($decoded['updated_at_utc'] ?? ''));
    }
}

$updatedAt = $status['updated_at_utc'] !== '' ? strtotime($status['updated_at_utc']) : false;
if ($status['state'] === 'deploying' && $updatedAt !== false && (time() - $updatedAt) > 1800) {
    $status['state'] = 'failed';
    $status['message'] = 'The update is taking longer than expected. Please try again shortly.';
}

if ($status['message'] === '') {
    $status['message'] = match ($status['state']) {
        'deploying' => 'Please wait. An ESP GYM update is in progress. Loading will begin shortly.',
        'failed' => 'ESP GYM is temporarily unavailable while an update is checked. Please try again shortly.',
        default => 'ESP GYM is ready.'
    };
}

echo json_encode($status, JSON_UNESCAPED_SLASHES);
