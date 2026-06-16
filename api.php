<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$isWindows = DIRECTORY_SEPARATOR === '\\';
$privateRoot = $isWindows
    ? 'C:\\xampp\\telepathyexperiment_private\\cones'
    : '/var/www/telepathyexperiment_private/cones';
$stateDir = $privateRoot . DIRECTORY_SEPARATOR . 'data';
$backupDir = $privateRoot . DIRECTORY_SEPARATOR . 'backup';
$logsDir = $privateRoot . DIRECTORY_SEPARATOR . 'logs';
$configDir = $privateRoot . DIRECTORY_SEPARATOR . 'config';
$pairsDir = $privateRoot . DIRECTORY_SEPARATOR . 'pairs';
$stateFile = $stateDir . DIRECTORY_SEPARATOR . 'session-state.json';
$debugLogFile = $stateDir . DIRECTORY_SEPARATOR . 'debug-log.txt';
$safetyLogFile = $logsDir . DIRECTORY_SEPARATOR . 'safety-log.txt';
$adminSecret = 'x9Qm7L2v8T4p1Zadmin';
$staleMs = 5000;
$roundLifetimeMs = 300000;
$postRoundLifetimeMs = 300000;
$completedRoundLifetimeMs = 300000;
$timeoutNoticeLifetimeMs = 1800000;
$timeoutExitLifetimeMs = 60000;
$sessionRetentionMs = 3600000;
$safetyLogMaxBytes = 51200;
$nowMs = (int) floor(microtime(true) * 1000);

foreach ([$privateRoot, $stateDir, $backupDir, $logsDir, $configDir, $pairsDir] as $directory) {
    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }
}

function format_bytes(int $bytes): string
{
    if ($bytes < 1024) {
        return $bytes . ' B';
    }

    $units = ['KB', 'MB', 'GB', 'TB'];
    $value = (float) $bytes;
    $unitIndex = -1;

    while ($value >= 1024 && $unitIndex < count($units) - 1) {
        $value /= 1024;
        $unitIndex++;
    }

    return number_format($value, $value >= 10 ? 1 : 2) . ' ' . $units[$unitIndex];
}

function get_storage_status(string $path): array
{
    $total = @disk_total_space($path);
    $free = @disk_free_space($path);

    if (!is_numeric($total) || !is_numeric($free)) {
        return [
            'path' => $path,
            'available' => false
        ];
    }

    $totalBytes = max(0, (int) round((float) $total));
    $freeBytes = max(0, (int) round((float) $free));
    $usedBytes = max(0, $totalBytes - $freeBytes);

    return [
        'path' => $path,
        'available' => true,
        'total_bytes' => $totalBytes,
        'free_bytes' => $freeBytes,
        'used_bytes' => $usedBytes,
        'total_formatted' => format_bytes($totalBytes),
        'free_formatted' => format_bytes($freeBytes),
        'used_formatted' => format_bytes($usedBytes)
    ];
}

function get_debug_log_status(string $path): array
{
    $sizeBytes = is_file($path) ? max(0, (int) filesize($path)) : 0;
    return [
        'path' => $path,
        'available' => is_file($path),
        'size_bytes' => $sizeBytes,
        'size_formatted' => format_bytes($sizeBytes)
    ];
}

function load_app_mail_config(string $configDir): array
{
    $configPath = $configDir . DIRECTORY_SEPARATOR . 'zoho-mail.json';
    if (!is_file($configPath)) {
        return [
            'available' => false,
            'message' => 'Mail configuration file is missing.',
            'path' => $configPath
        ];
    }

    $raw = file_get_contents($configPath);
    $parsed = json_decode((string) $raw, true);
    if (!is_array($parsed)) {
        return [
            'available' => false,
            'message' => 'Mail configuration file is not valid JSON.',
            'path' => $configPath
        ];
    }

    $host = trim((string) ($parsed['host'] ?? ''));
    $username = trim((string) ($parsed['username'] ?? ''));
    $password = (string) ($parsed['password'] ?? '');
    $from = trim((string) ($parsed['from_email'] ?? ''));
    $fromName = trim((string) ($parsed['from_name'] ?? 'Telepathy Beginner'));
    $replyTo = trim((string) ($parsed['reply_to'] ?? $from));
    $port = isset($parsed['port']) && is_numeric($parsed['port']) ? (int) $parsed['port'] : 465;
    $security = strtolower(trim((string) ($parsed['security'] ?? 'ssl')));

    if ($host === '' || $username === '' || $password === '' || $from === '') {
        return [
            'available' => false,
            'message' => 'Mail configuration is incomplete.',
            'path' => $configPath
        ];
    }

    if (!in_array($security, ['ssl', 'tls', 'none'], true)) {
        $security = 'ssl';
    }

    return [
        'available' => true,
        'path' => $configPath,
        'host' => $host,
        'port' => $port,
        'security' => $security,
        'username' => $username,
        'password' => $password,
        'from_email' => $from,
        'from_name' => $fromName !== '' ? $fromName : 'Telepathy Beginner',
        'reply_to' => $replyTo !== '' ? $replyTo : $from
    ];
}

function validate_mail_addresses($value): array
{
    $items = is_array($value) ? $value : preg_split('/[;,]+/', (string) $value);
    if (!is_array($items)) {
        return [];
    }

    $addresses = [];
    foreach ($items as $item) {
        $candidate = trim((string) $item);
        if ($candidate === '') {
            continue;
        }
        if (!filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Invalid email address: ' . $candidate);
        }
        $addresses[] = $candidate;
    }

    return array_values(array_unique($addresses));
}

function encode_mail_header(string $value): string
{
    if ($value === '' || preg_match('/^[\x20-\x7E]*$/', $value)) {
        return $value;
    }

    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function build_mail_attachment_part($attachment): string
{
    if ($attachment === null || $attachment === '' || $attachment === []) {
        return '';
    }

    $path = '';
    $filename = '';
    $mimeType = 'application/octet-stream';

    $contentBase64 = '';

    if (is_string($attachment)) {
        $path = $attachment;
        $filename = basename($attachment);
    } elseif (is_array($attachment)) {
        $path = trim((string) ($attachment['path'] ?? ''));
        $filename = trim((string) ($attachment['name'] ?? basename($path)));
        $candidateType = trim((string) ($attachment['type'] ?? ''));
        $contentBase64 = trim((string) ($attachment['content_base64'] ?? ''));
        if ($candidateType !== '') {
            $mimeType = $candidateType;
        }
    }

    if ($contentBase64 !== '') {
        $binary = base64_decode($contentBase64, true);
        if ($binary === false) {
            throw new RuntimeException('Attachment base64 content is invalid.');
        }
        $content = chunk_split(base64_encode($binary));
    } else {
        if ($path === '' || !is_file($path) || !is_readable($path)) {
            throw new RuntimeException('Attachment file is missing or unreadable.');
        }
        $content = chunk_split(base64_encode((string) file_get_contents($path)));
    }

    if ($filename === '') {
        $filename = basename($path);
    }

    $encodedName = encode_mail_header($filename);

    return
        'Content-Type: ' . $mimeType . '; name="' . $encodedName . '"' . "\r\n" .
        'Content-Transfer-Encoding: base64' . "\r\n" .
        'Content-Disposition: attachment; filename="' . $encodedName . '"' . "\r\n\r\n" .
        $content . "\r\n";
}

function build_mail_message(string $fromEmail, string $fromName, string $replyTo, array $to, array $bcc, string $subject, string $body, $attachment = null): array
{
    $boundary = 'tb-' . bin2hex(random_bytes(12));
    $headers = [
        'From: ' . encode_mail_header($fromName) . ' <' . $fromEmail . '>',
        'Reply-To: <' . $replyTo . '>',
        'MIME-Version: 1.0',
        'Date: ' . date(DATE_RFC2822),
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . preg_replace('/[^a-z0-9.-]+/i', '', php_uname('n')) . '>',
        'To: ' . implode(', ', $to)
    ];

    if ($bcc !== []) {
        $headers[] = 'Bcc: ' . implode(', ', $bcc);
    }

    $textPart =
        '--' . $boundary . "\r\n" .
        "Content-Type: text/plain; charset=UTF-8\r\n" .
        "Content-Transfer-Encoding: base64\r\n\r\n" .
        chunk_split(base64_encode($body)) . "\r\n";

    $message = $textPart;
    $attachmentPart = build_mail_attachment_part($attachment);
    if ($attachmentPart !== '') {
        $message .= '--' . $boundary . "\r\n" . $attachmentPart;
    }
    $message .= '--' . $boundary . "--\r\n";

    $headers[] = 'Subject: ' . encode_mail_header($subject);
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';

    return [
        'headers' => $headers,
        'message' => $message
    ];
}

function smtp_send_command($socket, string $command, $expectedCode = null): string
{
    fwrite($socket, $command . "\r\n");
    return smtp_read_response($socket, $expectedCode);
}

function smtp_read_response($socket, $expectedCode = null): string
{
    $response = '';
    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }
        $response .= $line;
        if (preg_match('/^\d{3} /', $line) === 1) {
            break;
        }
    }

    if ($response === '') {
        throw new RuntimeException('SMTP server returned an empty response.');
    }

    if ($expectedCode !== null) {
        $code = (int) substr($response, 0, 3);
        $allowedCodes = is_array($expectedCode) ? $expectedCode : [$expectedCode];
        $normalizedAllowedCodes = array_map(static fn ($value): int => (int) $value, $allowedCodes);
        if (!in_array($code, $normalizedAllowedCodes, true)) {
            throw new RuntimeException('SMTP error: ' . trim($response));
        }
    }

    return $response;
}

function open_smtp_socket(array $config)
{
    $transport = $config['security'] === 'ssl' ? 'ssl://' : '';
    $target = $transport . $config['host'];
    $socket = @fsockopen($target, (int) $config['port'], $errorNumber, $errorText, 20);
    if (!$socket) {
        throw new RuntimeException('Unable to connect to SMTP server: ' . $errorText . ' (' . $errorNumber . ')');
    }

    stream_set_timeout($socket, 20);
    smtp_read_response($socket, 220);

    $hostName = preg_replace('/[^a-z0-9.-]+/i', '', php_uname('n'));
    smtp_send_command($socket, 'EHLO ' . ($hostName !== '' ? $hostName : 'localhost'), 250);

    if ($config['security'] === 'tls') {
        smtp_send_command($socket, 'STARTTLS', 220);
        $cryptoEnabled = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($cryptoEnabled !== true) {
            throw new RuntimeException('Unable to enable TLS for SMTP connection.');
        }
        smtp_send_command($socket, 'EHLO ' . ($hostName !== '' ? $hostName : 'localhost'), 250);
    }

    return $socket;
}

function sendAppMail(string $to, string $bcc, string $subject, string $body, $attachment = null): array
{
    global $configDir;

    $config = load_app_mail_config($configDir);
    if (!($config['available'] ?? false)) {
        throw new RuntimeException((string) ($config['message'] ?? 'Mail configuration is unavailable.'));
    }

    $toList = validate_mail_addresses($to);
    $bccList = validate_mail_addresses($bcc);
    if ($toList === []) {
        throw new RuntimeException('At least one valid To email address is required.');
    }

    $messageParts = build_mail_message(
        (string) $config['from_email'],
        (string) $config['from_name'],
        (string) $config['reply_to'],
        $toList,
        $bccList,
        trim($subject) !== '' ? $subject : '(no subject)',
        $body,
        $attachment
    );

    $socket = open_smtp_socket($config);

    try {
        smtp_send_command($socket, 'AUTH LOGIN', 334);
        smtp_send_command($socket, base64_encode((string) $config['username']), 334);
        smtp_send_command($socket, base64_encode((string) $config['password']), 235);
        smtp_send_command($socket, 'MAIL FROM:<' . $config['from_email'] . '>', 250);

        foreach (array_merge($toList, $bccList) as $recipient) {
            smtp_send_command($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
        }

        smtp_send_command($socket, 'DATA', 354);
        $payload = implode("\r\n", $messageParts['headers']) . "\r\n\r\n" . $messageParts['message'];
        $payload = preg_replace("/(?m)^\./", '..', $payload) ?? $payload;
        fwrite($socket, $payload . "\r\n.\r\n");
        smtp_read_response($socket, 250);
        smtp_send_command($socket, 'QUIT', 221);
    } finally {
        fclose($socket);
    }

    return [
        'ok' => true,
        'to' => $toList,
        'bcc' => $bccList,
        'subject' => $subject
    ];
}

function count_words_in_text(string $text): int
{
    $trimmed = trim($text);
    if ($trimmed === '') {
        return 0;
    }

    $parts = preg_split('/\s+/', $trimmed);
    if (!is_array($parts)) {
        return 0;
    }

    return count(array_filter($parts, static fn ($value): bool => trim((string) $value) !== ''));
}

function build_contact_message_body(string $message, array $metadata): string
{
    $lines = [
        'A contact message was submitted from Telepathy Beginner.',
        '',
        'Message:',
        trim($message),
        '',
        'Context:'
    ];

    $senderEmail = trim((string) ($metadata['sender_email'] ?? ''));
    $lines[] = 'Sender\'s email: ' . ($senderEmail !== '' ? $senderEmail : 'not provided');

    $buildVersion = trim((string) ($metadata['build_version'] ?? ''));
    if ($buildVersion !== '') {
        $lines[] = 'Build version: ' . $buildVersion;
    }

    $ownNames = isset($metadata['own_names']) && is_array($metadata['own_names'])
        ? array_values(array_filter(array_map(static fn ($value): string => trim((string) $value), $metadata['own_names'])))
        : [];
    if ($ownNames !== []) {
        $lines[] = 'Emails on device: ' . implode(' / ', $ownNames);
    }

    $pair = isset($metadata['pair']) && is_array($metadata['pair']) ? $metadata['pair'] : [];
    $receiverName = trim((string) ($pair['receiverName'] ?? ''));
    $senderName = trim((string) ($pair['senderName'] ?? ''));
    if ($receiverName !== '' || $senderName !== '') {
        $lines[] = 'Current pair: Receiver ' . ($receiverName !== '' ? $receiverName : 'unknown') . ' / Sender ' . ($senderName !== '' ? $senderName : 'unknown');
    }

    $location = isset($metadata['location']) && is_array($metadata['location']) ? $metadata['location'] : [];
    $latitude = isset($location['latitude']) ? trim((string) $location['latitude']) : '';
    $longitude = isset($location['longitude']) ? trim((string) $location['longitude']) : '';
    if ($latitude !== '' || $longitude !== '') {
        $lines[] = 'Approximate device location: lat ' . ($latitude !== '' ? $latitude : 'unknown') . ', long ' . ($longitude !== '' ? $longitude : 'unknown');
    }

    $lines[] = 'Server UTC time: ' . gmdate('Y-m-d H:i:s') . ' UTC';

    return implode("\r\n", $lines);
}

function append_capped_log(string $path, string $line, int $maxBytes): void
{
    $payload = $line . PHP_EOL;
    $existing = is_file($path) ? (string) file_get_contents($path) : '';
    $combined = $existing . $payload;

    if (strlen($combined) > $maxBytes) {
        $combined = substr($combined, -$maxBytes);
        $firstNewline = strpos($combined, "\n");
        if ($firstNewline !== false && $firstNewline < strlen($combined) - 1) {
            $combined = substr($combined, $firstNewline + 1);
        }
    }

    file_put_contents($path, $combined, LOCK_EX);
}

function get_disk_usage_analysis(): array
{
    if (PHP_OS_FAMILY !== 'Linux') {
        return [
            'available' => false,
            'message' => 'Disk-usage analysis is available only on the Linux-hosted website, not in this local Windows XAMPP copy.'
        ];
    }

    if (!function_exists('shell_exec')) {
        return [
            'available' => false,
            'message' => 'shell_exec is not available on this server.'
        ];
    }

    $commands = [
        'filesystem' => 'df -h / 2>/dev/null',
        'top_level' => 'du -xhd1 / 2>/dev/null | sort -h | tail -20',
        'var_www' => 'du -xhd1 /var/www 2>/dev/null | sort -h | tail -20'
    ];

    $result = [
        'available' => true,
        'sections' => []
    ];

    foreach ($commands as $label => $command) {
        $output = shell_exec($command);
        $result['sections'][$label] = trim((string) $output);
    }

    if (
        ($result['sections']['filesystem'] ?? '') === '' &&
        ($result['sections']['top_level'] ?? '') === '' &&
        ($result['sections']['var_www'] ?? '') === ''
    ) {
        return [
            'available' => false,
            'message' => 'Disk-usage analysis did not return any output on this server.'
        ];
    }

    return $result;
}

function get_trial_csv_headers(): array
{
    return [
        'export schema/version',
        'round_id',
        'rx name',
        'tx name',
        'local date',
        'local time',
        'sent layout',
        'difficulty level',
        'trial aborted',
        'trial timed out',
        'rx choice1',
        'rx choice2',
        'confidence',
        'rx done rt',
        'utc time',
        'rx location',
        'tx location',
        'sync est',
        'sync best',
        'sync worst'
    ];
}

function normalize_person_name_for_match(string $value): string
{
    return strtolower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
}

function normalize_identifier_for_lookup(string $value): string
{
    return strtolower(trim((string) $value));
}

function normalize_pair_storage_component(string $value): string
{
    $normalized = preg_replace('/[^a-z0-9]+/i', '-', normalize_person_name_for_match($value)) ?? '';
    $normalized = trim($normalized, '-');
    return $normalized !== '' ? $normalized : 'blank';
}

function build_pair_match_key(string $receiverName, string $senderName): string
{
    return normalize_person_name_for_match($receiverName) . '|||' . normalize_person_name_for_match($senderName);
}

function default_launcher_profile_state(): array
{
    return [
        'own_email' => '',
        'current_partner' => '',
        'partner_history' => [],
        'deleted_partners' => [],
        'updated_ms' => 0
    ];
}

function sanitize_string_list(array $values): array
{
    $clean = [];
    foreach ($values as $value) {
        $text = trim((string) $value);
        if ($text === '') {
            continue;
        }
        $clean[] = $text;
    }

    return array_values(array_unique($clean));
}

function get_launcher_profile_entry(array $state, string $role, string $ownEmail): array
{
    $default = default_launcher_profile_state();
    $normalizedRole = $role === 'sender' ? 'sender' : 'receiver';
    $lookupKey = normalize_identifier_for_lookup($ownEmail);
    if ($lookupKey === '') {
        return $default;
    }

    $entry = $state['launcher_profiles'][$lookupKey][$normalizedRole] ?? null;
    if (!is_array($entry)) {
        return array_merge($default, [
            'own_email' => trim($ownEmail)
        ]);
    }

    return [
        'own_email' => trim((string) ($entry['own_email'] ?? $ownEmail)),
        'current_partner' => trim((string) ($entry['current_partner'] ?? '')),
        'partner_history' => sanitize_string_list(is_array($entry['partner_history'] ?? null) ? $entry['partner_history'] : []),
        'deleted_partners' => sanitize_string_list(is_array($entry['deleted_partners'] ?? null) ? $entry['deleted_partners'] : []),
        'updated_ms' => isset($entry['updated_ms']) && is_numeric($entry['updated_ms']) ? (int) $entry['updated_ms'] : 0
    ];
}

function set_launcher_profile_entry(array &$state, string $role, string $ownEmail, array $entry, int $nowMs): array
{
    $normalizedRole = $role === 'sender' ? 'sender' : 'receiver';
    $lookupKey = normalize_identifier_for_lookup($ownEmail);
    if ($lookupKey === '') {
        return default_launcher_profile_state();
    }

    if (!is_array($state['launcher_profiles'] ?? null)) {
        $state['launcher_profiles'] = [];
    }
    if (!is_array($state['launcher_profiles'][$lookupKey] ?? null)) {
        $state['launcher_profiles'][$lookupKey] = [];
    }

    $partnerHistory = sanitize_string_list(is_array($entry['partner_history'] ?? null) ? $entry['partner_history'] : []);
    $deletedPartners = sanitize_string_list(is_array($entry['deleted_partners'] ?? null) ? $entry['deleted_partners'] : []);
    $deletedLookup = array_fill_keys(array_map('normalize_identifier_for_lookup', $deletedPartners), true);
    $partnerHistory = array_values(array_filter(
        $partnerHistory,
        static fn(string $value): bool => !isset($deletedLookup[normalize_identifier_for_lookup($value)])
    ));
    $currentPartner = trim((string) ($entry['current_partner'] ?? ''));
    if ($currentPartner !== '' && !in_array($currentPartner, $partnerHistory, true)) {
        $partnerHistory[] = $currentPartner;
    }

    $stored = [
        'own_email' => trim($ownEmail),
        'current_partner' => $currentPartner,
        'partner_history' => array_values($partnerHistory),
        'deleted_partners' => array_values($deletedPartners),
        'updated_ms' => $nowMs
    ];

    $state['launcher_profiles'][$lookupKey][$normalizedRole] = $stored;
    return $stored;
}

function build_pair_storage_key(string $receiverName, string $senderName, string $sessionCode = ''): string
{
    $receiverKey = normalize_pair_storage_component($receiverName);
    $senderKey = normalize_pair_storage_component($senderName);

    if ($receiverKey === 'blank' && $senderKey === 'blank') {
        $fallback = preg_replace('/[^a-z0-9_]+/i', '-', strtolower($sessionCode)) ?? '';
        $fallback = trim($fallback, '-');
        return $fallback !== '' ? $fallback : 'unassigned-pair';
    }

    return 'rx-' . $receiverKey . '__tx-' . $senderKey;
}

function get_pair_trial_csv_path(string $pairsDir, string $receiverName, string $senderName, string $sessionCode = ''): string
{
    return $pairsDir . DIRECTORY_SEPARATOR . build_pair_storage_key($receiverName, $senderName, $sessionCode) . '.csv';
}

function csv_cell(string $value): string
{
    $sanitized = str_replace(["\r", "\n"], ' ', $value);
    return '"' . str_replace('"', '""', $sanitized) . '"';
}

function read_csv_records(string $path): array
{
    $handle = @fopen($path, 'rb');
    if (!$handle) {
        return [];
    }

    $header = fgetcsv($handle);
    if (!is_array($header)) {
        fclose($handle);
        return [];
    }

    $records = [];
    while (($row = fgetcsv($handle)) !== false) {
        if ($row === [null] || $row === []) {
            continue;
        }

        $record = [];
        foreach ($header as $index => $column) {
            $record[(string) $column] = isset($row[$index]) ? (string) $row[$index] : '';
        }
        $records[] = $record;
    }

    fclose($handle);
    return $records;
}

function append_pair_trial_record(string $pairsDir, array $record, string $sessionCode = ''): array
{
    $roundId = trim((string) ($record['round_id'] ?? ''));
    $receiverName = trim((string) ($record['rx name'] ?? ''));
    $senderName = trim((string) ($record['tx name'] ?? ''));

    if ($roundId === '' || $receiverName === '' || $senderName === '') {
        return [
            'ok' => false,
            'appended' => false,
            'duplicate' => false,
            'message' => 'Trial record is missing receiver name, sender name, or round id.'
        ];
    }

    $headers = get_trial_csv_headers();
    $path = get_pair_trial_csv_path($pairsDir, $receiverName, $senderName, $sessionCode);
    $existingRecords = is_file($path) ? read_csv_records($path) : [];

    foreach ($existingRecords as $existingRecord) {
        if ((string) ($existingRecord['round_id'] ?? '') === $roundId) {
            return [
                'ok' => true,
                'appended' => false,
                'duplicate' => true,
                'path' => $path,
                'message' => 'Trial record for this round id has already been stored.'
            ];
        }
    }

    $isNewFile = !is_file($path) || filesize($path) === 0;
    $line = implode(',', array_map(
        static fn(string $header): string => csv_cell((string) ($record[$header] ?? '')),
        $headers
    )) . PHP_EOL;

    if ($isNewFile) {
        $headerLine = implode(',', array_map('csv_cell', $headers)) . PHP_EOL;
        file_put_contents($path, $headerLine . $line, LOCK_EX);
    } else {
        file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
    }

    return [
        'ok' => true,
        'appended' => true,
        'duplicate' => false,
        'path' => $path,
        'message' => 'Trial record stored on the server.'
    ];
}

function read_all_pair_trial_records(string $pairsDir): array
{
    $records = [];
    $paths = glob($pairsDir . DIRECTORY_SEPARATOR . '*.csv') ?: [];

    foreach ($paths as $path) {
        if (!is_file($path)) {
            continue;
        }

        $records = array_merge($records, read_csv_records($path));
    }

    return $records;
}

function read_pair_trial_records_for_pair(string $pairsDir, array $pairInfo): array
{
    $receiverName = trim((string) ($pairInfo['receiver_name'] ?? ''));
    $senderName = trim((string) ($pairInfo['sender_name'] ?? ''));
    $sessionCode = trim((string) ($pairInfo['session_code'] ?? ''));

    if ($receiverName === '' || $senderName === '') {
        return [];
    }

    $path = get_pair_trial_csv_path($pairsDir, $receiverName, $senderName, $sessionCode);
    if (!is_file($path)) {
        return [];
    }

    return read_csv_records($path);
}

function filter_pair_trial_records(array $records, array $candidatePairs, array $associatedNames, bool $includeAll): array
{
    if ($includeAll) {
        return $records;
    }

    $candidatePairKeys = [];
    foreach ($candidatePairs as $candidatePair) {
        if (!is_array($candidatePair)) {
            continue;
        }

        $receiverName = trim((string) ($candidatePair['receiver_name'] ?? ''));
        $senderName = trim((string) ($candidatePair['sender_name'] ?? ''));
        if ($receiverName === '' || $senderName === '') {
            continue;
        }

        $candidatePairKeys[build_pair_match_key($receiverName, $senderName)] = true;
    }

    $associatedNameSet = [];
    foreach ($associatedNames as $name) {
        $normalized = normalize_person_name_for_match((string) $name);
        if ($normalized !== '') {
            $associatedNameSet[$normalized] = true;
        }
    }

    if (!$candidatePairKeys && !$associatedNameSet) {
        return [];
    }

    $filtered = [];
    foreach ($records as $record) {
        $receiverName = trim((string) ($record['rx name'] ?? ''));
        $senderName = trim((string) ($record['tx name'] ?? ''));
        $pairKey = build_pair_match_key($receiverName, $senderName);

        $matchesCandidatePair = $candidatePairKeys && isset($candidatePairKeys[$pairKey]);
        $receiverMatch = normalize_person_name_for_match($receiverName);
        $senderMatch = normalize_person_name_for_match($senderName);
        $matchesAssociatedName = $associatedNameSet
            && (isset($associatedNameSet[$receiverMatch]) || isset($associatedNameSet[$senderMatch]));

        if (($candidatePairKeys || $associatedNameSet) && !$matchesCandidatePair && !$matchesAssociatedName) {
            continue;
        }

        $filtered[] = $record;
    }

    return $filtered;
}

function build_user_trial_summary(array $records): array
{
    $summary = [];

    foreach ($records as $record) {
        if (!is_array($record)) {
            continue;
        }

        $receiverName = trim((string) ($record['rx name'] ?? ''));
        $senderName = trim((string) ($record['tx name'] ?? ''));
        $localDate = trim((string) ($record['local date'] ?? ''));
        $utcTime = trim((string) ($record['utc time'] ?? ''));
        $lastSortKey = $utcTime !== '' ? $utcTime : $localDate;

        if ($receiverName !== '' && $senderName !== '') {
            $receiverKey = strtolower($receiverName) . '|receiver|' . strtolower($senderName);
            if (!isset($summary[$receiverKey])) {
                $summary[$receiverKey] = [
                    'user_name' => $receiverName,
                    'role' => 'receiver',
                    'partner_name' => $senderName,
                    'trial_count' => 0,
                    'last_date' => $localDate,
                    '_last_sort_key' => $lastSortKey
                ];
            }
            $summary[$receiverKey]['trial_count']++;
            if ($lastSortKey !== '' && strcmp($lastSortKey, (string) ($summary[$receiverKey]['_last_sort_key'] ?? '')) >= 0) {
                $summary[$receiverKey]['_last_sort_key'] = $lastSortKey;
                $summary[$receiverKey]['last_date'] = $localDate;
            }

            $senderKey = strtolower($senderName) . '|sender|' . strtolower($receiverName);
            if (!isset($summary[$senderKey])) {
                $summary[$senderKey] = [
                    'user_name' => $senderName,
                    'role' => 'sender',
                    'partner_name' => $receiverName,
                    'trial_count' => 0,
                    'last_date' => $localDate,
                    '_last_sort_key' => $lastSortKey
                ];
            }
            $summary[$senderKey]['trial_count']++;
            if ($lastSortKey !== '' && strcmp($lastSortKey, (string) ($summary[$senderKey]['_last_sort_key'] ?? '')) >= 0) {
                $summary[$senderKey]['_last_sort_key'] = $lastSortKey;
                $summary[$senderKey]['last_date'] = $localDate;
            }
        }
    }

    $rows = array_map(static function (array $row): array {
        unset($row['_last_sort_key']);
        return $row;
    }, array_values($summary));
    usort($rows, static function (array $left, array $right): int {
        $userCompare = strcasecmp($left['user_name'] ?? '', $right['user_name'] ?? '');
        if ($userCompare !== 0) {
            return $userCompare;
        }

        $roleCompare = strcasecmp($left['role'] ?? '', $right['role'] ?? '');
        if ($roleCompare !== 0) {
            return $roleCompare;
        }

        $partnerCompare = strcasecmp($left['partner_name'] ?? '', $right['partner_name'] ?? '');
        if ($partnerCompare !== 0) {
            return $partnerCompare;
        }

        return (int) ($right['trial_count'] ?? 0) <=> (int) ($left['trial_count'] ?? 0);
    });

    return $rows;
}

function clear_pair_trial_records(string $pairsDir): void
{
    $paths = glob($pairsDir . DIRECTORY_SEPARATOR . '*.csv') ?: [];
    foreach ($paths as $path) {
        if (is_file($path)) {
            @unlink($path);
        }
    }
}

function default_sync_metrics(): array
{
    return [
        'offset_ms' => 0,
        'best_rtt_ms' => null,
        'uncertainty_best_ms' => 0,
        'uncertainty_est_ms' => null,
        'uncertainty_worst_ms' => null
    ];
}

function default_receiver_view(): array
{
    return [
        'phase' => 'idle',
        'confidence_value' => 5,
        'selection_limit' => 1,
        'selected_arrangement_codes' => [],
        'selected_layout_numbers' => [],
        'confidence_locked_at_ms' => null,
        'done_reaction_ms' => null
    ];
}

function default_profile(): array
{
    return [
        'own_email' => '',
        'partner_email' => '',
        'name' => '',
        'location' => ''
    ];
}

function default_session_state(): array
{
    return [
        'sender' => [
            'last_seen_ms' => 0,
            'client_id' => '',
            'profile' => default_profile(),
            'sync' => default_sync_metrics()
        ],
        'receiver' => [
            'last_seen_ms' => 0,
            'client_id' => '',
            'ready' => false,
            'profile' => default_profile(),
            'sync' => default_sync_metrics(),
            'view' => default_receiver_view()
        ],
        'round' => null,
        'post_round' => null,
        'abort_notice' => null,
        'timeout_notice' => null,
        'timeout_exit' => null,
        'stats' => [
            'last_layout_number' => null,
            'last_completed_ms' => null,
            'last_guess_layout_number' => null,
            'last_guess_confidence' => null,
            'last_done_reaction_ms' => null,
            'last_guess_correct' => null,
            'last_guess_submitted_ms' => null
        ],
        'updated_ms' => 0
    ];
}

function prune_inactive_operational_state(array &$state, int $nowMs, int $retentionMs): void
{
    if (!is_array($state['sessions'] ?? null)) {
        $state['sessions'] = [];
    }
    if (!is_array($state['session_registry'] ?? null)) {
        $state['session_registry'] = [];
    }

    foreach (array_keys($state['sessions']) as $sessionCode) {
        $session = $state['sessions'][$sessionCode];
        if (!is_array($session)) {
            unset($state['sessions'][$sessionCode], $state['session_registry'][$sessionCode]);
            continue;
        }

        $updatedMs = isset($session['updated_ms']) && is_numeric($session['updated_ms'])
            ? (int) $session['updated_ms']
            : 0;

        if ($updatedMs > 0 && ($nowMs - $updatedMs) <= $retentionMs) {
            continue;
        }

        unset($state['sessions'][$sessionCode]);
    }

    foreach (array_keys($state['session_registry']) as $sessionCode) {
        $entry = $state['session_registry'][$sessionCode];
        if (!is_array($entry)) {
            unset($state['session_registry'][$sessionCode]);
            continue;
        }

        $updatedMs = isset($entry['updated_ms']) && is_numeric($entry['updated_ms'])
            ? (int) $entry['updated_ms']
            : 0;

        if ($updatedMs > 0 && ($nowMs - $updatedMs) <= $retentionMs) {
            continue;
        }

        unset($state['session_registry'][$sessionCode]);
    }
}

function ensure_session_shape(array &$session): void
{
    $defaults = default_session_state();

    foreach ($defaults as $key => $value) {
        if (!array_key_exists($key, $session)) {
            $session[$key] = $value;
        }
    }

    if (!is_array($session['sender'] ?? null)) {
        $session['sender'] = $defaults['sender'];
    }
    if (!is_array($session['receiver'] ?? null)) {
        $session['receiver'] = $defaults['receiver'];
    }
    if (!is_array($session['sender']['profile'] ?? null)) {
        $session['sender']['profile'] = default_profile();
    }
    if (!is_array($session['receiver']['profile'] ?? null)) {
        $session['receiver']['profile'] = default_profile();
    }
    if (!is_array($session['sender']['sync'] ?? null)) {
        $session['sender']['sync'] = default_sync_metrics();
    }
    if (!is_array($session['receiver']['sync'] ?? null)) {
        $session['receiver']['sync'] = default_sync_metrics();
    }
    if (!is_array($session['receiver']['view'] ?? null)) {
        $session['receiver']['view'] = default_receiver_view();
    }
    if (!is_array($session['stats'] ?? null)) {
        $session['stats'] = $defaults['stats'];
    }
    if (!array_key_exists('post_round', $session)) {
        $session['post_round'] = null;
    }
    if (!array_key_exists('abort_notice', $session)) {
        $session['abort_notice'] = null;
    }
    if (!array_key_exists('timeout_notice', $session)) {
        $session['timeout_notice'] = null;
    }
    if (!array_key_exists('timeout_exit', $session)) {
        $session['timeout_exit'] = null;
    }
    if (!array_key_exists('updated_ms', $session)) {
        $session['updated_ms'] = 0;
    }
}

function normalize_profile(array $profile): array
{
    $ownEmail = isset($profile['own_email'])
        ? trim((string) $profile['own_email'])
        : trim((string) ($profile['name'] ?? ''));
    $partnerEmail = isset($profile['partner_email']) ? trim((string) $profile['partner_email']) : '';
    $name = isset($profile['name']) ? trim((string) $profile['name']) : $ownEmail;
    $location = isset($profile['location']) ? trim((string) $profile['location']) : '';

    return [
        'own_email' => $ownEmail,
        'partner_email' => $partnerEmail,
        'name' => $name,
        'location' => $location
    ];
}

function append_debug_log(string $debugLogFile, bool $debugEnabled, string $message): void
{
    if (!$debugEnabled) {
        return;
    }

    file_put_contents($debugLogFile, $message . PHP_EOL, FILE_APPEND);
}

function append_forced_trace(string $safetyLogFile, int $safetyLogMaxBytes, array $payload): void
{
    append_capped_log($safetyLogFile, json_encode($payload, JSON_UNESCAPED_SLASHES), $safetyLogMaxBytes);
}

function apply_abort_to_home(array &$session, int $nowMs, string $role, string $sessionCode, string $debugLogFile, string $safetyLogFile, int $safetyLogMaxBytes, bool $debugEnabled, string $abortReason = ''): void
{
    $partnerLabel = $role === 'sender' ? 'sender' : 'receiver';
    $roundSnapshot = is_array($session['round'] ?? null) ? $session['round'] : null;
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'abort_to_home_called',
        'details' => [
              'abort_reason' => $abortReason,
              'round_id' => $roundSnapshot['id'] ?? '',
              'timeout_notice_present' => is_array($session['timeout_notice'] ?? null),
              'timeout_exit_present' => is_array($session['timeout_exit'] ?? null),
              'abort_notice_present' => is_array($session['abort_notice'] ?? null),
              'receiver_ready' => $session['receiver']['ready'] ?? null,
              'frontend_build_version' => isset($GLOBALS['input']['frontend_build_version']) ? (string) $GLOBALS['input']['frontend_build_version'] : ''
          ]
      ]);
    $abortMessage = $abortReason === 'timeout'
        ? 'Your partner has exited after a timeout and returned to the home screen. Press here to return to the home screen.'
        : ($abortReason === 'disconnect'
            ? 'Your partner detected a disconnect and returned to the home screen. Press here to return to the home screen.'
            : "Your partner has quit this trial and returned to the home screen. Press here to return to the home screen.");
    $session['abort_notice'] = [
        'created_ms' => $nowMs,
        'by_role' => $role,
        'message' => $abortMessage,
        'round_snapshot' => $roundSnapshot
    ];
    $session['post_round'] = null;
    $session['round'] = null;
    $session['receiver']['ready'] = false;
    $session['receiver']['view'] = default_receiver_view();
    $session['timeout_notice'] = null;
    $session['timeout_exit'] = null;
    append_debug_log(
        $debugLogFile,
        $debugEnabled,
        json_encode([
            'time_ms' => $nowMs,
            'session_code' => $sessionCode,
            'role' => $role,
            'label' => 'abort_to_home',
            'details' => [
                'by_role' => $partnerLabel,
                'abort_reason' => $abortReason
            ]
        ], JSON_UNESCAPED_SLASHES)
    );
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'abort_to_home_applied',
        'details' => [
            'abort_reason' => $abortReason,
            'abort_message' => $abortMessage,
            'receiver_ready' => $session['receiver']['ready'] ?? null,
            'round_present_after' => is_array($session['round'] ?? null),
            'timeout_notice_present_after' => is_array($session['timeout_notice'] ?? null),
            'timeout_exit_present_after' => is_array($session['timeout_exit'] ?? null),
            'abort_notice_present_after' => is_array($session['abort_notice'] ?? null)
        ]
    ]);
}

function is_admin_profile(array $profile, string $adminSecret): bool
{
    $ownEmail = isset($profile['own_email']) ? trim((string) $profile['own_email']) : '';
    return $ownEmail !== '' && hash_equals(strtolower($adminSecret), strtolower($ownEmail));
}

function is_admin_secret_candidate($value, string $adminSecret): bool
{
    $candidate = trim((string) $value);
    return $candidate !== '' && hash_equals(strtolower($adminSecret), strtolower($candidate));
}

function normalize_difficulty_level($value): string
{
    $level = trim((string) $value);
    return in_array($level, ['1', '2', '3'], true) ? $level : '1';
}

function build_email_test_attachment(array $input)
{
    $attachment = isset($input['attachment']) && is_array($input['attachment'])
        ? $input['attachment']
        : null;

    if (!is_array($attachment)) {
        return null;
    }

    $name = trim((string) ($attachment['name'] ?? ''));
    $type = trim((string) ($attachment['type'] ?? 'application/octet-stream'));
    $contentBase64 = trim((string) ($attachment['content_base64'] ?? ''));

    if ($name === '' || $contentBase64 === '') {
        return null;
    }

    return [
        'name' => $name,
        'type' => $type !== '' ? $type : 'application/octet-stream',
        'content_base64' => $contentBase64
    ];
}

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($input)) {
    $input = [];
}

$action = isset($input['action']) ? (string) $input['action'] : 'heartbeat';
$role = isset($input['role']) ? (string) $input['role'] : '';
$clientId = isset($input['client_id']) ? (string) $input['client_id'] : '';
$sessionCode = isset($input['session_code']) ? trim((string) $input['session_code']) : '';
if ($sessionCode === '') {
    $sessionCode = 'default-session';
}

if (isset($input['stale_ms']) && is_numeric($input['stale_ms'])) {
    $staleMs = max(1000, (int) $input['stale_ms']);
}

$handle = fopen($stateFile, 'c+');
if ($handle === false) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Unable to open state file.',
        'server_now_ms' => $nowMs
    ]);
    exit;
}

flock($handle, LOCK_EX);
$raw = stream_get_contents($handle);
$state = json_decode($raw ?: '', true);

if (!is_array($state)) {
    $state = [
        'sessions' => [],
        'session_registry' => [],
        'pair_difficulties' => [],
        'launcher_profiles' => [],
        'debug_enabled' => false
    ];
}

if (!array_key_exists('sessions', $state)) {
    $legacySession = $state;
    $state = [
        'sessions' => [
            'default-session' => is_array($legacySession) ? $legacySession : default_session_state()
        ],
        'session_registry' => [],
        'pair_difficulties' => [],
        'launcher_profiles' => [],
        'debug_enabled' => false
    ];
}

if (!is_array($state['sessions'] ?? null)) {
    $state['sessions'] = [];
}
if (!is_array($state['session_registry'] ?? null)) {
    $state['session_registry'] = [];
}
if (!is_array($state['pair_difficulties'] ?? null)) {
    $state['pair_difficulties'] = [];
}
if (!is_array($state['launcher_profiles'] ?? null)) {
    $state['launcher_profiles'] = [];
}
if (!array_key_exists('debug_enabled', $state)) {
    $state['debug_enabled'] = false;
}

prune_inactive_operational_state($state, $nowMs, $sessionRetentionMs);

if (!array_key_exists($sessionCode, $state['sessions']) || !is_array($state['sessions'][$sessionCode])) {
    $state['sessions'][$sessionCode] = default_session_state();
}

ensure_session_shape($state['sessions'][$sessionCode]);
$session =& $state['sessions'][$sessionCode];
$debugEnabled = (bool) $state['debug_enabled'];
$profileInput = isset($input['profile']) && is_array($input['profile']) ? normalize_profile($input['profile']) : default_profile();
$secretCandidate = isset($input['secret_candidate']) ? (string) $input['secret_candidate'] : '';
$isAdmin = is_admin_profile($profileInput, $adminSecret) || is_admin_secret_candidate($secretCandidate, $adminSecret);
$trialRecordAppendResult = null;

$existingRegistry = is_array($state['session_registry'][$sessionCode] ?? null)
    ? $state['session_registry'][$sessionCode]
    : [];
$existingPairDifficulty = is_array($state['pair_difficulties'][$sessionCode] ?? null)
    ? $state['pair_difficulties'][$sessionCode]
    : [];
$state['session_registry'][$sessionCode] = [
    'updated_ms' => $nowMs,
    'sender_name' => $existingRegistry['sender_name'] ?? ($session['sender']['profile']['name'] ?? ''),
    'receiver_name' => $existingRegistry['receiver_name'] ?? ($session['receiver']['profile']['name'] ?? '')
];
$state['pair_difficulties'][$sessionCode] = [
    'updated_ms' => isset($existingPairDifficulty['updated_ms']) && is_numeric($existingPairDifficulty['updated_ms'])
        ? (int) $existingPairDifficulty['updated_ms']
        : $nowMs,
    'sender_name' => trim((string) ($existingPairDifficulty['sender_name'] ?? ($state['session_registry'][$sessionCode]['sender_name'] ?? ''))),
    'receiver_name' => trim((string) ($existingPairDifficulty['receiver_name'] ?? ($state['session_registry'][$sessionCode]['receiver_name'] ?? ''))),
    'difficulty_level' => normalize_difficulty_level($existingPairDifficulty['difficulty_level'] ?? ($existingRegistry['difficulty_level'] ?? '1'))
];

if (is_array($session['timeout_notice'] ?? null)) {
    $timeoutNoticeCreatedMs = isset($session['timeout_notice']['created_ms']) && is_numeric($session['timeout_notice']['created_ms'])
        ? (int) $session['timeout_notice']['created_ms']
        : 0;

    if ($timeoutNoticeCreatedMs > 0 && ($nowMs - $timeoutNoticeCreatedMs) > $timeoutNoticeLifetimeMs) {
        $session['timeout_notice'] = null;
    }
}

if (is_array($session['timeout_exit'] ?? null)) {
    $timeoutExitCreatedMs = isset($session['timeout_exit']['created_ms']) && is_numeric($session['timeout_exit']['created_ms'])
        ? (int) $session['timeout_exit']['created_ms']
        : 0;

    if ($timeoutExitCreatedMs > 0 && ($nowMs - $timeoutExitCreatedMs) > $timeoutExitLifetimeMs) {
        $session['timeout_exit'] = null;
    }
}

if (is_array($session['post_round'] ?? null)) {
    $postRoundUpdatedMs = isset($session['post_round']['updated_ms']) && is_numeric($session['post_round']['updated_ms'])
        ? (int) $session['post_round']['updated_ms']
        : 0;

    if ($postRoundUpdatedMs > 0 && ($nowMs - $postRoundUpdatedMs) > $postRoundLifetimeMs) {
        $session['timeout_notice'] = [
            'created_ms' => $nowMs,
            'message' => 'A timeout has occurred. Press to exit.',
            'round_snapshot' => is_array($session['round'] ?? null) ? $session['round'] : null
        ];
        append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
            'time_ms' => $nowMs,
            'session_code' => $sessionCode,
            'role' => $role,
            'label' => 'timeout_notice_created_post_round',
            'details' => [
                'round_id' => $session['round']['id'] ?? '',
                'receiver_ready' => $session['receiver']['ready'] ?? null
            ]
        ]);
        $session['post_round'] = null;
        $session['round'] = null;
        $session['receiver']['ready'] = false;
        $session['receiver']['view'] = default_receiver_view();
    }
}

if (($nowMs - (int) ($session['sender']['last_seen_ms'] ?? 0)) > $staleMs) {
    $session['sender']['last_seen_ms'] = 0;
    $session['sender']['client_id'] = '';
    $session['sender']['sync'] = default_sync_metrics();
}

if (($nowMs - (int) ($session['receiver']['last_seen_ms'] ?? 0)) > $staleMs) {
    $session['receiver']['last_seen_ms'] = 0;
    $session['receiver']['client_id'] = '';
    $session['receiver']['ready'] = false;
    $session['receiver']['sync'] = default_sync_metrics();
    $session['receiver']['view'] = default_receiver_view();
}

$roleConflict = null;
if (($role === 'sender' || $role === 'receiver') && $clientId !== '') {
    $slotClientId = isset($session[$role]['client_id']) ? (string) $session[$role]['client_id'] : '';
    $slotLastSeenMs = isset($session[$role]['last_seen_ms']) && is_numeric($session[$role]['last_seen_ms'])
        ? (int) $session[$role]['last_seen_ms']
        : 0;

    if ($slotClientId !== '' && $slotClientId !== $clientId && $slotLastSeenMs > 0) {
        $otherRole = $role === 'sender' ? 'receiver' : 'sender';
        $roleConflict = [
            'role' => $role,
            'message' => sprintf(
                'This sender-receiver pair already has an active %s. Press here to return to the home screen and choose %s instead.',
                $role,
                ucfirst($otherRole)
            )
        ];
    }
}

if (is_array($session['round'] ?? null) && isset($session['round']['start_server_ms'])) {
    $roundHasResult = isset($session['round']['layout_number']) && is_numeric($session['round']['layout_number']);
    $roundLastActivityMs = isset($session['round']['last_activity_ms']) && is_numeric($session['round']['last_activity_ms'])
        ? (int) $session['round']['last_activity_ms']
        : (int) $session['round']['start_server_ms'];
    $roundAgeMs = $nowMs - $roundLastActivityMs;
    $completedAgeMs = isset($session['round']['completed_server_ms']) && is_numeric($session['round']['completed_server_ms'])
        ? $nowMs - (int) $session['round']['completed_server_ms']
        : $roundAgeMs;

    if (!is_array($session['post_round'])) {
        if (!$roundHasResult && $roundAgeMs > $roundLifetimeMs) {
            $session['timeout_notice'] = [
                'created_ms' => $nowMs,
                'message' => 'A timeout has occurred. Press to exit.',
                'round_snapshot' => is_array($session['round'] ?? null) ? $session['round'] : null
            ];
            append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => $role,
                'label' => 'timeout_notice_created_round_age',
                'details' => [
                    'round_id' => $session['round']['id'] ?? '',
                    'round_has_result' => false,
                    'receiver_ready' => $session['receiver']['ready'] ?? null
                ]
            ]);
            $session['round'] = null;
            $session['receiver']['ready'] = false;
            $session['receiver']['view'] = default_receiver_view();
        } elseif ($roundHasResult && $completedAgeMs > $completedRoundLifetimeMs) {
            $session['timeout_notice'] = [
                'created_ms' => $nowMs,
                'message' => 'A timeout has occurred. Press to exit.',
                'round_snapshot' => is_array($session['round'] ?? null) ? $session['round'] : null
            ];
            append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => $role,
                'label' => 'timeout_notice_created_completed_age',
                'details' => [
                    'round_id' => $session['round']['id'] ?? '',
                    'round_has_result' => true,
                    'receiver_ready' => $session['receiver']['ready'] ?? null
                ]
            ]);
            $session['round'] = null;
            $session['receiver']['ready'] = false;
            $session['receiver']['view'] = default_receiver_view();
        }
    }
}

if (!is_array($session['round'] ?? null) && is_array($session['post_round'])) {
    $session['post_round'] = null;
}

if (!empty($input['mark_interaction']) && is_array($session['round'] ?? null)) {
    $session['round']['last_activity_ms'] = $nowMs;
    if (is_array($session['post_round'] ?? null)) {
        $session['post_round']['updated_ms'] = $nowMs;
    }
}

if ($roleConflict === null && $role === 'sender') {
    $session['sender']['last_seen_ms'] = $nowMs;
    $session['sender']['client_id'] = $clientId;
    $session['sender']['profile'] = $profileInput;

    if (isset($input['sync_metrics']) && is_array($input['sync_metrics'])) {
        $session['sender']['sync'] = [
            'offset_ms' => isset($input['sync_metrics']['offset_ms']) && is_numeric($input['sync_metrics']['offset_ms']) ? (int) $input['sync_metrics']['offset_ms'] : 0,
            'best_rtt_ms' => isset($input['sync_metrics']['best_rtt_ms']) && is_numeric($input['sync_metrics']['best_rtt_ms']) ? max(0, (int) $input['sync_metrics']['best_rtt_ms']) : null,
            'uncertainty_best_ms' => isset($input['sync_metrics']['uncertainty_best_ms']) && is_numeric($input['sync_metrics']['uncertainty_best_ms']) ? max(0, (int) $input['sync_metrics']['uncertainty_best_ms']) : 0,
            'uncertainty_est_ms' => isset($input['sync_metrics']['uncertainty_est_ms']) && is_numeric($input['sync_metrics']['uncertainty_est_ms']) ? max(0, (int) $input['sync_metrics']['uncertainty_est_ms']) : null,
            'uncertainty_worst_ms' => isset($input['sync_metrics']['uncertainty_worst_ms']) && is_numeric($input['sync_metrics']['uncertainty_worst_ms']) ? max(0, (int) $input['sync_metrics']['uncertainty_worst_ms']) : null
        ];
    }
}

if ($roleConflict === null && $role === 'receiver') {
    $session['receiver']['last_seen_ms'] = $nowMs;
    $session['receiver']['client_id'] = $clientId;
    $session['receiver']['profile'] = $profileInput;

    if (isset($input['sync_metrics']) && is_array($input['sync_metrics'])) {
        $session['receiver']['sync'] = [
            'offset_ms' => isset($input['sync_metrics']['offset_ms']) && is_numeric($input['sync_metrics']['offset_ms']) ? (int) $input['sync_metrics']['offset_ms'] : 0,
            'best_rtt_ms' => isset($input['sync_metrics']['best_rtt_ms']) && is_numeric($input['sync_metrics']['best_rtt_ms']) ? max(0, (int) $input['sync_metrics']['best_rtt_ms']) : null,
            'uncertainty_best_ms' => isset($input['sync_metrics']['uncertainty_best_ms']) && is_numeric($input['sync_metrics']['uncertainty_best_ms']) ? max(0, (int) $input['sync_metrics']['uncertainty_best_ms']) : 0,
            'uncertainty_est_ms' => isset($input['sync_metrics']['uncertainty_est_ms']) && is_numeric($input['sync_metrics']['uncertainty_est_ms']) ? max(0, (int) $input['sync_metrics']['uncertainty_est_ms']) : null,
            'uncertainty_worst_ms' => isset($input['sync_metrics']['uncertainty_worst_ms']) && is_numeric($input['sync_metrics']['uncertainty_worst_ms']) ? max(0, (int) $input['sync_metrics']['uncertainty_worst_ms']) : null
        ];
    }

    if (array_key_exists('receiver_ready', $input)) {
        $session['receiver']['ready'] = (bool) $input['receiver_ready'];
    }

    if (isset($input['receiver_view']) && is_array($input['receiver_view'])) {
        $view = $input['receiver_view'];
        $selectedArrangementCodes = isset($view['selected_arrangement_codes']) && is_array($view['selected_arrangement_codes'])
            ? array_values(array_filter($view['selected_arrangement_codes'], static fn ($value): bool => is_string($value) && $value !== ''))
            : [];
        $selectedLayoutNumbers = isset($view['selected_layout_numbers']) && is_array($view['selected_layout_numbers'])
            ? array_values(array_filter($view['selected_layout_numbers'], static fn ($value): bool => is_numeric($value)))
            : [];

        $session['receiver']['view'] = [
            'phase' => isset($view['phase']) ? (string) $view['phase'] : 'idle',
            'confidence_value' => isset($view['confidence_value']) && is_numeric($view['confidence_value']) ? max(0, min(10, (int) $view['confidence_value'])) : 5,
            'selection_limit' => isset($view['selection_limit']) && is_numeric($view['selection_limit']) ? max(1, min(2, (int) $view['selection_limit'])) : 1,
            'selected_arrangement_codes' => $selectedArrangementCodes,
            'selected_layout_numbers' => $selectedLayoutNumbers,
            'confidence_locked_at_ms' => isset($view['confidence_locked_at_ms']) && is_numeric($view['confidence_locked_at_ms']) ? (int) $view['confidence_locked_at_ms'] : null,
            'done_reaction_ms' => isset($view['done_reaction_ms']) && is_numeric($view['done_reaction_ms']) ? max(0, (int) $view['done_reaction_ms']) : null
        ];
    }
}

$state['session_registry'][$sessionCode]['sender_name'] = $session['sender']['profile']['name'] ?? '';
$state['session_registry'][$sessionCode]['receiver_name'] = $session['receiver']['profile']['name'] ?? '';
$state['pair_difficulties'][$sessionCode]['sender_name'] = $state['session_registry'][$sessionCode]['sender_name'];
$state['pair_difficulties'][$sessionCode]['receiver_name'] = $state['session_registry'][$sessionCode]['receiver_name'];
$state['pair_difficulties'][$sessionCode]['updated_ms'] = $nowMs;

if ($action === 'log_debug') {
    $label = isset($input['label']) ? (string) $input['label'] : 'debug';
    $details = isset($input['details']) && is_array($input['details']) ? $input['details'] : [];
    append_debug_log(
        $debugLogFile,
        $debugEnabled,
        json_encode([
            'time_ms' => $nowMs,
            'session_code' => $sessionCode,
            'role' => $role,
            'label' => $label,
            'details' => $details
        ], JSON_UNESCAPED_SLASHES)
    );
}

if ($action === 'trace_client') {
    $label = isset($input['label']) ? (string) $input['label'] : 'client_trace';
    $details = isset($input['details']) && is_array($input['details']) ? $input['details'] : [];
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => $label,
        'details' => $details
    ]);
}

if ($action === 'heartbeat' && is_array($session['abort_notice'] ?? null)) {
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'heartbeat_with_abort_notice',
        'details' => [
            'frontend_build_version' => isset($input['frontend_build_version']) ? (string) $input['frontend_build_version'] : '',
            'abort_by_role' => $session['abort_notice']['by_role'] ?? '',
            'receiver_ready' => $session['receiver']['ready'] ?? null
        ]
    ]);
}

if ($action === 'set_debug_enabled' && $isAdmin) {
    $state['debug_enabled'] = !empty($input['enabled']);
    $debugEnabled = (bool) $state['debug_enabled'];
}

if ($action === 'check_admin_secret') {
    $response = [
        'ok' => true,
        'admin_secret_match' => is_admin_secret_candidate($secretCandidate, $adminSecret)
    ];
    echo json_encode($response);
    fclose($handle);
    exit;
}

if ($action === 'get_launcher_profile') {
    $launcherRole = isset($input['launcher_role']) ? (string) $input['launcher_role'] : '';
    $ownEmail = trim((string) ($input['own_email'] ?? ''));
    $response = [
        'ok' => true,
        'launcher_profile' => get_launcher_profile_entry($state, $launcherRole, $ownEmail),
        'server_now_ms' => $nowMs
    ];

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($state, JSON_PRETTY_PRINT));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    echo json_encode($response);
    exit;
}

if ($action === 'save_launcher_profile') {
    $launcherRole = isset($input['launcher_role']) ? (string) $input['launcher_role'] : '';
    $ownEmail = trim((string) ($input['own_email'] ?? ''));
    $launcherProfile = isset($input['launcher_profile']) && is_array($input['launcher_profile'])
        ? $input['launcher_profile']
        : [];
    $storedProfile = set_launcher_profile_entry($state, $launcherRole, $ownEmail, $launcherProfile, $nowMs);
    $response = [
        'ok' => true,
        'launcher_profile' => $storedProfile,
        'server_now_ms' => $nowMs
    ];

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($state, JSON_PRETTY_PRINT));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    echo json_encode($response);
    exit;
}

if ($action === 'send_test_email') {
    try {
        $result = sendAppMail(
            isset($input['to']) ? (string) $input['to'] : '',
            isset($input['bcc']) ? (string) $input['bcc'] : '',
            isset($input['subject']) ? (string) $input['subject'] : '',
            isset($input['body']) ? (string) $input['body'] : '',
            build_email_test_attachment($input)
        );

        $response = [
            'ok' => true,
            'mail' => $result,
            'server_now_ms' => $nowMs
        ];
    } catch (Throwable $exception) {
        http_response_code(500);
        $response = [
            'ok' => false,
            'error' => $exception->getMessage(),
            'server_now_ms' => $nowMs
        ];
    }

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($state, JSON_PRETTY_PRINT));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    echo json_encode($response);
    exit;
}

if ($action === 'send_contact_message') {
    try {
        $message = trim((string) ($input['message'] ?? ''));
        $wordCount = count_words_in_text($message);
        if ($message === '') {
            throw new RuntimeException('Please write a message before sending.');
        }
        if ($wordCount > 300) {
            throw new RuntimeException('Please reduce your message to 300 words or fewer.');
        }

        $mailConfig = load_app_mail_config($configDir);
        if (!($mailConfig['available'] ?? false)) {
            throw new RuntimeException((string) ($mailConfig['message'] ?? 'Mail configuration is unavailable.'));
        }

        $metadata = isset($input['metadata']) && is_array($input['metadata']) ? $input['metadata'] : [];
        $adminResult = sendAppMail(
            'dgraboi@sbcglobal.net',
            '',
            'ESP Gym contact message',
            build_contact_message_body($message, $metadata)
        );
        $senderEmail = trim((string) ($metadata['sender_email'] ?? ''));
        $senderResult = sendAppMail(
            $senderEmail,
            '',
            'Message sent to ESP Gym',
            build_contact_message_body($message, $metadata)
        );

        $response = [
            'ok' => true,
            'mail' => [
                'admin_copy' => $adminResult,
                'sender_copy' => $senderResult
            ],
            'server_now_ms' => $nowMs
        ];
    } catch (Throwable $exception) {
        http_response_code(500);
        $response = [
            'ok' => false,
            'error' => $exception->getMessage(),
            'server_now_ms' => $nowMs
        ];
    }

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($state, JSON_PRETTY_PRINT));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    echo json_encode($response);
    exit;
}

if ($action === 'clear_debug_log' && $isAdmin) {
    file_put_contents($debugLogFile, '');
    file_put_contents($safetyLogFile, '');
}

if ($action === 'get_pair_difficulty' || $action === 'set_pair_difficulty') {
    $state['pair_difficulties'][$sessionCode]['difficulty_level'] = normalize_difficulty_level(
        $action === 'set_pair_difficulty'
            ? ($input['difficulty_level'] ?? '1')
            : ($state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1')
    );
    $state['pair_difficulties'][$sessionCode]['updated_ms'] = $nowMs;
}

if ($roleConflict === null && $action === 'append_trial_record') {
    $trialRecord = isset($input['trial_record']) && is_array($input['trial_record'])
        ? $input['trial_record']
        : [];
    $trialRecordAppendResult = append_pair_trial_record($pairsDir, $trialRecord, $sessionCode);
}

if ($roleConflict === null && $action === 'start_round' && $role === 'sender') {
    $requestedStartMs = isset($input['start_server_ms']) && is_numeric($input['start_server_ms'])
        ? (int) round((float) $input['start_server_ms'])
        : $nowMs;

    $session['round'] = [
        'id' => bin2hex(random_bytes(8)),
        'start_server_ms' => $requestedStartMs,
        'beep_end_server_ms' => $requestedStartMs + 8150,
        'created_server_ms' => $nowMs,
        'last_activity_ms' => $nowMs,
        'sender_client_id' => $clientId,
        'layout_number' => null,
        'arrangement_code' => null,
        'completed_server_ms' => null,
        'guess_layout_number' => null,
        'guess_arrangement_code' => null,
        'second_guess_layout_number' => null,
        'second_guess_arrangement_code' => null,
        'guess_confidence' => null,
        'done_reaction_ms' => null,
        'guess_submitted_ms' => null
    ];
    $session['post_round'] = null;
    $session['timeout_notice'] = null;
    $session['receiver']['ready'] = false;
    $session['receiver']['view'] = default_receiver_view();
}

if ($roleConflict === null && $action === 'post_round_choice' && is_array($session['round'] ?? null)) {
    $roundId = isset($input['round_id']) ? (string) $input['round_id'] : '';
    $choice = isset($input['choice']) ? (string) $input['choice'] : '';

    if ($roundId === (string) ($session['round']['id'] ?? '') && ($choice === 'enough' || $choice === 'another')) {
        if (!is_array($session['post_round'])) {
            $session['post_round'] = [
                'sender_choice' => null,
                'receiver_choice' => null,
                'resolved' => null,
                'updated_ms' => $nowMs
            ];
        }

        $choiceKey = $role === 'sender' ? 'sender_choice' : 'receiver_choice';
        if ($session['post_round'][$choiceKey] === null) {
            $session['post_round'][$choiceKey] = $choice;
        }
        $session['round']['last_activity_ms'] = $nowMs;

        if ($session['post_round']['sender_choice'] === 'enough' || $session['post_round']['receiver_choice'] === 'enough') {
            $session['post_round']['resolved'] = 'end';
        } elseif ($session['post_round']['sender_choice'] === 'another' && $session['post_round']['receiver_choice'] === 'another') {
            $session['post_round']['resolved'] = 'continue';
        }

        $session['post_round']['updated_ms'] = $nowMs;
        append_debug_log(
            $debugLogFile,
            $debugEnabled,
            json_encode([
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => $role,
                'label' => 'post_round_choice',
                'details' => [
                    'round_id' => $roundId,
                    'choice' => $choice,
                    'post_round' => $session['post_round']
                ]
            ], JSON_UNESCAPED_SLASHES)
        );
    }
}

if ($roleConflict === null && $action === 'clear_post_round') {
    $mode = isset($input['mode']) ? (string) $input['mode'] : '';

    if ($mode === 'continue' || $mode === 'end') {
        append_debug_log(
            $debugLogFile,
            $debugEnabled,
            json_encode([
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => $role,
                'label' => 'clear_post_round',
                'details' => [
                    'mode' => $mode,
                    'round_before_clear' => $session['round'],
                    'post_round_before_clear' => $session['post_round']
                ]
            ], JSON_UNESCAPED_SLASHES)
        );
        $session['post_round'] = null;
        $session['round'] = null;
        $session['receiver']['ready'] = false;
        $session['receiver']['view'] = default_receiver_view();
        if ($mode === 'end') {
            $session['timeout_exit'] = [
                'created_ms' => $nowMs,
                'reason' => 'post_round_end'
            ];
        }
    }
}

if ($roleConflict === null && $action === 'clear_timeout_notice') {
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'clear_timeout_notice_called',
        'details' => [
              'timeout_notice_present' => is_array($session['timeout_notice'] ?? null),
              'timeout_exit_present' => is_array($session['timeout_exit'] ?? null),
              'abort_notice_present' => is_array($session['abort_notice'] ?? null),
              'receiver_ready' => $session['receiver']['ready'] ?? null,
              'frontend_build_version' => isset($input['frontend_build_version']) ? (string) $input['frontend_build_version'] : ''
          ]
      ]);
    apply_abort_to_home($session, $nowMs, $role, $sessionCode, $debugLogFile, $safetyLogFile, $safetyLogMaxBytes, $debugEnabled, 'timeout');
}

if ($roleConflict === null && $action === 'clear_timeout_exit') {
    $session['timeout_exit'] = null;
}

if ($roleConflict === null && $action === 'abort_to_home') {
    $abortReason = isset($input['abort_reason']) ? (string) $input['abort_reason'] : '';
    apply_abort_to_home($session, $nowMs, $role, $sessionCode, $debugLogFile, $safetyLogFile, $safetyLogMaxBytes, $debugEnabled, $abortReason);
}

if ($roleConflict === null && $action === 'clear_abort_notice') {
    $session['abort_notice'] = null;
}

if ($roleConflict === null && $action === 'complete_round' && $role === 'sender' && is_array($session['round'] ?? null)) {
    if (($session['round']['sender_client_id'] ?? '') === $clientId && isset($input['layout_number']) && is_numeric($input['layout_number'])) {
        $layoutNumber = (int) $input['layout_number'];
        $arrangementCode = isset($input['arrangement_code']) ? (string) $input['arrangement_code'] : '';
        $session['round']['layout_number'] = $layoutNumber;
        $session['round']['arrangement_code'] = $arrangementCode;
        $session['round']['completed_server_ms'] = $nowMs;
        $session['round']['last_activity_ms'] = $nowMs;
        $session['stats']['last_layout_number'] = $layoutNumber;
        $session['stats']['last_completed_ms'] = $nowMs;
        append_debug_log(
            $debugLogFile,
            $debugEnabled,
            json_encode([
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => 'sender',
                'label' => 'complete_round',
                'details' => [
                    'round_id' => $session['round']['id'] ?? '',
                    'layout_number' => $layoutNumber,
                    'arrangement_code' => $arrangementCode
                ]
            ], JSON_UNESCAPED_SLASHES)
        );
    }
}

if ($roleConflict === null && $action === 'submit_guess' && $role === 'receiver' && is_array($session['round'] ?? null)) {
    $guessLayoutNumber = isset($input['guess_layout_number']) && is_numeric($input['guess_layout_number']) ? (int) $input['guess_layout_number'] : null;
    $guessArrangementCode = isset($input['guess_arrangement_code']) ? (string) $input['guess_arrangement_code'] : '';
    $secondGuessLayoutNumber = isset($input['second_guess_layout_number']) && is_numeric($input['second_guess_layout_number']) ? (int) $input['second_guess_layout_number'] : null;
    $secondGuessArrangementCode = isset($input['second_guess_arrangement_code']) ? (string) $input['second_guess_arrangement_code'] : '';
    $difficultyLevel = normalize_difficulty_level($input['difficulty_level'] ?? ($state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1'));
    $guessConfidence = isset($input['confidence']) && is_numeric($input['confidence']) ? max(0, min(10, (int) $input['confidence'])) : null;
    $doneReactionMs = isset($input['done_reaction_ms']) && is_numeric($input['done_reaction_ms']) ? max(0, (int) $input['done_reaction_ms']) : null;
    $roundId = isset($input['round_id']) ? (string) $input['round_id'] : '';

    if ($guessLayoutNumber !== null && $roundId === (string) ($session['round']['id'] ?? '')) {
        $session['round']['guess_layout_number'] = $guessLayoutNumber;
        $session['round']['guess_arrangement_code'] = $guessArrangementCode;
        $session['round']['second_guess_layout_number'] = $secondGuessLayoutNumber;
        $session['round']['second_guess_arrangement_code'] = $secondGuessArrangementCode;
        $session['round']['guess_confidence'] = $guessConfidence;
        $session['round']['done_reaction_ms'] = $doneReactionMs;
        $session['round']['guess_submitted_ms'] = $nowMs;
        $session['round']['last_activity_ms'] = $nowMs;
        $session['stats']['last_guess_layout_number'] = $guessLayoutNumber;
        $session['stats']['last_guess_confidence'] = $guessConfidence;
        $session['stats']['last_done_reaction_ms'] = $doneReactionMs;
        $session['stats']['last_guess_submitted_ms'] = $nowMs;
        $actualLayoutNumber = isset($session['round']['layout_number']) && is_numeric($session['round']['layout_number'])
            ? (int) $session['round']['layout_number']
            : null;
        $session['stats']['last_guess_correct'] =
            $actualLayoutNumber !== null &&
            (
                ($difficultyLevel === '1' && (
                    ($actualLayoutNumber === 1 && $guessLayoutNumber === 1) ||
                    (in_array($actualLayoutNumber, [6, 7, 8, 9], true) && $guessLayoutNumber === 3)
                )) ||
                ($difficultyLevel !== '1' && $guessLayoutNumber === $actualLayoutNumber)
            );
        append_debug_log(
            $debugLogFile,
            $debugEnabled,
            json_encode([
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => 'receiver',
                'label' => 'submit_guess',
                'details' => [
                    'round_id' => $roundId,
                    'guess_layout_number' => $guessLayoutNumber,
                    'guess_arrangement_code' => $guessArrangementCode,
                    'second_guess_layout_number' => $secondGuessLayoutNumber,
                    'second_guess_arrangement_code' => $secondGuessArrangementCode,
                    'difficulty_level' => $difficultyLevel,
                    'guess_confidence' => $guessConfidence,
                    'done_reaction_ms' => $doneReactionMs,
                    'actual_layout_number' => $session['round']['layout_number'] ?? null,
                    'actual_arrangement_code' => $session['round']['arrangement_code'] ?? null
                ]
            ], JSON_UNESCAPED_SLASHES)
        );
    }
}

$session['updated_ms'] = $nowMs;

rewind($handle);
ftruncate($handle, 0);
fwrite($handle, json_encode($state, JSON_PRETTY_PRINT));
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

$response = [
    'ok' => true,
    'server_now_ms' => $nowMs,
    'session_code' => $sessionCode,
    'is_admin' => $isAdmin,
    'debug_enabled' => $debugEnabled,
    'pair_difficulty' => normalize_difficulty_level($state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1'),
    'role_conflict' => $roleConflict,
    'state' => [
        'sender_online' => ((int) ($session['sender']['last_seen_ms'] ?? 0)) > 0,
        'receiver_online' => ((int) ($session['receiver']['last_seen_ms'] ?? 0)) > 0,
        'sender_profile' => $session['sender']['profile'] ?? default_profile(),
        'receiver_profile' => $session['receiver']['profile'] ?? default_profile(),
        'sender_sync' => $session['sender']['sync'] ?? default_sync_metrics(),
        'receiver_sync' => $session['receiver']['sync'] ?? default_sync_metrics(),
        'receiver_ready' => (bool) ($session['receiver']['ready'] ?? false),
        'receiver_view' => $session['receiver']['view'] ?? null,
        'post_round' => $session['post_round'],
        'abort_notice' => $session['abort_notice'],
        'timeout_notice' => $session['timeout_notice'],
        'timeout_exit' => $session['timeout_exit'],
        'round' => $session['round']
    ]
];

if (is_array($trialRecordAppendResult)) {
    $response['trial_record_append'] = $trialRecordAppendResult;
}

if ($isAdmin) {
    $response['storage'] = get_storage_status($stateDir);
    $response['debug_log'] = get_debug_log_status($debugLogFile);
    $response['safety_log'] = get_debug_log_status($safetyLogFile);
}

if ($action === 'analyze_disk_usage' && $isAdmin) {
    $response['disk_usage_analysis'] = get_disk_usage_analysis();
}

if ($action === 'list_all_users' && $isAdmin) {
    $response['user_trial_summary'] = build_user_trial_summary(read_all_pair_trial_records($pairsDir));
}

if ($action === 'start_round') {
    $response['round'] = $session['round'];
}

if ($action === 'complete_round') {
    $response['round'] = $session['round'];
}

if ($action === 'submit_guess') {
    $response['round'] = $session['round'];
    $response['actual_layout_number'] = $session['round']['layout_number'] ?? null;
    $response['actual_arrangement_code'] = $session['round']['arrangement_code'] ?? null;
}

if ($action === 'clear_post_round') {
    $response['round'] = $session['round'];
}

if ($action === 'performance_report') {
    $response['stats'] = $session['stats'] ?? [];
}

if ($action === 'report_csv_data') {
    $allRecords = read_all_pair_trial_records($pairsDir);
    $candidatePairs = isset($input['candidate_pairs']) && is_array($input['candidate_pairs'])
        ? $input['candidate_pairs']
        : [];
    $associatedNames = isset($input['associated_names']) && is_array($input['associated_names'])
        ? $input['associated_names']
        : [];
    $includeAll = $isAdmin && !empty($input['include_all']);
    $filteredRecords = filter_pair_trial_records($allRecords, $candidatePairs, $associatedNames, $includeAll);

    $message = '';
    if (!$allRecords) {
        $message = 'No server-side trial records were found.';
    } elseif (!$filteredRecords) {
        $message = $includeAll
            ? 'No server-side trial records are available right now.'
            : 'No trial records found for the current receiver-sender selection.';
    }

    $response['report_csv'] = [
        'available' => count($filteredRecords) > 0,
        'path' => $pairsDir,
        'records' => $filteredRecords,
        'message' => $message
    ];
}

if ($action === 'report_pair_csv_data') {
    $selectedPair = isset($input['selected_pair']) && is_array($input['selected_pair'])
        ? $input['selected_pair']
        : [];
    $pairRecords = read_pair_trial_records_for_pair($pairsDir, $selectedPair);
    usort($pairRecords, static function (array $left, array $right): int {
        $leftUtc = trim((string) ($left['utc time'] ?? ''));
        $rightUtc = trim((string) ($right['utc time'] ?? ''));
        $leftSort = $leftUtc !== '' ? strtotime($leftUtc) : 0;
        $rightSort = $rightUtc !== '' ? strtotime($rightUtc) : 0;
        return $leftSort <=> $rightSort;
    });

    $selectedReceiver = trim((string) ($selectedPair['receiver_name'] ?? ''));
    $selectedSender = trim((string) ($selectedPair['sender_name'] ?? ''));

    $response['report_csv'] = [
        'available' => count($pairRecords) > 0,
        'path' => ($selectedReceiver !== '' && $selectedSender !== '')
            ? get_pair_trial_csv_path($pairsDir, $selectedReceiver, $selectedSender, trim((string) ($selectedPair['session_code'] ?? '')))
            : $pairsDir,
        'records' => $pairRecords,
        'message' => count($pairRecords) > 0
            ? ''
            : 'No trial records found for the current receiver-sender selection.'
    ];
}

echo json_encode($response);
