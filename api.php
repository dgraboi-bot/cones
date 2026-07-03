<?php
declare(strict_types=1);

use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\VAPID;
use Minishlink\WebPush\WebPush;

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$requestOrigin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string) $_SERVER['HTTP_ORIGIN']) : '';
$allowedOrigins = [
    'https://espgym.com',
    'https://telepathyexperiment.com',
    'http://localhost',
    'http://127.0.0.1'
];

if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$isWindows = DIRECTORY_SEPARATOR === '\\';
$privateRoot = $isWindows
    ? 'C:\\xampp\\telepathyexperiment_private\\cones'
    : '/var/www/telepathyexperiment_private/cones';
$stateDir = $privateRoot . DIRECTORY_SEPARATOR . 'data';
$backupDir = $privateRoot . DIRECTORY_SEPARATOR . 'backup';
$logsDir = $privateRoot . DIRECTORY_SEPARATOR . 'logs';
$configDir = $privateRoot . DIRECTORY_SEPARATOR . 'config';
$contentDir = $privateRoot . DIRECTORY_SEPARATOR . 'content';
$questionnaireResponsesDir = $contentDir . DIRECTORY_SEPARATOR . 'questionnaires';
$learningCenterLessonsDir = $contentDir . DIRECTORY_SEPARATOR . 'learning-center-lessons';
$learningCenterOutlineFile = $contentDir . DIRECTORY_SEPARATOR . 'learning-center-outline.json';
$contentRepoDir = __DIR__ . DIRECTORY_SEPARATOR . 'content_repo';
$contentRepoLessonsDir = $contentRepoDir . DIRECTORY_SEPARATOR . 'learning-center-lessons';
$learningCenterOutlineRepoFile = $contentRepoDir . DIRECTORY_SEPARATOR . 'learning-center-outline.json';
$pairsDir = $privateRoot . DIRECTORY_SEPARATOR . 'pairs';
$simulationPairsDir = $privateRoot . DIRECTORY_SEPARATOR . 'simulation_pairs';
$webPushConfigFile = $configDir . DIRECTORY_SEPARATOR . 'webpush.json';
$publicImagePairsDir = __DIR__ . DIRECTORY_SEPARATOR . 'imagepairs';
$imagePairsManifestFile = $publicImagePairsDir . DIRECTORY_SEPARATOR . 'pairs.json';
$learnMoreContentFile = $contentDir . DIRECTORY_SEPARATOR . 'learn-more-main.txt';
$clairvoyanceLearnMoreContentFile = $contentDir . DIRECTORY_SEPARATOR . 'learn-more-clairvoyance.txt';
$espLessonsContentFile = $contentDir . DIRECTORY_SEPARATOR . 'esp-lessons.txt';
$learnMoreContentRepoFile = $contentRepoDir . DIRECTORY_SEPARATOR . 'learn-more-main.txt';
$clairvoyanceLearnMoreContentRepoFile = $contentRepoDir . DIRECTORY_SEPARATOR . 'learn-more-clairvoyance.txt';
$espLessonsContentRepoFile = $contentRepoDir . DIRECTORY_SEPARATOR . 'esp-lessons.txt';
$stateFile = $stateDir . DIRECTORY_SEPARATOR . 'session-state.json';
$debugLogFile = $stateDir . DIRECTORY_SEPARATOR . 'debug-log.txt';
$safetyLogFile = $logsDir . DIRECTORY_SEPARATOR . 'safety-log.txt';
$subscriptionEmailLogFile = $logsDir . DIRECTORY_SEPARATOR . 'subscription-email-log.txt';
$adminSecret = 'x9Qm7L2v8T4p1Zadmin';
$staleMs = 5000;
$roundLifetimeMs = 300000;
$postRoundLifetimeMs = 300000;
$completedRoundLifetimeMs = 300000;
$timeoutNoticeLifetimeMs = 1800000;
$timeoutExitLifetimeMs = 60000;
$sessionRetentionMs = 3600000;
$visitorSimulationRetentionMs = 2 * 24 * 60 * 60 * 1000;
$debugLogMaxBytes = 307200;
$safetyLogMaxBytes = 51200;
$handleChangeCooldownMs = 7 * 24 * 60 * 60 * 1000;
$maxHandleSubstantiveChanges = 2;
$maxHandleLifetimeClaims = 3;
$exploreProTrialDurationMs = 14 * 24 * 60 * 60 * 1000;
$exploreProVerificationTtlMs = 15 * 60 * 1000;
$exploreProResendCooldownMs = 30 * 1000;
$nowMs = (int) floor(microtime(true) * 1000);

if (!is_dir($simulationPairsDir)) {
    @mkdir($simulationPairsDir, 0775, true);
}

$defaultLearnMoreMainContent = <<<'TEXT'
INFORMATION ABOUT TELEPATHY
-----------------------------
More than a simple telepathy workout, Telepathy Beginner functions as an online course in telepathy and ESP sensitivity training. The more you know about this skill, the more effective you can become in using it. The purpose of this section is to help users understand what telepathy is, how practice is structured, and what mental habits seem to strengthen performance.

[*] DISTANCE DOES NOT MATTER
---------------------------
Telepathic experience appears to be insensitive to distance. Your experience as a receiver can be essentially the same whether the sender is next to you in the same room, across the country, or far away in another part of the world. This is one reason the app can be used with partners anywhere on earth, as long as both partners can connect to the Internet and enter one another's identifiers correctly.

[sr] WHY PRACTICE MATTERS
------------------------
Telepathy, if it is real, is subtle. Subtle skills are easy to miss without repetition, structure, and feedback. Practice gives the user repeated contact with a narrowly defined task, and immediate scoring allows users to see whether impressions are becoming more accurate over time or whether apparent success was only chance performance. The point is not just belief. The point is disciplined observation.

[s] WHAT THE SENDER LEARNS
-------------------------
The sender is not merely "showing a picture." The sender is learning to stabilize attention, hold a target steadily in awareness, and keep returning to what is actually seen instead of drifting into analysis or fantasy. The sender strengthens the session most by quietly maintaining the real target rather than straining or mentally shouting.

[r] WHAT THE RECEIVER LEARNS
---------------------------
The receiver is learning to notice faint impressions, trust the first clear difference that appears, and remember what briefly flashes into awareness. Often the first useful information is structural rather than semantic: one thing or many, vertical or horizontal, sparse or crowded, simple or complex. The receiver improves by recording what actually appears before analysis washes it away.

[sr] WHY THE LEVELS ARE STRUCTURED
---------------------------------
The levels are designed to move from coarse discrimination toward more refined discrimination. In early work, the task is intentionally simple so that users can learn to detect a reliable difference. Later levels ask for more exact perception and memory. This helps determine whether a pair is merely sensing that "something is different" or is actually transferring more detailed visual information.

[sr] THE APP AS AN ONLINE COURSE
--------------------------------
ESP GYM is meant to be used as a course of development, not merely as a one-time novelty. A good approach is to work repeatedly with the same partner, review the reports, observe whether confidence and speed relate to accuracy, and gradually progress through the levels. In this way the app becomes a guided training environment in which the user learns from both direct experience and recorded results.

[sr] OPEN-MINDEDNESS AND PERSONAL CHANGE
---------------------------------------
These exercises promote increased awareness of subtle impressions, strengthened ability to perceive delicate mental signals, improve memory for fleeting inner events, and potentially strengthen intuitive abilities. They promote greater open-mindedness by encouraging users to explore experiences they may once have thought impossible.

[v] REMOTE VIEWING AS A NEXT STEP
--------------------------------
Remote viewing asks for a related but more demanding skill. Instead of tuning into a live sender, the user attempts to perceive what is happening visually in another place or at another device. For many users it is easier to begin with partner-based telepathy and later experiment with remote viewing, because partner work gives clearer structure, stronger feedback, and more opportunity to build trust in subtle impressions.
TEXT;

$defaultLearnMoreClairvoyanceContent = <<<'TEXT'
CLAIRVOYANCE / REMOTE VIEWING
-----------------------------
This page serves as a study reader for the clairvoyance and remote-viewing side of ESP GYM. Some users find it helpful to read historical case material while training, because repeated exposure to well-known cases makes the subject feel more concrete and less abstract. The items below are not presented as final proof of anything. They are presented as study material that may help clarify what kinds of experiences have been reported.

[*] CROISET LOCATES GIRL IN DIKE
-------------------------------
In this case, Gerard Croiset was consulted after a search failed to find a drowned child. He reportedly described where the body would be found in relation to visible landmarks near a dike, and divers then recovered the child in the described area. Whether one interprets such a case cautiously or strongly, it is the kind of report that has kept interest in clairvoyance alive for decades.
[Croiset Finds Girl in Dike](https://telepathyexperiment.com/doccases/Croiset%20Finds%20Girl%20in%20Dike.pdf)

[*] LOST AND FOUND HARP
----------------------
This case has been preserved in ESP GYM as reading material for study in anomalous knowing and object-location themes. The linked PDF is brief, but it belongs in the collection because it points to the broader question of whether information about a distant or missing object can sometimes be accessed in unusual ways.
[Lost and Found Harp](https://telepathyexperiment.com/doccases/Lost%20and%20Found%20Harp.pdf)

[*] FURTHER CASE STUDY READING
-----------------------------
The following linked readings can be used as a small study sequence for users interested in clairvoyance, spontaneous telepathy, crisis cases, distant physiological response, object reading, and other psi-related claims:

[Telepathy at Forty Miles](https://telepathyexperiment.com/doccases/A%20Fork%20at%20Forty%20Miles.pdf)
[House in London](https://telepathyexperiment.com/doccases/House%20in%20London.pdf)
[Twin Brother's Death](https://telepathyexperiment.com/doccases/Twin%20Brother%20Dies%20in%20Australia.pdf)
[Twin Sisters' Bloody Nose](https://telepathyexperiment.com/doccases/Twin%20Sisters%20Share%20Bloody%20Nose.pdf)
[Physiological Response At a Distance](https://telepathyexperiment.com/doccases/Polygraph%20Needle%20Runs%20Off%20Paper.pdf)
[Involuntary Hitchhiker](https://telepathyexperiment.com/doccases/Involuntary%20Hitchhiker.pdf)
[The Dog Will Be Cured by Some Sort of Shock](https://telepathyexperiment.com/doccases/The%20Dog%20Will%20Be%20Cured%20by%20Some%20Sort%20of%20Shock.pdf)
[Pottery Jar Fragment from Pompeii](https://telepathyexperiment.com/doccases/Pottery%20Jar%20From%20Ruins%20of%20Pompeii.pdf)
[An Image Put on Film](https://telepathyexperiment.com/doccases/Hurkos%20Puts%20Image%20on%20Film.pdf)
[The Dream Happened Two Hours Earlier](https://telepathyexperiment.com/doccases/The%20Dream%20Happened%20Two%20Hours%20Earlier%20Than%20the%20Event.pdf)
[Magnetometer in the Basement](https://telepathyexperiment.com/doccases/The%20Magnetometer%20in%20the%20Basement.pdf)

[*] HOW TO USE THESE READINGS
----------------------------
The best use of this material is not to read it once and forget it, but to let it accompany practice. Read one case, reflect on what kind of information transfer it seems to suggest, then return to the app and train. Over time, the cases, the reports, and your own practice data begin to inform one another. That is the spirit in which this section is provided.
TEXT;

$defaultEspLessonsContent = <<<'TEXT'
[*] Paragraph One
----------------
This is simply a test message for now.

[*] Paragraph Two
----------------
This is an alternate test message to show now.
TEXT;

$defaultLearningCenterOutline = [
    'version' => 1,
    'rows' => [
        [
            'id' => 'baseline',
            'display_number' => '0',
            'title' => 'ESTABLISH A BASELINE',
            'subcopy' => '',
            'type' => 'baseline'
        ],
        [
            'id' => 'distance-does-not-matter',
            'display_number' => '1',
            'title' => 'DISTANCE DOES NOT AFFECT TELEPATHIC COMMUNICATION',
            'subcopy' => 'Speed of telepathic communication · propagation medium · type of encoding',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'everything-is-connected',
            'display_number' => '2',
            'title' => 'EVERYTHING IS CONNECTED',
            'subcopy' => 'People are connected · plants · animals · things? · link to psychometry and how to do it · concept of how things get connected · hair · toothbrush',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'where-is-out-there',
            'display_number' => '3',
            'title' => 'WHERE IS “OUT THERE”?',
            'subcopy' => 'Idea of outside space · outside time · speed of telepathy? · entanglement · link to journal article',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'lost-found-harp',
            'display_number' => '4',
            'title' => 'LOST AND FOUND HARP',
            'subcopy' => 'H. McCoy · this changes everything',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'ossoweicki-and-croisset',
            'display_number' => '5',
            'title' => 'OSSOWEICKI AND CROISSET',
            'subcopy' => 'You will marry a woman named Lydia · The ice-skate blade is showing in the mud',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'related-phenomena',
            'display_number' => '6',
            'title' => 'RELATED PHENOMENA',
            'subcopy' => 'Dogs · psychokinesis · apports · healing · sprouting · rebar bending · videos · psychometry · clairvoyance · precognition · thought forms',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'the-minds-eye',
            'display_number' => '7',
            'title' => 'THE MIND’S EYE',
            'subcopy' => 'How perception works · top down vs. bottom up · top-down projection · visual imagination · visualization exercises',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'learn-the-task-by-first-working-with-a-robot',
            'display_number' => '8',
            'title' => 'LEARN THE TASK BY FIRST WORKING WITH A ROBOT',
            'subcopy' => 'Do a few trials at Level 1 · explore being a receiver · a sender · confidence on and off',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'difference-between-a-robot-and-a-person',
            'display_number' => '9',
            'title' => 'DIFFERENCE BETWEEN A ROBOT AND A PERSON',
            'subcopy' => 'Randomness · chance vs. not chance · the trouble with statistics · it isn’t clear · it’s transient · it’s dim · it fades in and out · low resolution · you can’t care · mizu no kokoro',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'first-real-trials-as-a-receiver',
            'display_number' => '10',
            'title' => 'FIND A PARTNER AND DO YOUR FIRST REAL TRIALS AS A RECEIVER',
            'subcopy' => 'Scheduling · messaging function · spontaneous trials · fill out first session questionnaire',
            'type' => 'after-first-session'
        ],
        [
            'id' => 'debriefing-what-happened-and-performance-reports',
            'display_number' => '11',
            'title' => 'DEBRIEFING: WHAT HAPPENED AND PERFORMANCE REPORTS',
            'subcopy' => 'Raw data · visualization of data · data statistics · GLOBE · questions',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'being-a-sender',
            'display_number' => '12',
            'title' => 'BEING A SENDER',
            'subcopy' => 'Visualize a white circle on a black background with your eyes open · strong sending vs. weak sending · sustained intention',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'sending-trials-with-partner',
            'display_number' => '13',
            'title' => 'SENDING TRIALS WITH PARTNER',
            'subcopy' => '',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'debrief-analysis-questions',
            'display_number' => '14',
            'title' => 'DEBRIEF: ANALYSIS / QUESTIONS',
            'subcopy' => '',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'ongoing-research',
            'display_number' => '15',
            'title' => 'ONGOING RESEARCH',
            'subcopy' => 'PRO topic',
            'type' => 'lesson-page'
        ],
        [
            'id' => 'where-to-go-from-here',
            'display_number' => '16',
            'title' => 'WHERE TO GO FROM HERE',
            'subcopy' => 'PRO topic · journal articles · parapsychology org · ions · sheldrake · anna breitenberg? · consciousness studies · communications with animals · dolphin · macro PK · eric · previous PK experiments · some videos · talk with animals · connect with plants · healing · scientific study of phenomena · proposal to measure the speed of thought propagation',
            'type' => 'lesson-page'
        ]
    ]
];

foreach ([$privateRoot, $stateDir, $backupDir, $logsDir, $configDir, $contentDir, $questionnaireResponsesDir, $learningCenterLessonsDir, $contentRepoDir, $contentRepoLessonsDir, $pairsDir, $publicImagePairsDir] as $directory) {
    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }
}

$composerAutoloadFile = __DIR__ . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
if (is_file($composerAutoloadFile)) {
    require_once $composerAutoloadFile;
}

ensure_demo_pair_records($pairsDir);

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

function load_stripe_config(string $configDir): array
{
    $configPath = $configDir . DIRECTORY_SEPARATOR . 'stripe.json';
    if (!is_file($configPath)) {
        return [
            'available' => false,
            'message' => 'Stripe configuration file is missing.',
            'path' => $configPath
        ];
    }

    $raw = file_get_contents($configPath);
    $parsed = json_decode((string) $raw, true);
    if (!is_array($parsed)) {
        return [
            'available' => false,
            'message' => 'Stripe configuration file is not valid JSON.',
            'path' => $configPath
        ];
    }

    $mode = strtolower(trim((string) ($parsed['mode'] ?? 'sandbox')));
    $publishableKey = trim((string) ($parsed['publishableKey'] ?? ''));
    $secretKey = trim((string) ($parsed['secretKey'] ?? ''));
    $webhookSecret = trim((string) ($parsed['webhookSecret'] ?? ''));
    $successUrl = trim((string) ($parsed['successUrl'] ?? ''));
    $cancelUrl = trim((string) ($parsed['cancelUrl'] ?? ''));
    $prices = is_array($parsed['prices'] ?? null) ? $parsed['prices'] : [];
    $proMonthly = trim((string) ($prices['proMonthly'] ?? ''));
    $proAnnual = trim((string) ($prices['proAnnual'] ?? ''));

    if ($publishableKey === '' || $secretKey === '' || $successUrl === '' || $cancelUrl === '') {
        return [
            'available' => false,
            'message' => 'Stripe configuration is incomplete.',
            'path' => $configPath
        ];
    }

    return [
        'available' => true,
        'path' => $configPath,
        'mode' => $mode === 'live' ? 'live' : 'sandbox',
        'publishableKey' => $publishableKey,
        'secretKey' => $secretKey,
        'webhookSecret' => $webhookSecret,
        'successUrl' => $successUrl,
        'cancelUrl' => $cancelUrl,
        'prices' => [
            'proMonthly' => $proMonthly,
            'proAnnual' => $proAnnual
        ]
    ];
}

function default_subscription_email_templates(): array
{
    return [
        'welcome' => [
            'label' => 'Welcome to ESP Gym',
            'subject' => 'Welcome to ESP Gym PRO',
            'body' => "Welcome to ESP Gym.\n\nYour {{plan_label}} subscription is now active for {{identifier}}.\n\nYou can now use the PRO features in Telepathy Beginner.\n\nThank you for supporting ESP Gym."
        ],
        'annual-reminder' => [
            'label' => 'Annual Subscription Reminder',
            'subject' => 'Your ESP Gym PRO annual renewal is coming up',
            'body' => "Hello,\n\nThis is a reminder that your ESP Gym PRO annual subscription for {{identifier}} is scheduled to renew on {{renewal_date_utc}}.\n\nIf you wish to continue, no action is needed.\n\nThank you for being part of ESP Gym."
        ],
        'annual-thank-you' => [
            'label' => 'Annual Subscription Renewal Thank You',
            'subject' => 'Thank you for renewing ESP Gym PRO',
            'body' => "Thank you for continuing with ESP Gym PRO.\n\nYour annual subscription for {{identifier}} has renewed successfully, and you now have another year of PRO ahead.\n\nWe appreciate your continued participation."
        ],
        'cancellation' => [
            'label' => 'Subscription Cancellation',
            'subject' => 'We are sorry to see you go',
            'body' => "Your ESP Gym PRO subscription for {{identifier}} has been cancelled.\n\nIf you are willing, please tell us why you cancelled and whether you have any suggestions that might bring you back.\n\nThank you for the time you spent with ESP Gym."
        ]
    ];
}

function normalize_subscription_email_template_key($value): string
{
    $key = strtolower(trim((string) $value));
    return in_array($key, ['welcome', 'annual-reminder', 'annual-thank-you', 'cancellation'], true) ? $key : '';
}

function ensure_subscription_email_state(array &$state): void
{
    if (!array_key_exists('subscription_emails_enabled', $state)) {
        $state['subscription_emails_enabled'] = false;
    }
    if (!array_key_exists('subscription_reminders_enabled', $state)) {
        $state['subscription_reminders_enabled'] = false;
    }
    if (!is_array($state['subscription_email_templates'] ?? null)) {
        $state['subscription_email_templates'] = [];
    }

    $defaults = default_subscription_email_templates();
    foreach ($defaults as $key => $template) {
        $existing = is_array($state['subscription_email_templates'][$key] ?? null)
            ? $state['subscription_email_templates'][$key]
            : [];
        $state['subscription_email_templates'][$key] = [
            'label' => trim((string) ($existing['label'] ?? $template['label'])),
            'subject' => trim((string) ($existing['subject'] ?? $template['subject'])),
            'body' => trim((string) ($existing['body'] ?? $template['body']))
        ];
    }
}

function ensure_invitee_state(array &$state): void
{
    if (!is_array($state['invitees'] ?? null)) {
        $state['invitees'] = [];
    }
}

function ensure_email_list_state(array &$state): void
{
    if (!is_array($state['email_list'] ?? null)) {
        $state['email_list'] = [];
    }
}

function normalize_email_list_type($value): string
{
    $type = strtolower(trim((string) $value));
    return $type === 'updates' ? 'updates' : '';
}

function validate_email_list_name_value($value, string $field = 'name'): string
{
    $text = trim(preg_replace('/\s+/', ' ', (string) $value) ?? '');
    if (mb_strlen($text) > 160) {
        throw new RuntimeException($field . ' is too long.');
    }
    return $text;
}

function normalize_email_list_record($email, array $record): array
{
    $cleanEmail = strtolower(trim((string) ($record['email'] ?? $email)));
    return [
        'name' => validate_email_list_name_value($record['name'] ?? ''),
        'email' => validate_invitee_email_value($cleanEmail, 'email'),
        'type' => normalize_email_list_type($record['type'] ?? 'updates') ?: 'updates',
        'acquired_ms' => isset($record['acquired_ms']) && is_numeric($record['acquired_ms']) ? (int) $record['acquired_ms'] : 0,
        'updated_ms' => isset($record['updated_ms']) && is_numeric($record['updated_ms']) ? (int) $record['updated_ms'] : 0
    ];
}

function save_email_list_record(array &$state, string $email, string $type, string $name, int $nowMs): array
{
    ensure_email_list_state($state);
    $cleanEmail = strtolower(trim($email));
    $validatedEmail = validate_invitee_email_value($cleanEmail, 'email');
    $validatedType = normalize_email_list_type($type);
    if ($validatedType === '') {
        throw new RuntimeException('email list type is invalid.');
    }
    $validatedName = validate_email_list_name_value($name);
    $existing = is_array($state['email_list'][$validatedEmail] ?? null) ? $state['email_list'][$validatedEmail] : [];
    $record = [
        'name' => $validatedName !== '' ? $validatedName : validate_email_list_name_value($existing['name'] ?? ''),
        'email' => $validatedEmail,
        'type' => $validatedType,
        'acquired_ms' => isset($existing['acquired_ms']) && is_numeric($existing['acquired_ms']) ? (int) $existing['acquired_ms'] : $nowMs,
        'updated_ms' => $nowMs
    ];
    $state['email_list'][$validatedEmail] = $record;
    return normalize_email_list_record($validatedEmail, $record);
}

function list_email_list_records(array $state): array
{
    ensure_email_list_state($state);
    $records = [];
    foreach ($state['email_list'] as $email => $record) {
        if (!is_array($record)) {
            continue;
        }
        try {
            $records[] = normalize_email_list_record((string) $email, $record);
        } catch (Throwable $exception) {
            continue;
        }
    }
    usort($records, static function (array $a, array $b): int {
        return ((int) ($b['acquired_ms'] ?? 0)) <=> ((int) ($a['acquired_ms'] ?? 0));
    });
    return $records;
}

function validate_invitee_full_name_value($value, string $field = 'full_name'): string
{
    $text = trim(preg_replace('/\s+/', ' ', (string) $value) ?? '');
    if (mb_strlen($text) > 160) {
        throw new RuntimeException($field . ' is too long.');
    }
    return $text;
}

function validate_invitee_email_value($value, string $field = 'email'): string
{
    $text = trim((string) $value);
    if ($text === '') {
        return '';
    }
    if (!filter_var($text, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException($field . ' is invalid.');
    }
    return $text;
}

function validate_invitee_note_value($value, string $field = 'private_note'): string
{
    $text = trim((string) $value);
    if (mb_strlen($text) > 1000) {
        throw new RuntimeException($field . ' is too long.');
    }
    return $text;
}

function normalize_invitee_record($identifier, array $record): array
{
    $preferredIdentifier = trim(preg_replace('/\s+/', ' ', (string) ($record['identifier'] ?? $identifier)) ?? '');
    $cleanIdentifier = $preferredIdentifier !== '' ? $preferredIdentifier : trim(preg_replace('/\s+/', ' ', (string) $identifier) ?? '');
    return [
        'identifier' => $cleanIdentifier,
        'full_name' => validate_invitee_full_name_value($record['full_name'] ?? ''),
        'email' => validate_invitee_email_value($record['email'] ?? ''),
        'private_note' => validate_invitee_note_value($record['private_note'] ?? ''),
        'created_ms' => isset($record['created_ms']) && is_numeric($record['created_ms']) ? (int) $record['created_ms'] : 0,
        'updated_ms' => isset($record['updated_ms']) && is_numeric($record['updated_ms']) ? (int) $record['updated_ms'] : 0
    ];
}

function list_invitees(array $state): array
{
    ensure_invitee_state($state);
    $records = [];
    foreach ($state['invitees'] as $key => $record) {
        if (!is_array($record)) {
            continue;
        }
        $normalized = normalize_invitee_record((string) $key, $record);
        if ($normalized['identifier'] === '') {
            continue;
        }
        $records[] = $normalized;
    }

    usort($records, static function (array $a, array $b): int {
        return ((int) ($b['updated_ms'] ?? 0)) <=> ((int) ($a['updated_ms'] ?? 0));
    });

    return $records;
}

function save_invitee_record(array &$state, string $identifier, string $fullName, string $email, string $privateNote, int $nowMs): array
{
    ensure_invitee_state($state);
    $cleanIdentifier = trim(preg_replace('/\s+/', ' ', $identifier) ?? '');
    if (!is_valid_handle_identifier($cleanIdentifier)) {
        throw new RuntimeException('Invitee unique name is invalid.');
    }

    try {
        claim_unique_handle($state, '', $cleanIdentifier, $nowMs);
    } catch (RuntimeException $exception) {
        $message = trim((string) $exception->getMessage());
        if ($message === 'That unique handle is already in use.' || $message === 'That unique handle was used previously and is no longer available.') {
            throw new RuntimeException('That unique name has already been claimed and cannot be saved as an invitee.');
        }
        throw $exception;
    }
    assign_user_type_for_identifier($state, $cleanIdentifier, get_user_type_for_identifier($state, $cleanIdentifier), $nowMs);

    $key = canonicalize_handle($cleanIdentifier);
    $existing = is_array($state['invitees'][$key] ?? null) ? $state['invitees'][$key] : [];
    $record = [
        'identifier' => $cleanIdentifier,
        'full_name' => validate_invitee_full_name_value($fullName),
        'email' => validate_invitee_email_value($email),
        'private_note' => validate_invitee_note_value($privateNote),
        'created_ms' => isset($existing['created_ms']) && is_numeric($existing['created_ms']) ? (int) $existing['created_ms'] : $nowMs,
        'updated_ms' => $nowMs
    ];
    $state['invitees'][$key] = $record;

    return $record;
}

function delete_invitee_record(array &$state, string $pairsDir, string $identifier): array
{
    ensure_invitee_state($state);
    $cleanIdentifier = trim(preg_replace('/\s+/', ' ', $identifier) ?? '');
    if (!is_valid_handle_identifier($cleanIdentifier)) {
        throw new RuntimeException('Invitee unique name is invalid.');
    }

    $key = canonicalize_handle($cleanIdentifier);
    $existing = is_array($state['invitees'][$key] ?? null) ? $state['invitees'][$key] : null;
    if (!$existing) {
        throw new RuntimeException('That invitee was not found.');
    }

    if (participant_identifier_exists($state, $pairsDir, $cleanIdentifier)) {
        $onlyInviteeArtifacts = true;
        if (isset($state['unique_handles'][$key]) && is_array($state['unique_handles'][$key])) {
            $handleEntry = $state['unique_handles'][$key];
            $ownerIdentifier = trim((string) ($handleEntry['owner_identifier'] ?? ''));
            if ($ownerIdentifier !== '' && canonicalize_handle($ownerIdentifier) !== $key) {
                $onlyInviteeArtifacts = false;
            }
        }
        foreach (['user_types', 'launcher_profiles', 'handle_owners', 'identifier_aliases'] as $stateKey) {
            if (isset($state[$stateKey][$key])) {
                continue;
            }
        }
        foreach ((array) ($state['sessions'] ?? []) as $sessionEntry) {
            if (!is_array($sessionEntry)) {
                continue;
            }
            foreach (['sender', 'receiver'] as $roleKey) {
                $profile = is_array($sessionEntry[$roleKey]['profile'] ?? null) ? $sessionEntry[$roleKey]['profile'] : [];
                foreach (['own_email', 'partner_email', 'name'] as $fieldKey) {
                    if (normalize_identifier_for_lookup((string) ($profile[$fieldKey] ?? '')) === $key) {
                        $onlyInviteeArtifacts = false;
                    }
                }
            }
        }
        foreach ((array) ($state['session_registry'] ?? []) as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            foreach (['sender_name', 'receiver_name'] as $fieldKey) {
                if (normalize_identifier_for_lookup((string) ($entry[$fieldKey] ?? '')) === $key) {
                    $onlyInviteeArtifacts = false;
                }
            }
        }
        foreach ((array) ($state['pair_difficulties'] ?? []) as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            foreach (['sender_name', 'receiver_name'] as $fieldKey) {
                if (normalize_identifier_for_lookup((string) ($entry[$fieldKey] ?? '')) === $key) {
                    $onlyInviteeArtifacts = false;
                }
            }
        }
        foreach (read_all_pair_trial_records($pairsDir) as $record) {
            if (!is_array($record)) {
                continue;
            }
            foreach (['rx name', 'tx name'] as $fieldKey) {
                if (normalize_identifier_for_lookup((string) ($record[$fieldKey] ?? '')) === $key) {
                    $onlyInviteeArtifacts = false;
                }
            }
        }
        if (!$onlyInviteeArtifacts) {
            throw new RuntimeException('That invitee cannot be deleted because it has already been used in saved app data or trial history.');
        }
    }

    unset($state['invitees'][$key]);
    unset($state['user_types'][$key]);
    unset($state['launcher_profiles'][$key]);
    unset($state['identifier_aliases'][$key]);
    if (isset($state['unique_handles'][$key]) && is_array($state['unique_handles'][$key])) {
        $ownerIdentifier = trim((string) ($state['unique_handles'][$key]['owner_identifier'] ?? ''));
        unset($state['unique_handles'][$key]);
        $ownerKey = get_handle_owner_key($ownerIdentifier);
        if ($ownerKey !== '') {
            unset($state['handle_owners'][$ownerKey]);
            unset($state['identifier_aliases'][$ownerKey]);
        }
    }

    return [
        'identifier' => $cleanIdentifier
    ];
}

function ensure_explore_pro_state(array &$state): void
{
    if (!is_array($state['explore_pro_verifications'] ?? null)) {
        $state['explore_pro_verifications'] = [];
    }
    if (!is_array($state['explore_pro_trials'] ?? null)) {
        $state['explore_pro_trials'] = [];
    }
    if (!array_key_exists('explore_pro_test_duration_seconds', $state)) {
        $state['explore_pro_test_duration_seconds'] = 0;
    }
}

function get_explore_pro_trial_duration_ms(array $state): int
{
    global $exploreProTrialDurationMs;

    $defaultDurationMs = max(1000, (int) $exploreProTrialDurationMs);
    $overrideSeconds = max(0, (int) ($state['explore_pro_test_duration_seconds'] ?? 0));
    if ($overrideSeconds <= 0) {
        return $defaultDurationMs;
    }
    $overrideMs = $overrideSeconds * 1000;
    return min($defaultDurationMs, max(1000, $overrideMs));
}

function normalize_explore_pro_email(string $email): string
{
    return strtolower(trim($email));
}

function get_explore_pro_email_key(string $email): string
{
    return normalize_explore_pro_email($email);
}

function mask_email_for_display(string $email): string
{
    $normalized = normalize_explore_pro_email($email);
    if ($normalized === '' || strpos($normalized, '@') === false) {
        return $email;
    }
    [$local, $domain] = explode('@', $normalized, 2);
    if ($local === '') {
        return $normalized;
    }
    if (strlen($local) <= 2) {
        return substr($local, 0, 1) . str_repeat('*', max(1, strlen($local) - 1)) . '@' . $domain;
    }
    return substr($local, 0, 1) . str_repeat('*', max(1, strlen($local) - 2)) . substr($local, -1) . '@' . $domain;
}

function generate_explore_pro_verification_code(int $length = 5): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $targetLength = max(5, min(8, $length));
    $result = '';
    for ($index = 0; $index < $targetLength; $index += 1) {
        $result .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $result;
}

function normalize_explore_pro_trial_record(array $record): array
{
    $email = normalize_explore_pro_email((string) ($record['email'] ?? ''));
    $identifier = trim((string) ($record['identifier'] ?? ''));
    $status = strtolower(trim((string) ($record['status'] ?? 'active')));
    if (!in_array($status, ['active', 'expired'], true)) {
        $status = 'active';
    }

    return [
        'email' => $email,
        'identifier' => $identifier,
        'status' => $status,
        'created_ms' => isset($record['created_ms']) && is_numeric($record['created_ms']) ? (int) $record['created_ms'] : 0,
        'verified_ms' => isset($record['verified_ms']) && is_numeric($record['verified_ms']) ? (int) $record['verified_ms'] : 0,
        'started_ms' => isset($record['started_ms']) && is_numeric($record['started_ms']) ? (int) $record['started_ms'] : 0,
        'expires_ms' => isset($record['expires_ms']) && is_numeric($record['expires_ms']) ? (int) $record['expires_ms'] : 0,
        'expired_ms' => isset($record['expired_ms']) && is_numeric($record['expired_ms']) ? (int) $record['expired_ms'] : 0
    ];
}

function normalize_explore_pro_verification_record(array $record): array
{
    $email = normalize_explore_pro_email((string) ($record['email'] ?? ''));
    return [
        'email' => $email,
        'code' => strtoupper(trim((string) ($record['code'] ?? ''))),
        'created_ms' => isset($record['created_ms']) && is_numeric($record['created_ms']) ? (int) $record['created_ms'] : 0,
        'expires_ms' => isset($record['expires_ms']) && is_numeric($record['expires_ms']) ? (int) $record['expires_ms'] : 0,
        'last_sent_ms' => isset($record['last_sent_ms']) && is_numeric($record['last_sent_ms']) ? (int) $record['last_sent_ms'] : 0,
        'send_count' => isset($record['send_count']) && is_numeric($record['send_count']) ? max(0, (int) $record['send_count']) : 0
    ];
}

function get_explore_pro_expired_message(): string
{
    return 'Your ESP PRO exploration period has ended, and you are now using the free Telepathy Beginner. Your progress has been saved. If you found ESP PRO useful, click here to subscribe to ESP PRO and continue where you left off for $2.99/month or $25/year.';
}

function expire_explore_pro_trial_by_email(array &$state, string $emailKey, int $nowMs): ?array
{
    ensure_explore_pro_state($state);
    $existing = is_array($state['explore_pro_trials'][$emailKey] ?? null) ? $state['explore_pro_trials'][$emailKey] : null;
    if (!$existing) {
        return null;
    }

    $record = normalize_explore_pro_trial_record($existing);
    if ($record['status'] !== 'expired') {
        $record['status'] = 'expired';
        $record['expired_ms'] = $record['expired_ms'] > 0 ? $record['expired_ms'] : $nowMs;
    }
    $state['explore_pro_trials'][$emailKey] = $record;
    if ($record['identifier'] !== '') {
        assign_user_type_for_identifier($state, $record['identifier'], 'standard', $nowMs);
    }
    return $record;
}

function get_explore_pro_trial_status_for_identifier(array &$state, string $identifier, int $nowMs): ?array
{
    ensure_explore_pro_state($state);
    $cleanIdentifier = trim((string) $identifier);
    if ($cleanIdentifier === '') {
        return null;
    }

    $status = get_identifier_status($state, $cleanIdentifier);
    $preferredIdentifier = trim((string) ($status['preferred_identifier'] ?? $cleanIdentifier));
    $preferredKey = normalize_identifier_for_lookup($preferredIdentifier);
    if ($preferredKey === '') {
        return null;
    }

    foreach ($state['explore_pro_trials'] as $emailKey => $rawRecord) {
        if (!is_array($rawRecord)) {
            continue;
        }
        $record = normalize_explore_pro_trial_record($rawRecord);
        $recordKey = normalize_identifier_for_lookup($record['identifier']);
        if ($recordKey === '' || $recordKey !== $preferredKey) {
            continue;
        }
        if ($record['status'] !== 'expired' && $record['expires_ms'] > 0 && $record['expires_ms'] <= $nowMs) {
            $record = expire_explore_pro_trial_by_email($state, (string) $emailKey, $nowMs) ?? $record;
        } else {
            $state['explore_pro_trials'][$emailKey] = $record;
        }
        return [
            'identifier' => $record['identifier'],
            'email' => $record['email'],
            'email_masked' => mask_email_for_display($record['email']),
            'started_ms' => $record['started_ms'],
            'expires_ms' => $record['expires_ms'],
            'expired_ms' => $record['expired_ms'],
            'phase' => $record['status'] === 'expired' ? 'expired' : 'active',
            'expired_message' => $record['status'] === 'expired' ? get_explore_pro_expired_message() : ''
        ];
    }

    return null;
}

function migrate_explore_pro_trial_identifier(array &$state, string $oldIdentifier, string $newIdentifier): void
{
    ensure_explore_pro_state($state);
    $oldKey = normalize_identifier_for_lookup($oldIdentifier);
    $newClean = trim((string) $newIdentifier);
    $newKey = normalize_identifier_for_lookup($newClean);
    if ($oldKey === '' || $newKey === '' || $oldKey === $newKey) {
        return;
    }

    foreach ($state['explore_pro_trials'] as $emailKey => $rawRecord) {
        if (!is_array($rawRecord)) {
            continue;
        }
        $record = normalize_explore_pro_trial_record($rawRecord);
        if (normalize_identifier_for_lookup($record['identifier']) !== $oldKey) {
            continue;
        }
        $record['identifier'] = $newClean;
        $state['explore_pro_trials'][$emailKey] = $record;
    }
}

function send_explore_pro_verification_code(array &$state, string $email, int $nowMs): array
{
    global $exploreProVerificationTtlMs, $exploreProResendCooldownMs;

    ensure_explore_pro_state($state);
    $cleanEmail = validate_email_identifier_string($email, 'email', true);
    $emailKey = get_explore_pro_email_key($cleanEmail);
    $existingTrial = is_array($state['explore_pro_trials'][$emailKey] ?? null)
        ? normalize_explore_pro_trial_record($state['explore_pro_trials'][$emailKey])
        : null;

    if ($existingTrial) {
        if ($existingTrial['status'] !== 'expired' && $existingTrial['expires_ms'] > 0 && $existingTrial['expires_ms'] <= $nowMs) {
            $existingTrial = expire_explore_pro_trial_by_email($state, $emailKey, $nowMs);
        }
        if (($existingTrial['status'] ?? '') === 'expired') {
            throw new RuntimeException(get_explore_pro_expired_message());
        }
    }

    $existingVerification = is_array($state['explore_pro_verifications'][$emailKey] ?? null)
        ? normalize_explore_pro_verification_record($state['explore_pro_verifications'][$emailKey])
        : null;
    if ($existingVerification && $existingVerification['last_sent_ms'] > 0 && ($nowMs - $existingVerification['last_sent_ms']) < $exploreProResendCooldownMs) {
        throw new RuntimeException('Please wait a little before requesting another verification code.');
    }

    $code = generate_explore_pro_verification_code(5);
    $verification = [
        'email' => $cleanEmail,
        'code' => $code,
        'created_ms' => $existingVerification['created_ms'] > 0 ? $existingVerification['created_ms'] : $nowMs,
        'expires_ms' => $nowMs + $exploreProVerificationTtlMs,
        'last_sent_ms' => $nowMs,
        'send_count' => ($existingVerification['send_count'] ?? 0) + 1
    ];

    $subject = 'ESP PRO verification code';
    $body =
        "ESP GYM\r\n\r\n" .
        "Your ESP PRO verification code is: {$code}\r\n\r\n" .
        "Enter this 5-character code in ESP GYM to begin your free 14-day ESP PRO exploration.\r\n\r\n" .
        "This code expires in 15 minutes.\r\n";

    sendAppMail($cleanEmail, '', $subject, $body);
    $state['explore_pro_verifications'][$emailKey] = $verification;

    return [
        'email' => $cleanEmail,
        'email_masked' => mask_email_for_display($cleanEmail),
        'expires_ms' => $verification['expires_ms'],
        'send_count' => $verification['send_count']
    ];
}

function begin_explore_pro_trial_from_code(array &$state, string $pairsDir, string $email, string $code, int $nowMs): array
{
    ensure_explore_pro_state($state);
    $trialDurationMs = get_explore_pro_trial_duration_ms($state);
    $cleanEmail = validate_email_identifier_string($email, 'email', true);
    $emailKey = get_explore_pro_email_key($cleanEmail);
    $verification = is_array($state['explore_pro_verifications'][$emailKey] ?? null)
        ? normalize_explore_pro_verification_record($state['explore_pro_verifications'][$emailKey])
        : null;

    if (!$verification || $verification['email'] === '') {
        throw new RuntimeException('Please request a verification code first.');
    }
    if ($verification['expires_ms'] > 0 && $verification['expires_ms'] < $nowMs) {
        unset($state['explore_pro_verifications'][$emailKey]);
        throw new RuntimeException('That verification code has expired. Please request a new code.');
    }

    $normalizedCode = strtoupper(trim((string) $code));
    if ($normalizedCode === '' || preg_match('/^[A-Z2-9]{5}$/', $normalizedCode) !== 1) {
        throw new RuntimeException('Please enter the 5-character verification code.');
    }
    if (!hash_equals($verification['code'], $normalizedCode)) {
        throw new RuntimeException('That verification code is invalid. Please try again.');
    }

    $trial = is_array($state['explore_pro_trials'][$emailKey] ?? null)
        ? normalize_explore_pro_trial_record($state['explore_pro_trials'][$emailKey])
        : null;
    if ($trial && $trial['status'] !== 'expired' && $trial['expires_ms'] > 0 && $trial['expires_ms'] <= $nowMs) {
        $trial = expire_explore_pro_trial_by_email($state, $emailKey, $nowMs);
    }
    if ($trial && ($trial['status'] ?? '') === 'expired') {
        unset($state['explore_pro_verifications'][$emailKey]);
        throw new RuntimeException(get_explore_pro_expired_message());
    }

    if (!$trial || $trial['identifier'] === '') {
        $temporaryIdentity = create_temporary_identifier($state, $pairsDir, 'pro', $nowMs);
        $trial = [
            'email' => $cleanEmail,
            'identifier' => (string) ($temporaryIdentity['identifier'] ?? ''),
            'status' => 'active',
            'created_ms' => $nowMs,
            'verified_ms' => $nowMs,
            'started_ms' => $nowMs,
            'expires_ms' => $nowMs + $trialDurationMs,
            'expired_ms' => 0
        ];
    } else {
        $trial['email'] = $cleanEmail;
        $trial['status'] = 'active';
        $trial['verified_ms'] = $nowMs;
        if ((int) ($trial['started_ms'] ?? 0) <= 0) {
            $trial['started_ms'] = $nowMs;
        }
        if ((int) ($trial['expires_ms'] ?? 0) <= 0) {
            $trial['expires_ms'] = ((int) $trial['started_ms']) + $trialDurationMs;
        }
        assign_user_type_for_identifier($state, $trial['identifier'], 'pro', $nowMs);
    }

    $trial = normalize_explore_pro_trial_record($trial);
    $state['explore_pro_trials'][$emailKey] = $trial;
    unset($state['explore_pro_verifications'][$emailKey]);

    return [
        'identifier' => $trial['identifier'],
        'user_type' => 'pro',
        'email' => $cleanEmail,
        'email_masked' => mask_email_for_display($cleanEmail),
        'started_ms' => $trial['started_ms'],
        'expires_ms' => $trial['expires_ms'],
        'phase' => 'active'
    ];
}

function render_subscription_email_template(string $templateBody, array $variables): string
{
    $replacements = [];
    foreach ($variables as $key => $value) {
        $replacements['{{' . $key . '}}'] = trim((string) $value);
    }
    return strtr($templateBody, $replacements);
}

function append_subscription_email_log(string $path, array $entry): void
{
    $line = json_encode($entry, JSON_UNESCAPED_SLASHES);
    if (!is_string($line) || $line === '') {
        return;
    }
    append_capped_log($path, $line, 307200);
}

function read_subscription_email_log(string $path): array
{
    $content = is_file($path) ? trim((string) file_get_contents($path)) : '';
    return [
        'path' => $path,
        'available' => is_file($path),
        'size_bytes' => is_file($path) ? max(0, (int) filesize($path)) : 0,
        'size_formatted' => format_bytes(is_file($path) ? max(0, (int) filesize($path)) : 0),
        'content' => $content
    ];
}

function normalize_learn_more_content_key($value): string
{
    $key = trim((string) $value);
    if ($key === 'main' || $key === 'clairvoyance' || $key === 'esp-lessons' || $key === 'learning-center-outline') {
        return $key;
    }
    if (preg_match('/^lesson-(\d{1,4})$/', $key, $matches)) {
        return 'lesson-' . (string) ((int) $matches[1]);
    }
    if (preg_match('/^lesson-id:([a-z0-9-]{1,80})$/', $key, $matches)) {
        return 'lesson-id:' . trim((string) $matches[1]);
    }
    return '';
}

function get_default_learn_more_content(string $contentKey): string
{
    global $defaultLearnMoreMainContent, $defaultLearnMoreClairvoyanceContent, $defaultEspLessonsContent, $defaultLearningCenterOutline;

    if ($contentKey === 'main') {
        return $defaultLearnMoreMainContent;
    }
    if ($contentKey === 'clairvoyance') {
        return $defaultLearnMoreClairvoyanceContent;
    }
    if ($contentKey === 'esp-lessons') {
        return $defaultEspLessonsContent;
    }
    if ($contentKey === 'learning-center-outline') {
        $payload = json_encode($defaultLearningCenterOutline, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return is_string($payload) ? $payload : '';
    }
    return '';
}

function get_learn_more_content_path(string $contentKey): string
{
    global $learnMoreContentFile, $clairvoyanceLearnMoreContentFile, $espLessonsContentFile, $learningCenterLessonsDir, $learningCenterOutlineFile;

    if ($contentKey === 'main') {
        return $learnMoreContentFile;
    }
    if ($contentKey === 'clairvoyance') {
        return $clairvoyanceLearnMoreContentFile;
    }
    if ($contentKey === 'esp-lessons') {
        return $espLessonsContentFile;
    }
    if ($contentKey === 'learning-center-outline') {
        return $learningCenterOutlineFile;
    }
    if (preg_match('/^lesson-(\d{1,4})$/', $contentKey, $matches)) {
        if (!is_dir($learningCenterLessonsDir)) {
            @mkdir($learningCenterLessonsDir, 0775, true);
        }
        return $learningCenterLessonsDir . DIRECTORY_SEPARATOR . 'lesson-' . (string) ((int) $matches[1]) . '.txt';
    }
    if (preg_match('/^lesson-id:([a-z0-9-]{1,80})$/', $contentKey, $matches)) {
        if (!is_dir($learningCenterLessonsDir)) {
            @mkdir($learningCenterLessonsDir, 0775, true);
        }
        return $learningCenterLessonsDir . DIRECTORY_SEPARATOR . trim((string) $matches[1]) . '.txt';
    }
    return '';
}

function get_learn_more_repo_content_path(string $contentKey): string
{
    global $learnMoreContentRepoFile, $clairvoyanceLearnMoreContentRepoFile, $espLessonsContentRepoFile, $contentRepoLessonsDir, $learningCenterOutlineRepoFile;

    if ($contentKey === 'main') {
        return $learnMoreContentRepoFile;
    }
    if ($contentKey === 'clairvoyance') {
        return $clairvoyanceLearnMoreContentRepoFile;
    }
    if ($contentKey === 'esp-lessons') {
        return $espLessonsContentRepoFile;
    }
    if ($contentKey === 'learning-center-outline') {
        return $learningCenterOutlineRepoFile;
    }
    if (preg_match('/^lesson-(\d{1,4})$/', $contentKey, $matches)) {
        if (!is_dir($contentRepoLessonsDir)) {
            @mkdir($contentRepoLessonsDir, 0775, true);
        }
        return $contentRepoLessonsDir . DIRECTORY_SEPARATOR . 'lesson-' . (string) ((int) $matches[1]) . '.txt';
    }
    if (preg_match('/^lesson-id:([a-z0-9-]{1,80})$/', $contentKey, $matches)) {
        if (!is_dir($contentRepoLessonsDir)) {
            @mkdir($contentRepoLessonsDir, 0775, true);
        }
        return $contentRepoLessonsDir . DIRECTORY_SEPARATOR . trim((string) $matches[1]) . '.txt';
    }
    return '';
}

function ensure_parent_directory(string $path): void
{
    $directory = dirname($path);
    if ($directory !== '' && !is_dir($directory)) {
        @mkdir($directory, 0775, true);
    }
}

function copy_file_if_missing(string $sourcePath, string $destinationPath): void
{
    if (!is_file($sourcePath) || is_file($destinationPath)) {
        return;
    }
    ensure_parent_directory($destinationPath);
    @copy($sourcePath, $destinationPath);
}

function normalize_questionnaire_type($value): string
{
    $type = strtolower(trim((string) $value));
    return in_array($type, ['baseline', 'after-first-session'], true) ? $type : '';
}

function normalize_questionnaire_identifier_value($value): string
{
    return trim((string) $value);
}

function build_questionnaire_response_path(string $type, string $identifier, string $receiver = '', string $sender = ''): string
{
    global $questionnaireResponsesDir;

    $normalizedType = normalize_questionnaire_type($type);
    $normalizedIdentifier = normalize_questionnaire_identifier_value($identifier);
    $normalizedReceiver = normalize_questionnaire_identifier_value($receiver);
    $normalizedSender = normalize_questionnaire_identifier_value($sender);

    if ($normalizedType === '' || $normalizedIdentifier === '') {
        return '';
    }

    $keyPayload = [
        'type' => $normalizedType,
        'identifier' => mb_strtolower($normalizedIdentifier, 'UTF-8'),
        'receiver' => mb_strtolower($normalizedReceiver, 'UTF-8'),
        'sender' => mb_strtolower($normalizedSender, 'UTF-8')
    ];
    $hash = sha1(json_encode($keyPayload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    if ($hash === '') {
        return '';
    }

    if (!is_dir($questionnaireResponsesDir)) {
        @mkdir($questionnaireResponsesDir, 0775, true);
    }

    return $questionnaireResponsesDir . DIRECTORY_SEPARATOR . $normalizedType . '__' . $hash . '.json';
}

function read_questionnaire_response_file(string $path): array
{
    if ($path === '' || !is_file($path)) {
        return [
            'available' => false,
            'response' => null,
            'path' => $path
        ];
    }

    $raw = file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') {
        return [
            'available' => true,
            'response' => null,
            'path' => $path
        ];
    }

    $parsed = json_decode($raw, true);
    if (!is_array($parsed)) {
        throw new RuntimeException('Stored questionnaire response is not valid JSON.');
    }

    return [
        'available' => true,
        'response' => $parsed,
        'path' => $path
    ];
}

function write_questionnaire_response_file(string $path, array $payload): void
{
    ensure_parent_directory($path);
    $encoded = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($encoded) || $encoded === '') {
        throw new RuntimeException('Unable to encode questionnaire response.');
    }
    file_put_contents($path, $encoded);
}

function normalize_learning_center_outline_id($value): string
{
    $id = strtolower(trim((string) $value));
    if ($id === '' || !preg_match('/^[a-z0-9-]{1,80}$/', $id)) {
        return '';
    }
    return $id;
}

function normalize_learning_center_outline_type($value): string
{
    $type = strtolower(trim((string) $value));
    return in_array($type, ['lesson-page', 'baseline', 'after-first-session'], true) ? $type : 'lesson-page';
}

function compare_learning_center_display_numbers(string $left, string $right): int
{
    $leftParts = preg_split('/[^0-9]+/', $left) ?: [];
    $rightParts = preg_split('/[^0-9]+/', $right) ?: [];
    $maxCount = max(count($leftParts), count($rightParts));
    for ($index = 0; $index < $maxCount; $index += 1) {
        $leftValue = isset($leftParts[$index]) && $leftParts[$index] !== '' ? (int) $leftParts[$index] : 0;
        $rightValue = isset($rightParts[$index]) && $rightParts[$index] !== '' ? (int) $rightParts[$index] : 0;
        if ($leftValue !== $rightValue) {
            return $leftValue <=> $rightValue;
        }
    }
    return strnatcasecmp($left, $right);
}

function normalize_learning_center_outline(array $parsed): array
{
    $rows = [];
    $seenIds = [];
    foreach ((array) ($parsed['rows'] ?? []) as $row) {
        if (!is_array($row)) {
            continue;
        }
        $id = normalize_learning_center_outline_id($row['id'] ?? '');
        if ($id === '' || isset($seenIds[$id])) {
            continue;
        }
        $displayNumber = trim((string) ($row['display_number'] ?? ''));
        $title = trim((string) ($row['title'] ?? ''));
        $subcopy = trim((string) ($row['subcopy'] ?? ''));
        $type = normalize_learning_center_outline_type($row['type'] ?? '');
        if ($displayNumber === '' || $title === '') {
            continue;
        }
        $seenIds[$id] = true;
        $rows[] = [
            'id' => $id,
            'display_number' => $displayNumber,
            'title' => $title,
            'subcopy' => $subcopy,
            'type' => $type
        ];
    }

    usort($rows, static function (array $left, array $right): int {
        $numberOrder = compare_learning_center_display_numbers(
            (string) ($left['display_number'] ?? ''),
            (string) ($right['display_number'] ?? '')
        );
        if ($numberOrder !== 0) {
            return $numberOrder;
        }
        return strcasecmp((string) ($left['title'] ?? ''), (string) ($right['title'] ?? ''));
    });

    return [
        'version' => isset($parsed['version']) && is_numeric($parsed['version']) ? (int) $parsed['version'] : 1,
        'rows' => $rows
    ];
}

function read_learning_center_outline_file(string $path): array
{
    if (!is_file($path)) {
        return [
            'available' => false,
            'outline' => ['version' => 1, 'rows' => []],
            'content' => '',
            'path' => $path
        ];
    }

    $content = (string) file_get_contents($path);
    $parsed = json_decode($content, true);
    if (!is_array($parsed)) {
        throw new RuntimeException('The Learning Center outline JSON is invalid.');
    }

    return [
        'available' => true,
        'outline' => normalize_learning_center_outline($parsed),
        'content' => $content,
        'path' => $path
    ];
}

function write_learning_center_outline_file(string $path, array $outline, string $mirrorPath = ''): void
{
    $normalized = normalize_learning_center_outline($outline);
    $payload = json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($payload) || $payload === '') {
        throw new RuntimeException('Unable to encode the Learning Center outline.');
    }
    ensure_parent_directory($path);
    $result = @file_put_contents($path, $payload, LOCK_EX);
    if ($result === false) {
        throw new RuntimeException('Unable to write the Learning Center outline.');
    }
    if ($mirrorPath !== '') {
        ensure_parent_directory($mirrorPath);
        @file_put_contents($mirrorPath, $payload, LOCK_EX);
    }
}

function load_learning_center_outline(): array
{
    $contentKey = 'learning-center-outline';
    ensure_learn_more_content_seeded($contentKey);
    $record = read_learning_center_outline_file(get_learn_more_content_path($contentKey));
    return (array) ($record['outline'] ?? ['version' => 1, 'rows' => []]);
}

function get_learning_center_outline_row_by_id(array $outline, string $lessonId): ?array
{
    $normalizedId = normalize_learning_center_outline_id($lessonId);
    foreach ((array) ($outline['rows'] ?? []) as $row) {
        if (!is_array($row)) {
            continue;
        }
        if (normalize_learning_center_outline_id($row['id'] ?? '') === $normalizedId) {
            return $row;
        }
    }
    return null;
}

function get_learning_center_outline_row_by_display_number(array $outline, string $displayNumber): ?array
{
    $normalizedNumber = trim((string) $displayNumber);
    foreach ((array) ($outline['rows'] ?? []) as $row) {
        if (!is_array($row)) {
            continue;
        }
        if (trim((string) ($row['display_number'] ?? '')) === $normalizedNumber) {
            return $row;
        }
    }
    return null;
}

function ensure_learning_center_lessons_seeded(): void
{
    global $learningCenterLessonsDir, $contentRepoLessonsDir;

    if (!is_dir($learningCenterLessonsDir)) {
        @mkdir($learningCenterLessonsDir, 0775, true);
    }
    if (!is_dir($contentRepoLessonsDir)) {
        @mkdir($contentRepoLessonsDir, 0775, true);
    }

    $privateMatches = glob($learningCenterLessonsDir . DIRECTORY_SEPARATOR . 'lesson-*.txt') ?: [];
    foreach ($privateMatches as $privatePath) {
        $name = basename((string) $privatePath);
        $repoPath = $contentRepoLessonsDir . DIRECTORY_SEPARATOR . $name;
        copy_file_if_missing($privatePath, $repoPath);
    }

    $repoMatches = glob($contentRepoLessonsDir . DIRECTORY_SEPARATOR . 'lesson-*.txt') ?: [];
    foreach ($repoMatches as $repoPath) {
        $name = basename((string) $repoPath);
        $privatePath = $learningCenterLessonsDir . DIRECTORY_SEPARATOR . $name;
        copy_file_if_missing($repoPath, $privatePath);
    }

    $legacyLessonFourPrivatePath = $learningCenterLessonsDir . DIRECTORY_SEPARATOR . 'lesson-4.txt';
    $legacyLessonFourRepoPath = $contentRepoLessonsDir . DIRECTORY_SEPARATOR . 'lesson-4.txt';
    $permanentLessonFourPrivatePath = $learningCenterLessonsDir . DIRECTORY_SEPARATOR . 'lost-found-harp.txt';
    $permanentLessonFourRepoPath = $contentRepoLessonsDir . DIRECTORY_SEPARATOR . 'lost-found-harp.txt';
    copy_file_if_missing($legacyLessonFourPrivatePath, $permanentLessonFourPrivatePath);
    copy_file_if_missing($legacyLessonFourRepoPath, $permanentLessonFourRepoPath);
    copy_file_if_missing($permanentLessonFourPrivatePath, $permanentLessonFourRepoPath);
    copy_file_if_missing($permanentLessonFourRepoPath, $permanentLessonFourPrivatePath);
}

function ensure_learn_more_content_seeded(string $contentKey): void
{
    $privatePath = get_learn_more_content_path($contentKey);
    $repoPath = get_learn_more_repo_content_path($contentKey);
    if ($privatePath === '' || $repoPath === '') {
        return;
    }

    if ($contentKey === 'learning-center-outline') {
        if (is_file($privatePath) && !is_file($repoPath)) {
            copy_file_if_missing($privatePath, $repoPath);
            return;
        }

        if (!is_file($privatePath) && is_file($repoPath)) {
            copy_file_if_missing($repoPath, $privatePath);
            return;
        }

        if (!is_file($privatePath) && !is_file($repoPath)) {
            $defaultContent = get_default_learn_more_content($contentKey);
            if ($defaultContent !== '') {
                ensure_parent_directory($privatePath);
                ensure_parent_directory($repoPath);
                @file_put_contents($privatePath, $defaultContent, LOCK_EX);
                @file_put_contents($repoPath, $defaultContent, LOCK_EX);
            }
        }
        return;
    }

    if (preg_match('/^lesson-\d{1,4}$|^lesson-id:[a-z0-9-]{1,80}$/', $contentKey)) {
        ensure_learning_center_lessons_seeded();
        return;
    }

    if (is_file($privatePath) && !is_file($repoPath)) {
        copy_file_if_missing($privatePath, $repoPath);
        return;
    }

    if (!is_file($privatePath) && is_file($repoPath)) {
        copy_file_if_missing($repoPath, $privatePath);
        return;
    }

    if (!is_file($privatePath) && !is_file($repoPath)) {
        $defaultContent = get_default_learn_more_content($contentKey);
        if ($defaultContent !== '') {
            ensure_parent_directory($privatePath);
            ensure_parent_directory($repoPath);
            @file_put_contents($privatePath, $defaultContent, LOCK_EX);
            @file_put_contents($repoPath, $defaultContent, LOCK_EX);
        }
    }
}

function read_learn_more_content_file(string $path): array
{
    $exists = is_file($path);
    $content = $exists ? (string) file_get_contents($path) : '';
    return [
        'available' => $exists,
        'content' => $content,
        'path' => $path
    ];
}

function write_learn_more_content_file(string $path, string $content, string $mirrorPath = ''): void
{
    ensure_parent_directory($path);
    $result = @file_put_contents($path, $content, LOCK_EX);
    if ($result === false) {
        throw new RuntimeException('Unable to write Learn More content.');
    }

    if ($mirrorPath !== '') {
        ensure_parent_directory($mirrorPath);
        @file_put_contents($mirrorPath, $content, LOCK_EX);
    }
}

function list_learning_center_lesson_numbers(): array
{
    $outline = load_learning_center_outline();
    $numbers = [];
    foreach ((array) ($outline['rows'] ?? []) as $row) {
        if (!is_array($row) || normalize_learning_center_outline_type($row['type'] ?? '') !== 'lesson-page') {
            continue;
        }
        $displayNumber = trim((string) ($row['display_number'] ?? ''));
        if (preg_match('/^\d{1,4}$/', $displayNumber)) {
            $numbers[] = (int) $displayNumber;
        }
    }
    $numbers = array_values(array_unique($numbers));
    sort($numbers, SORT_NUMERIC);
    return $numbers;
}

function collect_known_user_identifiers(array $state): array
{
    $known = [];

    foreach ((array) ($state['launcher_profiles'] ?? []) as $lookupKey => $profileSet) {
        if ($lookupKey !== '') {
            $known[(string) $lookupKey] = true;
        }
        if (!is_array($profileSet)) {
            continue;
        }
        foreach ($profileSet as $profile) {
            if (!is_array($profile)) {
                continue;
            }
            $ownEmail = trim((string) ($profile['own_email'] ?? ''));
            $normalized = normalize_identifier_for_lookup($ownEmail);
            if ($normalized !== '') {
                $known[$normalized] = true;
            }
        }
    }

    foreach ((array) ($state['user_types'] ?? []) as $lookupKey => $userType) {
        $normalized = normalize_identifier_for_lookup((string) $lookupKey);
        if ($normalized !== '') {
            $known[$normalized] = true;
        }
    }

    foreach ((array) ($state['stripe_users'] ?? []) as $record) {
        if (!is_array($record)) {
            continue;
        }
        $identifier = trim((string) ($record['identifier'] ?? ''));
        $normalized = normalize_identifier_for_lookup($identifier);
        if ($normalized !== '') {
            $known[$normalized] = true;
        }
    }

    return array_keys($known);
}

function build_cron_status_counts(array $state): array
{
    $knownIdentifiers = collect_known_user_identifiers($state);
    $proUsers = 0;
    foreach ($knownIdentifiers as $identifierKey) {
        $userType = normalize_user_type($state['user_types'][$identifierKey] ?? 'standard');
        if ($userType === 'pro') {
            $proUsers++;
        }
    }

    return [
        'total_beginner_users' => count($knownIdentifiers),
        'total_launcher_visits' => max(0, (int) ($state['launcher_visit_count'] ?? 0)),
        'total_pro_users' => $proUsers,
        'total_visitor_trials' => max(0, (int) ($state['visitor_trial_count'] ?? 0))
    ];
}

function send_cron_status_email(array $state, string $subscriptionEmailLogFile, array $counts, array $scanResult, int $nowMs): array
{
    $subject = 'ESP Gym cron running';
    $body = implode("\r\n", [
        'Cron running.',
        '',
        'Total Beginner users: ' . (int) ($counts['total_beginner_users'] ?? 0),
        'Total launcher visits: ' . (int) ($counts['total_launcher_visits'] ?? 0),
        'Total PRO users: ' . (int) ($counts['total_pro_users'] ?? 0),
        'Total Visitor trials: ' . (int) ($counts['total_visitor_trials'] ?? 0),
        '',
        'Annual reminder scan:',
        'Checked: ' . (int) ($scanResult['checked'] ?? 0),
        'Eligible: ' . (int) ($scanResult['eligible'] ?? 0),
        'Sent: ' . (int) ($scanResult['sent'] ?? 0),
        'Admin notices: ' . (int) ($scanResult['admin_sent'] ?? 0),
        'Skipped: ' . (int) ($scanResult['skipped'] ?? 0),
        'Message: ' . trim((string) ($scanResult['message'] ?? ''))
    ]);

    return send_subscription_admin_notice(
        $state,
        $subscriptionEmailLogFile,
        'admin-cron-status',
        $subject,
        $body,
        $nowMs,
        false
    );
}

function deliver_subscription_email(
    array &$state,
    string $subscriptionEmailLogFile,
    string $templateKey,
    string $toEmail,
    string $recipientName,
    array $variables,
    int $nowMs
): array {
    ensure_subscription_email_state($state);

    $normalizedKey = normalize_subscription_email_template_key($templateKey);
    if ($normalizedKey === '') {
        return ['sent' => false, 'message' => 'Unknown subscription email template key.'];
    }

    $template = is_array($state['subscription_email_templates'][$normalizedKey] ?? null)
        ? $state['subscription_email_templates'][$normalizedKey]
        : default_subscription_email_templates()[$normalizedKey];
    $subject = trim((string) ($template['subject'] ?? ''));
    $bodyTemplate = trim((string) ($template['body'] ?? ''));
    $body = render_subscription_email_template($bodyTemplate, $variables);
    $enabled = !empty($state['subscription_emails_enabled']);
    $normalizedEmail = normalize_stripe_checkout_email($toEmail);

    $logEntry = [
        'time_utc' => gmdate('Y-m-d H:i:s') . ' UTC',
        'time_ms' => $nowMs,
        'template_key' => $normalizedKey,
        'recipient_email' => $normalizedEmail,
        'recipient_name' => trim($recipientName),
        'subject' => $subject,
        'enabled' => $enabled,
        'would_send' => $normalizedEmail !== '' && $subject !== '' && $body !== '',
        'sent' => false,
        'message' => ''
    ];

    if (!$enabled) {
        $logEntry['message'] = 'Subscription emails are disabled.';
        append_subscription_email_log($subscriptionEmailLogFile, $logEntry);
        return ['sent' => false, 'message' => $logEntry['message']];
    }

    if ($normalizedEmail === '' || $subject === '' || $body === '') {
        $logEntry['message'] = 'Subscription email was incomplete or had no valid recipient address.';
        append_subscription_email_log($subscriptionEmailLogFile, $logEntry);
        return ['sent' => false, 'message' => $logEntry['message']];
    }

    try {
        sendAppMail($normalizedEmail, '', $subject, $body);
        $logEntry['sent'] = true;
        $logEntry['message'] = 'Subscription email sent.';
    } catch (Throwable $exception) {
        $logEntry['message'] = $exception->getMessage();
    }

    append_subscription_email_log($subscriptionEmailLogFile, $logEntry);
    return ['sent' => $logEntry['sent'], 'message' => $logEntry['message']];
}

function normalize_stripe_plan($value): string
{
    $plan = strtolower(trim((string) $value));
    return in_array($plan, ['monthly', 'annual'], true) ? $plan : '';
}

function get_stripe_price_id_for_plan(array $config, string $plan): string
{
    $normalizedPlan = normalize_stripe_plan($plan);
    if ($normalizedPlan === 'monthly') {
        return trim((string) ($config['prices']['proMonthly'] ?? ''));
    }
    if ($normalizedPlan === 'annual') {
        return trim((string) ($config['prices']['proAnnual'] ?? ''));
    }

    return '';
}

function stripe_build_headers(string $secretKey): array
{
    return [
        'Authorization: Bearer ' . $secretKey,
        'Content-Type: application/x-www-form-urlencoded'
    ];
}

function stripe_api_request(string $method, string $path, array $formFields, string $secretKey): array
{
    $url = 'https://api.stripe.com' . $path;
    $payload = http_build_query($formFields);
    $headers = stripe_build_headers($secretKey);
    $statusCode = 0;
    $body = '';

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        if ($curl === false) {
            throw new RuntimeException('Unable to initialize Stripe request.');
        }

        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 30
        ]);

        $body = curl_exec($curl);
        if ($body === false) {
            $message = curl_error($curl);
            curl_close($curl);
            throw new RuntimeException('Stripe request failed: ' . $message);
        }

        $statusCode = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => strtoupper($method),
                'header' => implode("\r\n", $headers),
                'content' => $payload,
                'timeout' => 30,
                'ignore_errors' => true
            ]
        ]);
        $body = @file_get_contents($url, false, $context);
        $responseHeaders = $http_response_header ?? [];
        foreach ($responseHeaders as $headerLine) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/', (string) $headerLine, $matches) === 1) {
                $statusCode = (int) $matches[1];
                break;
            }
        }
    }

    $decoded = json_decode((string) $body, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Stripe returned an invalid response.');
    }

    if ($statusCode < 200 || $statusCode >= 300) {
        $errorMessage = trim((string) ($decoded['error']['message'] ?? 'Stripe request failed.'));
        throw new RuntimeException($errorMessage !== '' ? $errorMessage : 'Stripe request failed.');
    }

    return $decoded;
}

function parse_stripe_signature_header(string $header): array
{
    $timestamp = 0;
    $signatures = [];

    foreach (explode(',', $header) as $part) {
        [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
        if ($key === 't' && is_numeric($value)) {
            $timestamp = (int) $value;
        } elseif ($key === 'v1' && $value !== '') {
            $signatures[] = $value;
        }
    }

    return [
        'timestamp' => $timestamp,
        'signatures' => $signatures
    ];
}

function verify_stripe_webhook_signature(string $payload, string $header, string $secret, int $toleranceSeconds = 300): bool
{
    if ($payload === '' || $header === '' || $secret === '') {
        return false;
    }

    $parsed = parse_stripe_signature_header($header);
    $timestamp = (int) ($parsed['timestamp'] ?? 0);
    $signatures = is_array($parsed['signatures'] ?? null) ? $parsed['signatures'] : [];

    if ($timestamp <= 0 || $signatures === []) {
        return false;
    }

    if (abs(time() - $timestamp) > $toleranceSeconds) {
        return false;
    }

    $signedPayload = $timestamp . '.' . $payload;
    $expected = hash_hmac('sha256', $signedPayload, $secret);
    foreach ($signatures as $signature) {
        if (hash_equals($expected, (string) $signature)) {
            return true;
        }
    }

    return false;
}

function get_user_storage_key_for_identifier(array $state, string $identifier): string
{
    $cleanIdentifier = trim($identifier);
    if ($cleanIdentifier === '') {
        return '';
    }

    $status = get_identifier_status($state, $cleanIdentifier);
    $preferredIdentifier = trim((string) ($status['preferred_identifier'] ?? $cleanIdentifier));
    $canonicalKey = get_canonical_identifier_key($state, $preferredIdentifier);
    if ($canonicalKey !== '') {
        return $canonicalKey;
    }

    return normalize_identifier_for_lookup($preferredIdentifier);
}

function ensure_stripe_state_sections(array &$state): void
{
    if (!is_array($state['stripe_users'] ?? null)) {
        $state['stripe_users'] = [];
    }
    if (!is_array($state['stripe_customer_index'] ?? null)) {
        $state['stripe_customer_index'] = [];
    }
    if (!is_array($state['stripe_subscription_index'] ?? null)) {
        $state['stripe_subscription_index'] = [];
    }
    if (!is_array($state['stripe_processed_events'] ?? null)) {
        $state['stripe_processed_events'] = [];
    }
}

function normalize_stripe_subscription_status($value): string
{
    return strtolower(trim((string) $value));
}

function is_stripe_subscription_active_status(string $status): bool
{
    return in_array(normalize_stripe_subscription_status($status), ['active', 'trialing'], true);
}

function update_stripe_subscription_state_for_identifier(array &$state, string $identifier, array $subscriptionData, int $nowMs): array
{
    $cleanIdentifier = validate_participant_identifier_string($identifier, 'app_user_identifier', true);
    ensure_stripe_state_sections($state);

    $status = get_identifier_status($state, $cleanIdentifier);
    $preferredIdentifier = trim((string) ($status['preferred_identifier'] ?? $cleanIdentifier));
    $storageKey = get_user_storage_key_for_identifier($state, $preferredIdentifier);
    if ($storageKey === '') {
        throw new RuntimeException('App user identifier is invalid.');
    }

    $customerId = trim((string) ($subscriptionData['customer_id'] ?? ''));
    $subscriptionId = trim((string) ($subscriptionData['subscription_id'] ?? ''));
    $subscriptionStatus = normalize_stripe_subscription_status($subscriptionData['status'] ?? '');
    $plan = normalize_stripe_plan($subscriptionData['plan'] ?? '');
    $checkoutSessionId = trim((string) ($subscriptionData['checkout_session_id'] ?? ''));
    $currentPeriodEndUtc = trim((string) ($subscriptionData['current_period_end_utc'] ?? ''));
    $lastEventId = trim((string) ($subscriptionData['last_event_id'] ?? ''));
    $subscriberEmail = trim((string) ($subscriptionData['subscriber_email'] ?? ''));

    $record = is_array($state['stripe_users'][$storageKey] ?? null)
        ? $state['stripe_users'][$storageKey]
        : [];

    $record['identifier'] = $preferredIdentifier;
    $record['provider'] = 'stripe';
    $record['customer_id'] = $customerId !== '' ? $customerId : (string) ($record['customer_id'] ?? '');
    $record['subscription_id'] = $subscriptionId !== '' ? $subscriptionId : (string) ($record['subscription_id'] ?? '');
    $record['status'] = $subscriptionStatus !== '' ? $subscriptionStatus : (string) ($record['status'] ?? '');
    $record['plan'] = $plan !== '' ? $plan : (string) ($record['plan'] ?? '');
    $record['checkout_session_id'] = $checkoutSessionId !== '' ? $checkoutSessionId : (string) ($record['checkout_session_id'] ?? '');
    $record['current_period_end_utc'] = $currentPeriodEndUtc !== '' ? $currentPeriodEndUtc : (string) ($record['current_period_end_utc'] ?? '');
    $record['last_event_id'] = $lastEventId !== '' ? $lastEventId : (string) ($record['last_event_id'] ?? '');
    $record['subscriber_email'] = $subscriberEmail !== '' ? $subscriberEmail : (string) ($record['subscriber_email'] ?? '');
    $record['updated_ms'] = $nowMs;
    $state['stripe_users'][$storageKey] = $record;

    if ($record['customer_id'] !== '') {
        $state['stripe_customer_index'][$record['customer_id']] = $storageKey;
    }
    if ($record['subscription_id'] !== '') {
        $state['stripe_subscription_index'][$record['subscription_id']] = $storageKey;
    }

    assign_user_type_for_identifier(
        $state,
        $preferredIdentifier,
        is_stripe_subscription_active_status((string) $record['status']) ? 'pro' : 'standard',
        $nowMs
    );

    return $record;
}

function normalize_stripe_checkout_email($value): string
{
    $email = trim((string) $value);
    if ($email === '') {
        return '';
    }

    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

function extract_stripe_checkout_email(array $object, string $identifier = ''): string
{
    $customerDetails = is_array($object['customer_details'] ?? null) ? $object['customer_details'] : [];
    $email = normalize_stripe_checkout_email($customerDetails['email'] ?? '');
    if ($email !== '') {
        return $email;
    }

    $email = normalize_stripe_checkout_email($object['customer_email'] ?? '');
    if ($email !== '') {
        return $email;
    }

    return normalize_stripe_checkout_email($identifier);
}

function format_stripe_plan_label(string $plan): string
{
    $normalized = normalize_stripe_plan($plan);
    if ($normalized === 'annual') {
        return 'annual';
    }
    if ($normalized === 'monthly') {
        return 'monthly';
    }
    return 'subscription';
}

function build_subscription_email_variables(
    string $identifier,
    string $subscriberEmail,
    string $planLabel,
    string $checkoutSessionId = '',
    string $renewalDateUtc = ''
): array {
    return [
        'identifier' => $identifier,
        'plan_label' => $planLabel,
        'subscriber_email' => $subscriberEmail,
        'checkout_session_id' => $checkoutSessionId,
        'renewal_date_utc' => $renewalDateUtc
    ];
}

function build_stripe_admin_notice_body(string $identifier, string $subscriberEmail, string $planLabel, string $checkoutSessionId): string
{
    $lines = [
        'A new Telepathy PRO subscription has completed.',
        '',
        'Identifier: ' . $identifier,
        'Subscriber email: ' . ($subscriberEmail !== '' ? $subscriberEmail : 'not provided'),
        'Plan: ' . $planLabel,
        'Stripe checkout session: ' . ($checkoutSessionId !== '' ? $checkoutSessionId : 'unknown')
    ];

    return implode("\r\n", $lines);
}

function send_subscription_admin_notice(
    array &$state,
    string $subscriptionEmailLogFile,
    string $templateKey,
    string $subject,
    string $body,
    int $nowMs,
    bool $respectSubscriptionEmailToggle = true
): array {
    ensure_subscription_email_state($state);

    $enabled = $respectSubscriptionEmailToggle ? !empty($state['subscription_emails_enabled']) : true;
    $logEntry = [
        'time_utc' => gmdate('Y-m-d H:i:s') . ' UTC',
        'time_ms' => $nowMs,
        'template_key' => $templateKey,
        'recipient_email' => 'dgraboi@sbcglobal.net',
        'recipient_name' => 'Dan Graboi',
        'subject' => $subject,
        'enabled' => $enabled,
        'would_send' => trim($subject) !== '' && trim($body) !== '',
        'sent' => false,
        'message' => ''
    ];

    if (!$enabled) {
        $logEntry['message'] = 'Subscription emails are disabled.';
        append_subscription_email_log($subscriptionEmailLogFile, $logEntry);
        return ['sent' => false, 'message' => $logEntry['message']];
    }

    try {
        sendAppMail('dgraboi@sbcglobal.net', '', $subject, $body);
        $logEntry['sent'] = true;
        $logEntry['message'] = 'Admin subscription notice sent.';
    } catch (Throwable $exception) {
        $logEntry['message'] = $exception->getMessage();
    }

    append_subscription_email_log($subscriptionEmailLogFile, $logEntry);
    return ['sent' => $logEntry['sent'], 'message' => $logEntry['message']];
}

function send_stripe_checkout_notifications(array &$state, string $subscriptionEmailLogFile, string $identifier, string $checkoutSessionId, int $nowMs): array
{
    ensure_stripe_state_sections($state);

    $storageKey = get_user_storage_key_for_identifier($state, $identifier);
    if ($storageKey === '') {
        return ['sent' => false, 'message' => 'No Stripe storage record was available for this identifier.'];
    }

    $record = is_array($state['stripe_users'][$storageKey] ?? null) ? $state['stripe_users'][$storageKey] : [];
    $alreadyNotifiedForSession = trim((string) ($record['last_notified_checkout_session_id'] ?? ''));
    if ($checkoutSessionId !== '' && $alreadyNotifiedForSession === $checkoutSessionId) {
        return ['sent' => false, 'message' => 'Stripe checkout notifications were already sent for this session.'];
    }

    $planLabel = format_stripe_plan_label((string) ($record['plan'] ?? ''));
    $subscriberEmail = normalize_stripe_checkout_email($record['subscriber_email'] ?? '');
    $welcomeSent = false;
    $adminSent = false;
    $errors = [];

    $welcomeResult = deliver_subscription_email(
        $state,
        $subscriptionEmailLogFile,
        'welcome',
        $subscriberEmail,
        $identifier,
        build_subscription_email_variables($identifier, $subscriberEmail, $planLabel, $checkoutSessionId),
        $nowMs
    );
    if (!empty($welcomeResult['sent'])) {
        $record['last_welcome_email_ms'] = $nowMs;
        $record['last_welcome_email_to'] = $subscriberEmail;
        $welcomeSent = true;
    } elseif (!empty($welcomeResult['message'])) {
        $errors[] = 'Welcome email: ' . $welcomeResult['message'];
    }

    $adminResult = send_subscription_admin_notice(
        $state,
        $subscriptionEmailLogFile,
        'admin-new-subscription',
        'New Telepathy PRO subscription',
        build_stripe_admin_notice_body($identifier, $subscriberEmail, $planLabel, $checkoutSessionId),
        $nowMs
    );
    if (!empty($adminResult['sent'])) {
        $record['last_admin_notice_ms'] = $nowMs;
        $adminSent = true;
    } elseif (!empty($adminResult['message'])) {
        $errors[] = 'Admin notice: ' . $adminResult['message'];
    }

    if ($checkoutSessionId !== '') {
        $record['last_notified_checkout_session_id'] = $checkoutSessionId;
    }
    $record['last_notification_error'] = implode(' ', $errors);
    $state['stripe_users'][$storageKey] = $record;

    return [
        'sent' => $welcomeSent || $adminSent,
        'welcome_sent' => $welcomeSent,
        'admin_sent' => $adminSent,
        'message' => $record['last_notification_error'] !== '' ? $record['last_notification_error'] : 'Stripe checkout notifications sent.'
    ];
}

function find_identifier_for_stripe_reference(array $state, string $customerId, string $subscriptionId): string
{
    ensure_stripe_state_sections($state);

    $storageKey = '';
    if ($subscriptionId !== '' && isset($state['stripe_subscription_index'][$subscriptionId])) {
        $storageKey = trim((string) $state['stripe_subscription_index'][$subscriptionId]);
    }
    if ($storageKey === '' && $customerId !== '' && isset($state['stripe_customer_index'][$customerId])) {
        $storageKey = trim((string) $state['stripe_customer_index'][$customerId]);
    }
    if ($storageKey === '') {
        return '';
    }

    $record = is_array($state['stripe_users'][$storageKey] ?? null) ? $state['stripe_users'][$storageKey] : [];
    return trim((string) ($record['identifier'] ?? ''));
}

function prune_stripe_processed_events(array &$state, int $nowMs): void
{
    ensure_stripe_state_sections($state);
    $retentionMs = 180 * 24 * 60 * 60 * 1000;
    foreach ($state['stripe_processed_events'] as $eventId => $processedMs) {
        $processedAt = is_numeric($processedMs) ? (int) $processedMs : 0;
        if ($processedAt <= 0 || ($nowMs - $processedAt) > $retentionMs) {
            unset($state['stripe_processed_events'][$eventId]);
        }
    }
}

function has_processed_stripe_event(array $state, string $eventId): bool
{
    ensure_stripe_state_sections($state);
    return $eventId !== '' && isset($state['stripe_processed_events'][$eventId]);
}

function record_processed_stripe_event(array &$state, string $eventId, int $nowMs): void
{
    ensure_stripe_state_sections($state);
    if ($eventId !== '') {
        $state['stripe_processed_events'][$eventId] = $nowMs;
    }
}

function normalize_stripe_timestamp_to_utc($value): string
{
    if (!is_numeric($value)) {
        return '';
    }

    $seconds = (int) $value;
    if ($seconds <= 0) {
        return '';
    }

    return gmdate('Y-m-d\TH:i:s\Z', $seconds);
}

function is_localhost_request(): bool
{
    $remoteAddr = trim((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
    return in_array($remoteAddr, ['127.0.0.1', '::1'], true);
}

function normalize_utc_text_to_epoch(string $utcText): int
{
    $trimmed = trim($utcText);
    if ($trimmed === '') {
        return 0;
    }

    $timestamp = strtotime($trimmed);
    if ($timestamp === false || $timestamp <= 0) {
        return 0;
    }

    return (int) $timestamp;
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

    $currentUserIdentifier = trim((string) ($metadata['current_user_identifier'] ?? ''));
    if ($currentUserIdentifier !== '') {
        $lines[] = 'Current user identifier: ' . $currentUserIdentifier;
    }

    $allowDisplay = !empty($metadata['allow_display_on_comments_page']);
    $lines[] = 'Allow email on User Comments page: ' . ($allowDisplay ? 'yes' : 'no');

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
        'sync worst',
        'image pair id',
        'sent image',
        'image choice a',
        'image choice b',
        'rx image choice'
    ];
}

function get_demo_pair_seed_definitions(): array
{
    $receiverLocationEast = json_encode([
        'latitude' => 40.7128,
        'longitude' => -74.0060,
        'accuracy' => 18,
        'timestamp' => 1781870000000
    ], JSON_UNESCAPED_SLASHES);
    $senderLocationWest = json_encode([
        'latitude' => 33.06163,
        'longitude' => -117.232628,
        'accuracy' => 16,
        'timestamp' => 1781870000000
    ], JSON_UNESCAPED_SLASHES);
    $receiverLocationEurope = json_encode([
        'latitude' => 48.8566,
        'longitude' => 2.3522,
        'accuracy' => 18,
        'timestamp' => 1781873600000
    ], JSON_UNESCAPED_SLASHES);
    $senderLocationEurope = json_encode([
        'latitude' => 51.5074,
        'longitude' => -0.1278,
        'accuracy' => 16,
        'timestamp' => 1781873600000
    ], JSON_UNESCAPED_SLASHES);

    $baseRecord = static function (
        string $roundId,
        string $receiverName,
        string $senderName,
        string $localDate,
        string $localTime,
        string $utcTime,
        string $receiverLocation,
        string $senderLocation
    ): array {
        return [
            'export schema/version' => '1',
            'round_id' => $roundId,
            'rx name' => $receiverName,
            'tx name' => $senderName,
            'local date' => $localDate,
            'local time' => $localTime,
            'sent layout' => '',
            'difficulty level' => '',
            'trial aborted' => 'no',
            'trial timed out' => 'no',
            'rx choice1' => '',
            'rx choice2' => '',
            'confidence' => '',
            'rx done rt' => '',
            'utc time' => $utcTime,
            'rx location' => $receiverLocation,
            'tx location' => $senderLocation,
            'sync est' => '',
            'sync best' => '',
            'sync worst' => '',
            'image pair id' => '',
            'sent image' => '',
            'image choice a' => '',
            'image choice b' => '',
            'rx image choice' => ''
        ];
    };

    $buildGlobeRecords = static function () use ($baseRecord, $receiverLocationEast, $senderLocationWest, $receiverLocationEurope, $senderLocationEurope): array {
        $receiver = 'demo.globe.receiver@espgym.com';
        $sender = 'demo.globe.sender@espgym.com';
        $records = [];
        $entries = [
            ['globedemo0001', '6/19/2026', '10:01:00 AM', '2026-06-19T17:01:00Z', $receiverLocationEast, $senderLocationWest, '1', '1', '1', '91', '4400'],
            ['globedemo0002', '6/19/2026', '10:03:00 AM', '2026-06-19T17:03:00Z', $receiverLocationEast, $senderLocationWest, '6', '1', '3', '73', '5200'],
            ['globedemo0003', '6/19/2026', '10:05:00 AM', '2026-06-19T17:05:00Z', $receiverLocationEast, $senderLocationWest, '1', '2', '1', '88', '6100'],
            ['globedemo0004', '6/19/2026', '10:07:00 AM', '2026-06-19T17:07:00Z', $receiverLocationEast, $senderLocationWest, '7', '2', '9', '41', '8400'],
            ['globedemo0005', '6/19/2026', '10:09:00 AM', '2026-06-19T17:09:00Z', $receiverLocationEurope, $senderLocationEurope, '5', '3', '5', '84', '7600'],
            ['globedemo0006', '6/19/2026', '10:11:00 AM', '2026-06-19T17:11:00Z', $receiverLocationEurope, $senderLocationEurope, '4', '3', '2', '36', '11200'],
            ['globedemo0007', '6/19/2026', '10:13:00 AM', '2026-06-19T17:13:00Z', $receiverLocationEurope, $senderLocationEurope, '1', '4', '', '79', '9300', 'pair-0001', '1707.jpg', '1707.jpg', '4162.jpg', '1707.jpg'],
            ['globedemo0008', '6/19/2026', '10:15:00 AM', '2026-06-19T17:15:00Z', $receiverLocationEurope, $senderLocationEurope, '1', '4', '', '46', '10100', 'pair-0002', '1828.jpg', '1295.jpg', '1828.jpg', '1295.jpg'],
            ['globedemo0009', '6/19/2026', '10:17:00 AM', '2026-06-19T17:17:00Z', $receiverLocationEurope, $senderLocationEurope, '6', '1', '3', '68', '5800'],
            ['globedemo0010', '6/19/2026', '10:19:00 AM', '2026-06-19T17:19:00Z', $receiverLocationEast, $senderLocationWest, '8', '2', '8', '77', '6900'],
            ['globedemo0011', '6/19/2026', '10:21:00 AM', '2026-06-19T17:21:00Z', $receiverLocationEast, $senderLocationWest, '9', '3', '9', '72', '8700'],
            ['globedemo0012', '6/19/2026', '10:23:00 AM', '2026-06-19T17:23:00Z', $receiverLocationEast, $senderLocationWest, '1', '4', '', '82', '9500', 'pair-0003', '1981.jpg', '1981.jpg', '2075.jpg', '1981.jpg']
        ];

        foreach ($entries as $entry) {
            [
                $roundId,
                $localDate,
                $localTime,
                $utcTime,
                $receiverLocation,
                $senderLocation,
                $sentLayout,
                $difficulty,
                $choiceOne,
                $confidence,
                $doneRt,
                $imagePairId,
                $sentImage,
                $imageChoiceA,
                $imageChoiceB,
                $rxImageChoice
            ] = array_pad($entry, 16, '');

            $record = $baseRecord($roundId, $receiver, $sender, $localDate, $localTime, $utcTime, $receiverLocation, $senderLocation);
            $record['sent layout'] = $sentLayout;
            $record['difficulty level'] = $difficulty;
            $record['rx choice1'] = $choiceOne;
            $record['confidence'] = $confidence;
            $record['rx done rt'] = $doneRt;
            $record['image pair id'] = $imagePairId;
            $record['sent image'] = $sentImage;
            $record['image choice a'] = $imageChoiceA;
            $record['image choice b'] = $imageChoiceB;
            $record['rx image choice'] = $rxImageChoice;
            $records[] = $record;
        }

        return $records;
    };

    $buildRandomLevelTwoRecords = static function () use ($baseRecord, $receiverLocationEast, $senderLocationWest): array {
        $receiver = 'demo.random.level2.receiver@espgym.com';
        $sender = 'demo.random.level2.sender@espgym.com';
        $entries = [
            ['lvl2rand0001', '6/19/2026', '11:01:00 AM', '2026-06-19T18:01:00Z', '1', '2', '1', '86', '4921'],
            ['lvl2rand0002', '6/19/2026', '11:02:00 AM', '2026-06-19T18:02:00Z', '6', '2', '1', '36', '10990'],
            ['lvl2rand0003', '6/19/2026', '11:03:00 AM', '2026-06-19T18:03:00Z', '7', '2', '9', '54', '8674'],
            ['lvl2rand0004', '6/19/2026', '11:04:00 AM', '2026-06-19T18:04:00Z', '6', '2', '6', '32', '12342'],
            ['lvl2rand0005', '6/19/2026', '11:05:00 AM', '2026-06-19T18:05:00Z', '8', '2', '7', '79', '8261'],
            ['lvl2rand0006', '6/19/2026', '11:06:00 AM', '2026-06-19T18:06:00Z', '8', '2', '1', '66', '12360'],
            ['lvl2rand0007', '6/19/2026', '11:07:00 AM', '2026-06-19T18:07:00Z', '6', '2', '8', '74', '13679']
        ];

        $records = [];
        foreach ($entries as [$roundId, $localDate, $localTime, $utcTime, $sentLayout, $difficulty, $choiceOne, $confidence, $doneRt]) {
            $record = $baseRecord($roundId, $receiver, $sender, $localDate, $localTime, $utcTime, $receiverLocationEast, $senderLocationWest);
            $record['sent layout'] = $sentLayout;
            $record['difficulty level'] = $difficulty;
            $record['rx choice1'] = $choiceOne;
            $record['confidence'] = $confidence;
            $record['rx done rt'] = $doneRt;
            $records[] = $record;
        }

        return $records;
    };

    $buildRandomLevelThreeRecords = static function () use ($baseRecord, $receiverLocationEast, $senderLocationWest): array {
        $receiver = 'demo.random.level3.receiver@espgym.com';
        $sender = 'demo.random.level3.sender@espgym.com';
        $entries = [
            ['lvl3rand0001', '6/19/2026', '11:01:00 AM', '2026-06-19T18:01:00Z', '4', '3', '6', '40', '2505'],
            ['lvl3rand0002', '6/19/2026', '11:02:00 AM', '2026-06-19T18:02:00Z', '9', '3', '5', '52', '7520'],
            ['lvl3rand0003', '6/19/2026', '11:03:00 AM', '2026-06-19T18:03:00Z', '5', '3', '1', '81', '8542'],
            ['lvl3rand0004', '6/19/2026', '11:04:00 AM', '2026-06-19T18:04:00Z', '4', '3', '2', '33', '9465'],
            ['lvl3rand0005', '6/19/2026', '11:05:00 AM', '2026-06-19T18:05:00Z', '1', '3', '7', '50', '2914'],
            ['lvl3rand0006', '6/19/2026', '11:06:00 AM', '2026-06-19T18:06:00Z', '5', '3', '8', '51', '10574'],
            ['lvl3rand0007', '6/19/2026', '11:07:00 AM', '2026-06-19T18:07:00Z', '4', '3', '2', '49', '6466']
        ];

        $records = [];
        foreach ($entries as [$roundId, $localDate, $localTime, $utcTime, $sentLayout, $difficulty, $choiceOne, $confidence, $doneRt]) {
            $record = $baseRecord($roundId, $receiver, $sender, $localDate, $localTime, $utcTime, $receiverLocationEast, $senderLocationWest);
            $record['sent layout'] = $sentLayout;
            $record['difficulty level'] = $difficulty;
            $record['rx choice1'] = $choiceOne;
            $record['confidence'] = $confidence;
            $record['rx done rt'] = $doneRt;
            $records[] = $record;
        }

        return $records;
    };

    $buildMixedLevelOneTwoRecords = static function () use ($baseRecord, $receiverLocationEast, $senderLocationWest): array {
        $receiver = 'demo.mixed.level12.receiver@espgym.com';
        $sender = 'demo.mixed.level12.sender@espgym.com';
        $levelOneSentLayouts = [1, 6, 1, 7, 1, 8, 1, 9, 6, 1, 7, 1, 8, 1, 9, 1, 6, 7, 8, 9];
        $levelTwoSentLayouts = [1, 6, 7, 1, 8, 9];
        $drawSeriesValue = static function (int $index): int {
            $bucketSeed = hexdec(substr(hash('sha256', 'demo-mixed-level12-v2-bucket-' . $index), 0, 8));
            $valueSeed = hexdec(substr(hash('sha256', 'demo-mixed-level12-v2-value-' . $index), 0, 8));
            $useLowerBucket = ($bucketSeed % 2) === 0;
            return $useLowerBucket
                ? 1 + ($valueSeed % 60)
                : 61 + ($valueSeed % 40);
        };
        $isCorrectDraw = static function (int $index) use ($drawSeriesValue): bool {
            return $drawSeriesValue($index) <= 60;
        };
        $records = [];
        $baseUtc = strtotime('2026-06-19 19:00:00 UTC');
        $baseLocal = strtotime('2026-06-19 12:00:00');

        for ($index = 0; $index < 20; $index += 1) {
            $sentLayout = $levelOneSentLayouts[$index];
            $sentConeCount = $sentLayout === 1 ? 1 : 3;
            $isCorrect = $isCorrectDraw($index + 1);
            $choiceOne = $sentConeCount === 1
                ? ($isCorrect ? '1' : '3')
                : ($isCorrect ? '3' : '1');
            $confidence = $isCorrect ? '78' : '39';
            $doneRt = (string) (4300 + ($index * 170));
            $utcTime = gmdate('Y-m-d\\TH:i:s\\Z', $baseUtc + ($index * 120));
            $localTime = date('g:i:s A', $baseLocal + ($index * 120));
            $record = $baseRecord(
                sprintf('lvl12mix%04d', $index + 1),
                $receiver,
                $sender,
                '6/19/2026',
                $localTime,
                $utcTime,
                $receiverLocationEast,
                $senderLocationWest
            );
            $record['sent layout'] = (string) $sentLayout;
            $record['difficulty level'] = '1';
            $record['rx choice1'] = $choiceOne;
            $record['confidence'] = $confidence;
            $record['rx done rt'] = $doneRt;
            $records[] = $record;
        }

        for ($index = 0; $index < 6; $index += 1) {
            $seriesIndex = 21 + $index;
            $sentLayout = $levelTwoSentLayouts[$index];
            $isCorrect = $isCorrectDraw($seriesIndex);
            if ($sentLayout === 1) {
                $choiceOne = $isCorrect ? '1' : '6';
            } else {
                $choiceOne = $isCorrect ? (string) $sentLayout : '1';
            }
            $confidence = $isCorrect ? '74' : '35';
            $doneRt = (string) (6100 + ($index * 260));
            $utcTime = gmdate('Y-m-d\\TH:i:s\\Z', $baseUtc + ((20 + $index) * 120));
            $localTime = date('g:i:s A', $baseLocal + ((20 + $index) * 120));
            $record = $baseRecord(
                sprintf('lvl12mix%04d', 21 + $index),
                $receiver,
                $sender,
                '6/19/2026',
                $localTime,
                $utcTime,
                $receiverLocationEast,
                $senderLocationWest
            );
            $record['sent layout'] = (string) $sentLayout;
            $record['difficulty level'] = '2';
            $record['rx choice1'] = $choiceOne;
            $record['confidence'] = $confidence;
            $record['rx done rt'] = $doneRt;
            $records[] = $record;
        }

        return $records;
    };

    return [
        [
            'receiver_name' => 'demo.globe.receiver@espgym.com',
            'sender_name' => 'demo.globe.sender@espgym.com',
            'records' => $buildGlobeRecords()
        ],
        [
            'receiver_name' => 'demo.random.level2.receiver@espgym.com',
            'sender_name' => 'demo.random.level2.sender@espgym.com',
            'records' => $buildRandomLevelTwoRecords()
        ],
        [
            'receiver_name' => 'demo.random.level3.receiver@espgym.com',
            'sender_name' => 'demo.random.level3.sender@espgym.com',
            'records' => $buildRandomLevelThreeRecords()
        ],
        [
            'receiver_name' => 'demo.mixed.level12.receiver@espgym.com',
            'sender_name' => 'demo.mixed.level12.sender@espgym.com',
            'records' => $buildMixedLevelOneTwoRecords()
        ]
    ];
}

function ensure_demo_pair_records(string $pairsDir, bool $force = false): void
{
    foreach (get_demo_pair_seed_definitions() as $definition) {
        $receiverName = trim((string) ($definition['receiver_name'] ?? ''));
        $senderName = trim((string) ($definition['sender_name'] ?? ''));
        $records = is_array($definition['records'] ?? null) ? $definition['records'] : [];
        if ($receiverName === '' || $senderName === '' || !$records) {
            continue;
        }

        $path = get_pair_trial_csv_path($pairsDir, $receiverName, $senderName);
        if (!$force && is_file($path) && filesize($path) > 0) {
            continue;
        }

        write_pair_trial_records($path, $records);
    }
}

function get_public_image_pair_url(string $filename): string
{
    return 'imagepairs/' . rawurlencode(trim($filename));
}

function sanitize_image_pair_filename(string $filename): string
{
    $base = basename(trim($filename));
    $safe = preg_replace('/[^A-Za-z0-9._-]+/', '-', $base) ?? '';
    $safe = trim($safe, '-');
    if ($safe === '') {
        throw new RuntimeException('Image filename is invalid.');
    }

    $extension = strtolower(pathinfo($safe, PATHINFO_EXTENSION));
    if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
        throw new RuntimeException('Image files must be jpg, jpeg, png, webp, or gif.');
    }

    return $safe;
}

function normalize_image_pairs_manifest(array $parsed): array
{
    $pairs = [];
    $seenIds = [];

    foreach ((array) ($parsed['pairs'] ?? []) as $index => $pair) {
        if (!is_array($pair)) {
            continue;
        }

        $id = trim((string) ($pair['id'] ?? ''));
        if ($id === '') {
            $id = sprintf('pair-%04d', $index + 1);
        }

        $images = array_values(array_filter(array_map(static function ($value): string {
            try {
                return sanitize_image_pair_filename((string) $value);
            } catch (Throwable $exception) {
                return '';
            }
        }, (array) ($pair['images'] ?? []))));

        if (count($images) !== 2 || isset($seenIds[$id])) {
            continue;
        }

        $seenIds[$id] = true;
        $pairs[] = [
            'id' => $id,
            'images' => [$images[0], $images[1]]
        ];
    }

    return [
        'version' => isset($parsed['version']) && is_numeric($parsed['version']) ? (int) $parsed['version'] : 1,
        'updated_at' => trim((string) ($parsed['updated_at'] ?? gmdate('c'))),
        'pairs' => $pairs
    ];
}

function load_image_pairs_manifest(string $manifestPath): array
{
    if (!is_file($manifestPath)) {
        return normalize_image_pairs_manifest([
            'version' => 1,
            'updated_at' => gmdate('c'),
            'pairs' => []
        ]);
    }

    $raw = file_get_contents($manifestPath);
    $parsed = json_decode((string) $raw, true);
    if (!is_array($parsed)) {
        throw new RuntimeException('The image-pair manifest is not valid JSON.');
    }

    return normalize_image_pairs_manifest($parsed);
}

function save_image_pairs_manifest(string $manifestPath, array $manifest): void
{
    $normalized = normalize_image_pairs_manifest($manifest);
    $normalized['updated_at'] = gmdate('c');
    $payload = json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        throw new RuntimeException('Unable to encode the image-pair manifest.');
    }
    file_put_contents($manifestPath, $payload);
}

function build_image_pair_public_record(array $pair): array
{
    $images = array_values((array) ($pair['images'] ?? []));
    if (count($images) < 2) {
        throw new RuntimeException('Each image pair must contain exactly two images.');
    }

    return [
        'id' => trim((string) ($pair['id'] ?? '')),
        'images' => [$images[0], $images[1]],
        'choice_a' => get_public_image_pair_url($images[0]),
        'choice_b' => get_public_image_pair_url($images[1])
    ];
}

function get_level_four_image_pairs(string $manifestPath): array
{
    $manifest = load_image_pairs_manifest($manifestPath);
    $pairs = [];
    foreach ($manifest['pairs'] as $pair) {
        $pairs[] = build_image_pair_public_record($pair);
    }
    return $pairs;
}

function default_level_four_session_state(): array
{
    return [
        'dataset_signature' => '',
        'remaining_pair_ids' => [],
        'used_pair_ids' => [],
        'updated_ms' => 0
    ];
}

function default_level_four_receiver_pool_state(string $receiverIdentifier = ''): array
{
    return [
        'receiver_identifier' => trim($receiverIdentifier),
        'dataset_signature' => '',
        'remaining_pair_ids' => [],
        'used_pair_ids' => [],
        'updated_ms' => 0
    ];
}

function reset_level_four_session(array &$session): void
{
    $session['level_four'] = default_level_four_session_state();
}

function ensure_level_four_session_pool(array &$session, array $pairs, int $nowMs): void
{
    if (!is_array($session['level_four'] ?? null)) {
        $session['level_four'] = default_level_four_session_state();
    }

    $pairIds = array_values(array_map(static fn (array $pair): string => (string) ($pair['id'] ?? ''), $pairs));
    $datasetSignature = implode('|', $pairIds);
    $currentSignature = trim((string) ($session['level_four']['dataset_signature'] ?? ''));

    if ($currentSignature !== $datasetSignature) {
        $session['level_four'] = [
            'dataset_signature' => $datasetSignature,
            'remaining_pair_ids' => $pairIds,
            'used_pair_ids' => [],
            'updated_ms' => $nowMs
        ];
        return;
    }

    if (!is_array($session['level_four']['remaining_pair_ids'] ?? null)) {
        $session['level_four']['remaining_pair_ids'] = $pairIds;
    }
    if (!is_array($session['level_four']['used_pair_ids'] ?? null)) {
        $session['level_four']['used_pair_ids'] = [];
    }
}

function pick_level_four_image_pair_for_session(array &$session, array $pairs, int $nowMs): ?array
{
    ensure_level_four_session_pool($session, $pairs, $nowMs);

    $remainingIds = array_values(array_filter(array_map('strval', (array) ($session['level_four']['remaining_pair_ids'] ?? []))));
    if ($remainingIds === []) {
        return null;
    }

    $pairIndexById = [];
    foreach ($pairs as $pair) {
        $pairIndexById[(string) ($pair['id'] ?? '')] = $pair;
    }

    $remainingIds = array_values(array_filter($remainingIds, static fn (string $id): bool => isset($pairIndexById[$id])));
    if ($remainingIds === []) {
        $session['level_four']['remaining_pair_ids'] = [];
        return null;
    }

    $selectedRemainingOffset = random_int(0, count($remainingIds) - 1);
    $selectedPairId = $remainingIds[$selectedRemainingOffset];
    $selectedPair = $pairIndexById[$selectedPairId] ?? null;
    if (!is_array($selectedPair)) {
        return null;
    }

    unset($remainingIds[$selectedRemainingOffset]);
    $remainingIds = array_values($remainingIds);
    $usedIds = array_values(array_filter(array_map('strval', (array) ($session['level_four']['used_pair_ids'] ?? []))));
    $usedIds[] = $selectedPairId;

    $selectedImageIndex = random_int(1, 2);
    $sentImage = $selectedImageIndex === 1
        ? (string) ($selectedPair['choice_a'] ?? '')
        : (string) ($selectedPair['choice_b'] ?? '');

    $session['level_four']['remaining_pair_ids'] = $remainingIds;
    $session['level_four']['used_pair_ids'] = $usedIds;
    $session['level_four']['updated_ms'] = $nowMs;

    return [
        'id' => $selectedPairId,
        'images' => (array) ($selectedPair['images'] ?? []),
        'image_choice_a' => (string) ($selectedPair['choice_a'] ?? ''),
        'image_choice_b' => (string) ($selectedPair['choice_b'] ?? ''),
        'image_sent_index' => $selectedImageIndex,
        'image_sent' => $sentImage,
        'remaining_after_pick' => count($remainingIds)
    ];
}

function get_level_four_receiver_pool_key(array $state, string $receiverIdentifier): string
{
    $preferred = trim($receiverIdentifier);
    if ($preferred === '') {
        return '';
    }

    $canonicalKey = get_canonical_identifier_key($state, $preferred);
    if ($canonicalKey !== '') {
        return $canonicalKey;
    }

    return normalize_identifier_for_lookup($preferred);
}

function ensure_level_four_receiver_pool(array &$state, string $receiverIdentifier, array $pairs, int $nowMs): string
{
    if (!is_array($state['level_four_receiver_pools'] ?? null)) {
        $state['level_four_receiver_pools'] = [];
    }

    $poolKey = get_level_four_receiver_pool_key($state, $receiverIdentifier);
    if ($poolKey === '') {
        return '';
    }

    $pairIds = array_values(array_filter(array_map(
        static fn (array $pair): string => (string) ($pair['id'] ?? ''),
        $pairs
    )));
    $datasetSignature = implode('|', $pairIds);
    $pool = is_array($state['level_four_receiver_pools'][$poolKey] ?? null)
        ? $state['level_four_receiver_pools'][$poolKey]
        : default_level_four_receiver_pool_state($receiverIdentifier);

    $currentSignature = trim((string) ($pool['dataset_signature'] ?? ''));
    if ($currentSignature !== $datasetSignature) {
        $state['level_four_receiver_pools'][$poolKey] = [
            'receiver_identifier' => trim($receiverIdentifier),
            'dataset_signature' => $datasetSignature,
            'remaining_pair_ids' => $pairIds,
            'used_pair_ids' => [],
            'updated_ms' => $nowMs
        ];
        return $poolKey;
    }

    if (!is_array($pool['remaining_pair_ids'] ?? null)) {
        $pool['remaining_pair_ids'] = $pairIds;
    }
    if (!is_array($pool['used_pair_ids'] ?? null)) {
        $pool['used_pair_ids'] = [];
    }
    $pool['receiver_identifier'] = trim($receiverIdentifier);
    $pool['updated_ms'] = $nowMs;
    $state['level_four_receiver_pools'][$poolKey] = $pool;
    return $poolKey;
}

function pick_level_four_image_pair_for_receiver(array &$state, string $receiverIdentifier, array $pairs, int $nowMs): ?array
{
    $poolKey = ensure_level_four_receiver_pool($state, $receiverIdentifier, $pairs, $nowMs);
    if ($poolKey === '') {
        return null;
    }

    $pool = is_array($state['level_four_receiver_pools'][$poolKey] ?? null)
        ? $state['level_four_receiver_pools'][$poolKey]
        : default_level_four_receiver_pool_state($receiverIdentifier);
    $remainingIds = array_values(array_filter(array_map('strval', (array) ($pool['remaining_pair_ids'] ?? []))));
    if ($remainingIds === []) {
        return null;
    }

    $pairIndexById = [];
    foreach ($pairs as $pair) {
        $pairIndexById[(string) ($pair['id'] ?? '')] = $pair;
    }

    $remainingIds = array_values(array_filter($remainingIds, static fn (string $id): bool => isset($pairIndexById[$id])));
    if ($remainingIds === []) {
        $pool['remaining_pair_ids'] = [];
        $pool['updated_ms'] = $nowMs;
        $state['level_four_receiver_pools'][$poolKey] = $pool;
        return null;
    }

    $selectedRemainingOffset = random_int(0, count($remainingIds) - 1);
    $selectedPairId = $remainingIds[$selectedRemainingOffset];
    $selectedPair = $pairIndexById[$selectedPairId] ?? null;
    if (!is_array($selectedPair)) {
        return null;
    }

    unset($remainingIds[$selectedRemainingOffset]);
    $remainingIds = array_values($remainingIds);
    $usedIds = array_values(array_filter(array_map('strval', (array) ($pool['used_pair_ids'] ?? []))));
    $usedIds[] = $selectedPairId;

    $selectedImageIndex = random_int(1, 2);
    $sentImage = $selectedImageIndex === 1
        ? (string) ($selectedPair['choice_a'] ?? '')
        : (string) ($selectedPair['choice_b'] ?? '');

    $pool['remaining_pair_ids'] = $remainingIds;
    $pool['used_pair_ids'] = $usedIds;
    $pool['updated_ms'] = $nowMs;
    $state['level_four_receiver_pools'][$poolKey] = $pool;

    return [
        'id' => $selectedPairId,
        'images' => (array) ($selectedPair['images'] ?? []),
        'image_choice_a' => (string) ($selectedPair['choice_a'] ?? ''),
        'image_choice_b' => (string) ($selectedPair['choice_b'] ?? ''),
        'image_sent_index' => $selectedImageIndex,
        'image_sent' => $sentImage,
        'remaining_after_pick' => count($remainingIds)
    ];
}

function decode_image_data_url(string $dataUrl): array
{
    if (!preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $dataUrl, $matches)) {
        throw new RuntimeException('Image upload content must be a valid data URL.');
    }

    $binary = base64_decode($matches[2], true);
    if ($binary === false) {
        throw new RuntimeException('Image upload content is not valid base64.');
    }

    return [
        'mime' => strtolower($matches[1]),
        'bytes' => $binary
    ];
}

function store_uploaded_image_pair_file(string $imagePairsDir, array $filePayload): string
{
    $originalName = sanitize_image_pair_filename((string) ($filePayload['name'] ?? ''));
    $decoded = decode_image_data_url((string) ($filePayload['data_url'] ?? ''));
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $mime = $decoded['mime'];
    if (
        ($extension === 'jpg' || $extension === 'jpeg') && !in_array($mime, ['image/jpeg', 'image/jpg'], true)
        || ($extension === 'png' && $mime !== 'image/png')
        || ($extension === 'webp' && $mime !== 'image/webp')
        || ($extension === 'gif' && $mime !== 'image/gif')
    ) {
        throw new RuntimeException('Uploaded image content does not match its filename extension.');
    }

    $baseName = pathinfo($originalName, PATHINFO_FILENAME);
    $candidateName = $originalName;
    $targetPath = $imagePairsDir . DIRECTORY_SEPARATOR . $candidateName;
    $suffix = 1;
    while (is_file($targetPath)) {
        $candidateName = $baseName . '-' . gmdate('YmdHis') . '-' . $suffix . '.' . $extension;
        $targetPath = $imagePairsDir . DIRECTORY_SEPARATOR . $candidateName;
        $suffix += 1;
    }

    file_put_contents($targetPath, $decoded['bytes']);
    return $candidateName;
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

function is_demo_report_pair(string $receiverName, string $senderName): bool
{
    static $demoPairs = [
        'demo.globe.receiver@espgym.com|||demo.globe.sender@espgym.com' => true,
        'demo.mixed.level12.receiver@espgym.com|||demo.mixed.level12.sender@espgym.com' => true,
        'demo.random.level2.receiver@espgym.com|||demo.random.level2.sender@espgym.com' => true,
        'demo.random.level3.receiver@espgym.com|||demo.random.level3.sender@espgym.com' => true
    ];

    return isset($demoPairs[build_pair_match_key($receiverName, $senderName)]);
}

function default_launcher_profile_state(): array
{
    return [
        'own_email' => '',
        'preferred_handle' => '',
        'current_partner' => '',
        'difficulty_level' => '1',
        'partner_history' => [],
        'deleted_partners' => [],
        'updated_ms' => 0
    ];
}

function ensure_esp_lesson_state(array &$state): void
{
    if (!is_array($state['esp_lessons'] ?? null)) {
        $state['esp_lessons'] = [];
    }
}

function normalize_esp_lesson_id($value): string
{
    $text = trim((string) $value);
    if ($text === '') {
        return '';
    }
    return preg_match('/^[A-Za-z0-9._:-]{1,160}$/', $text) ? $text : '';
}

function validate_esp_lesson_ids($value, string $field = 'lesson_ids'): array
{
    if (!is_array($value)) {
        throw new RuntimeException($field . ' must be an array.');
    }
    $normalized = [];
    foreach ($value as $item) {
        $lessonId = normalize_esp_lesson_id($item);
        if ($lessonId === '') {
            throw new RuntimeException($field . ' contains an invalid lesson identifier.');
        }
        $normalized[$lessonId] = $lessonId;
    }
    return array_values($normalized);
}

function normalize_esp_lesson_progress_record(array $record): array
{
    $queue = [];
    foreach ((array) ($record['current_cycle_queue'] ?? []) as $lessonId) {
        $normalized = normalize_esp_lesson_id($lessonId);
        if ($normalized !== '') {
            $queue[$normalized] = $normalized;
        }
    }

    $dismissed = [];
    foreach ((array) ($record['dismissed_ids'] ?? []) as $lessonId) {
        $normalized = normalize_esp_lesson_id($lessonId);
        if ($normalized !== '') {
            $dismissed[$normalized] = $normalized;
        }
    }

    $seen = [];
    foreach ((array) ($record['seen_in_cycle_ids'] ?? []) as $lessonId) {
        $normalized = normalize_esp_lesson_id($lessonId);
        if ($normalized !== '') {
            $seen[$normalized] = $normalized;
        }
    }

    return [
        'identifier' => trim((string) ($record['identifier'] ?? '')),
        'current_cycle_queue' => array_values($queue),
        'dismissed_ids' => array_values($dismissed),
        'seen_in_cycle_ids' => array_values($seen),
        'updated_ms' => isset($record['updated_ms']) && is_numeric($record['updated_ms']) ? (int) $record['updated_ms'] : 0
    ];
}

function reconcile_esp_lesson_progress_record(array $record, array $availableLessonIds, int $nowMs): array
{
    $normalizedRecord = normalize_esp_lesson_progress_record($record);
    $available = [];
    foreach ($availableLessonIds as $lessonId) {
        $normalized = normalize_esp_lesson_id($lessonId);
        if ($normalized !== '') {
            $available[$normalized] = $normalized;
        }
    }
    $availableOrdered = array_values($available);
    $availableSet = array_fill_keys($availableOrdered, true);

    $dismissed = array_values(array_filter(
        $normalizedRecord['dismissed_ids'],
        static fn(string $lessonId): bool => isset($availableSet[$lessonId])
    ));
    $dismissedSet = array_fill_keys($dismissed, true);

    $seen = array_values(array_filter(
        $normalizedRecord['seen_in_cycle_ids'],
        static fn(string $lessonId): bool => isset($availableSet[$lessonId]) && !isset($dismissedSet[$lessonId])
    ));
    $seenSet = array_fill_keys($seen, true);

    $queue = [];
    foreach ($normalizedRecord['current_cycle_queue'] as $lessonId) {
        if (isset($availableSet[$lessonId]) && !isset($dismissedSet[$lessonId]) && !isset($queue[$lessonId])) {
            $queue[$lessonId] = $lessonId;
        }
    }

    foreach ($availableOrdered as $lessonId) {
        if (!isset($queue[$lessonId]) && !isset($dismissedSet[$lessonId]) && !isset($seenSet[$lessonId])) {
            $queue[$lessonId] = $lessonId;
        }
    }

    $queueValues = array_values($queue);
    if (!$queueValues) {
        $activeIds = array_values(array_filter(
            $availableOrdered,
            static fn(string $lessonId): bool => !isset($dismissedSet[$lessonId])
        ));
        if ($activeIds) {
            $unseen = array_values(array_filter(
                $activeIds,
                static fn(string $lessonId): bool => !isset($seenSet[$lessonId])
            ));
            if ($unseen) {
                $queueValues = $unseen;
            } else {
                $seen = [];
                $seenSet = [];
                $queueValues = $activeIds;
            }
        }
    }

    $normalizedRecord['current_cycle_queue'] = $queueValues;
    $normalizedRecord['dismissed_ids'] = $dismissed;
    $normalizedRecord['seen_in_cycle_ids'] = $seen;
    $normalizedRecord['updated_ms'] = $nowMs;
    return $normalizedRecord;
}

function get_esp_lesson_progress_record(array &$state, string $identifier, array $availableLessonIds, int $nowMs): array
{
    ensure_esp_lesson_state($state);
    $storageKey = get_user_storage_key_for_identifier($state, $identifier);
    if ($storageKey === '') {
        return [
            'identifier' => trim($identifier),
            'current_cycle_queue' => [],
            'dismissed_ids' => [],
            'seen_in_cycle_ids' => [],
            'updated_ms' => $nowMs
        ];
    }
    $existing = is_array($state['esp_lessons'][$storageKey] ?? null) ? $state['esp_lessons'][$storageKey] : [
        'identifier' => trim($identifier)
    ];
    $normalized = reconcile_esp_lesson_progress_record($existing, $availableLessonIds, $nowMs);
    $normalized['identifier'] = trim($identifier);
    $state['esp_lessons'][$storageKey] = $normalized;
    return $normalized;
}

function advance_esp_lesson_progress_record(array &$state, string $identifier, array $availableLessonIds, string $command, string $currentLessonId, int $nowMs): array
{
    $record = get_esp_lesson_progress_record($state, $identifier, $availableLessonIds, $nowMs);
    $normalizedCommand = strtolower(trim($command));
    if (!in_array($normalizedCommand, ['next', 'dismiss'], true)) {
        throw new RuntimeException('ESP lesson command is invalid.');
    }

    $queue = array_values($record['current_cycle_queue']);
    $queueCurrent = isset($queue[0]) ? (string) $queue[0] : '';
    $requestedCurrent = normalize_esp_lesson_id($currentLessonId);
    $effectiveCurrent = $requestedCurrent !== '' ? $requestedCurrent : $queueCurrent;

    if ($queueCurrent !== '' && $effectiveCurrent !== '' && $effectiveCurrent !== $queueCurrent) {
        $matchingIndex = array_search($effectiveCurrent, $queue, true);
        if ($matchingIndex !== false) {
            array_splice($queue, $matchingIndex, 1);
            array_unshift($queue, $effectiveCurrent);
            $queueCurrent = (string) ($queue[0] ?? '');
        }
    }

    if ($queueCurrent !== '') {
        $seenSet = array_fill_keys($record['seen_in_cycle_ids'], true);
        $dismissedSet = array_fill_keys($record['dismissed_ids'], true);
        array_shift($queue);
        if ($normalizedCommand === 'dismiss') {
            $dismissedSet[$queueCurrent] = $queueCurrent;
            unset($seenSet[$queueCurrent]);
        } else {
            $seenSet[$queueCurrent] = $queueCurrent;
        }
        $record['current_cycle_queue'] = array_values($queue);
        $record['dismissed_ids'] = array_values($dismissedSet);
        $record['seen_in_cycle_ids'] = array_values($seenSet);
    }

    $record = reconcile_esp_lesson_progress_record($record, $availableLessonIds, $nowMs);
    $storageKey = get_user_storage_key_for_identifier($state, $identifier);
    if ($storageKey !== '') {
        $state['esp_lessons'][$storageKey] = $record;
    }
    return $record;
}

function load_webpush_config(string $path): array
{
    if (!is_file($path)) {
        return [
            'available' => false,
            'message' => 'Web Push configuration file is missing.'
        ];
    }

    $raw = file_get_contents($path);
    $decoded = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($decoded)) {
        return [
            'available' => false,
            'message' => 'Web Push configuration file is not valid JSON.'
        ];
    }

    $subject = trim((string) ($decoded['subject'] ?? ''));
    $publicKey = trim((string) ($decoded['publicKey'] ?? ''));
    $privateKey = trim((string) ($decoded['privateKey'] ?? ''));
    if ($subject === '' || $publicKey === '' || $privateKey === '') {
        return [
            'available' => false,
            'message' => 'Web Push configuration is incomplete.'
        ];
    }

    try {
        $validated = VAPID::validate([
            'subject' => $subject,
            'publicKey' => $publicKey,
            'privateKey' => $privateKey
        ]);
    } catch (Throwable $exception) {
        return [
            'available' => false,
            'message' => 'Web Push configuration is invalid: ' . $exception->getMessage()
        ];
    }

    return [
        'available' => true,
        'subject' => $subject,
        'publicKey' => $publicKey,
        'privateKey' => $privateKey,
        'validated' => $validated
    ];
}

function normalize_device_id_value($value): string
{
    return trim((string) $value);
}

function validate_device_id_value($value, string $field = 'device_id'): string
{
    $text = normalize_device_id_value($value);
    if ($text === '' || strlen($text) < 8 || strlen($text) > 128 || !preg_match('/^[A-Za-z0-9._:-]+$/', $text)) {
        throw new RuntimeException($field . ' must be 8 to 128 characters long and use only letters, numbers, period, underscore, colon, or hyphen.');
    }
    return $text;
}

function validate_push_subscription_payload($value, string $field = 'push_subscription'): array
{
    if (!is_array($value)) {
        throw new RuntimeException($field . ' must be an object.');
    }

    require_allowed_keys($value, ['endpoint', 'keys', 'expirationTime', 'contentEncoding'], $field);

    $endpoint = trim((string) ($value['endpoint'] ?? ''));
    if ($endpoint === '' || !filter_var($endpoint, FILTER_VALIDATE_URL)) {
        throw new RuntimeException($field . '.endpoint must be a valid URL.');
    }

    $keys = $value['keys'] ?? null;
    if (!is_array($keys)) {
        throw new RuntimeException($field . '.keys must be an object.');
    }
    require_allowed_keys($keys, ['p256dh', 'auth'], $field . '.keys');

    $p256dh = trim((string) ($keys['p256dh'] ?? ''));
    $auth = trim((string) ($keys['auth'] ?? ''));
    if ($p256dh === '' || $auth === '') {
        throw new RuntimeException($field . '.keys must include p256dh and auth.');
    }

    $contentEncoding = trim((string) ($value['contentEncoding'] ?? 'aes128gcm'));
    if ($contentEncoding === '') {
        $contentEncoding = 'aes128gcm';
    }

    $expirationTime = $value['expirationTime'] ?? null;
    if ($expirationTime !== null && $expirationTime !== '' && !is_numeric($expirationTime)) {
        throw new RuntimeException($field . '.expirationTime must be numeric or null.');
    }

    return [
        'endpoint' => $endpoint,
        'keys' => [
            'p256dh' => $p256dh,
            'auth' => $auth
        ],
        'contentEncoding' => $contentEncoding,
        'expirationTime' => $expirationTime === null || $expirationTime === '' ? null : (int) round((float) $expirationTime)
    ];
}

function build_push_registration_key(string $deviceId, string $endpoint): string
{
    return md5($deviceId . '||' . trim($endpoint));
}

function normalize_push_subscription_record(array $record): array
{
    return [
        'identifier' => trim((string) ($record['identifier'] ?? '')),
        'device_id' => normalize_device_id_value($record['device_id'] ?? ''),
        'endpoint' => trim((string) ($record['endpoint'] ?? '')),
        'keys' => [
            'p256dh' => trim((string) ($record['keys']['p256dh'] ?? '')),
            'auth' => trim((string) ($record['keys']['auth'] ?? ''))
        ],
        'content_encoding' => trim((string) ($record['content_encoding'] ?? 'aes128gcm')) ?: 'aes128gcm',
        'expiration_time' => isset($record['expiration_time']) && is_numeric($record['expiration_time']) ? (int) round((float) $record['expiration_time']) : null,
        'created_ms' => isset($record['created_ms']) && is_numeric($record['created_ms']) ? (int) $record['created_ms'] : 0,
        'updated_ms' => isset($record['updated_ms']) && is_numeric($record['updated_ms']) ? (int) $record['updated_ms'] : 0,
        'active' => !empty($record['active']),
        'app_version' => trim((string) ($record['app_version'] ?? '')),
        'is_installed_app' => !empty($record['is_installed_app']),
        'user_agent' => trim((string) ($record['user_agent'] ?? ''))
    ];
}

function build_partner_message_thread_key(string $leftIdentifier, string $rightIdentifier): string
{
    $participants = [
        trim((string) $leftIdentifier),
        trim((string) $rightIdentifier)
    ];

    usort($participants, static function (string $left, string $right): int {
        return strcmp(normalize_identifier_for_lookup($left), normalize_identifier_for_lookup($right));
    });

    return md5(implode('|||', $participants));
}

function default_partner_message_thread(string $leftIdentifier, string $rightIdentifier): array
{
    return [
        'participants' => [
            trim((string) $leftIdentifier),
            trim((string) $rightIdentifier)
        ],
        'updated_ms' => 0,
        'messages' => []
    ];
}

function normalize_partner_message_thread(array $thread): array
{
    $participants = is_array($thread['participants'] ?? null) ? $thread['participants'] : [];
    $left = trim((string) ($participants[0] ?? ''));
    $right = trim((string) ($participants[1] ?? ''));
    $messages = [];

    foreach ((array) ($thread['messages'] ?? []) as $message) {
        if (!is_array($message)) {
            continue;
        }
        $messages[] = [
            'id' => trim((string) ($message['id'] ?? '')),
            'sender_identifier' => trim((string) ($message['sender_identifier'] ?? '')),
            'recipient_identifier' => trim((string) ($message['recipient_identifier'] ?? '')),
            'sender_role' => trim((string) ($message['sender_role'] ?? '')),
            'recipient_role' => trim((string) ($message['recipient_role'] ?? '')),
            'text' => trim((string) ($message['text'] ?? '')),
            'created_ms' => isset($message['created_ms']) && is_numeric($message['created_ms']) ? (int) $message['created_ms'] : 0,
            'recipient_seen' => !empty($message['recipient_seen'])
        ];
    }

    usort($messages, static function (array $leftMessage, array $rightMessage): int {
        return ($leftMessage['created_ms'] ?? 0) <=> ($rightMessage['created_ms'] ?? 0);
    });

    return [
        'participants' => [$left, $right],
        'updated_ms' => isset($thread['updated_ms']) && is_numeric($thread['updated_ms']) ? (int) $thread['updated_ms'] : 0,
        'messages' => array_slice($messages, -100)
    ];
}

function build_partner_message_read_key(string $ownerIdentifier, string $partnerIdentifier): string
{
    return md5(
        normalize_identifier_for_lookup(trim((string) $ownerIdentifier))
        . '|||'
        . normalize_identifier_for_lookup(trim((string) $partnerIdentifier))
    );
}

function normalize_partner_message_read_entry(array $entry): array
{
    $readMessageIds = [];
    foreach ((array) ($entry['read_message_ids'] ?? []) as $messageId) {
        $normalizedId = trim((string) $messageId);
        if ($normalizedId === '') {
            continue;
        }
        $readMessageIds[$normalizedId] = $normalizedId;
    }
    $hiddenMessageIds = [];
    foreach ((array) ($entry['hidden_message_ids'] ?? []) as $messageId) {
        $normalizedId = trim((string) $messageId);
        if ($normalizedId === '') {
            continue;
        }
        $hiddenMessageIds[$normalizedId] = $normalizedId;
    }
    return [
        'owner_identifier' => trim((string) ($entry['owner_identifier'] ?? '')),
        'partner_identifier' => trim((string) ($entry['partner_identifier'] ?? '')),
        'last_read_ms' => isset($entry['last_read_ms']) && is_numeric($entry['last_read_ms']) ? (int) $entry['last_read_ms'] : 0,
        'updated_ms' => isset($entry['updated_ms']) && is_numeric($entry['updated_ms']) ? (int) $entry['updated_ms'] : 0,
        'read_message_ids' => array_values($readMessageIds),
        'hidden_message_ids' => array_values($hiddenMessageIds)
    ];
}

function get_partner_message_last_read_ms(array $state, string $ownerIdentifier, string $partnerIdentifier): int
{
    if (!is_array($state['partner_message_reads'] ?? null)) {
        return 0;
    }

    $entry = $state['partner_message_reads'][build_partner_message_read_key($ownerIdentifier, $partnerIdentifier)] ?? null;
    if (!is_array($entry)) {
        return 0;
    }

    $normalizedEntry = normalize_partner_message_read_entry($entry);
    return (int) $normalizedEntry['last_read_ms'];
}

function get_partner_message_read_ids(array $state, string $ownerIdentifier, string $partnerIdentifier): array
{
    if (!is_array($state['partner_message_reads'] ?? null)) {
        return [];
    }

    $entry = $state['partner_message_reads'][build_partner_message_read_key($ownerIdentifier, $partnerIdentifier)] ?? null;
    if (!is_array($entry)) {
        return [];
    }

    $normalizedEntry = normalize_partner_message_read_entry($entry);
    return array_values(array_filter((array) ($normalizedEntry['read_message_ids'] ?? []), static function ($messageId): bool {
        return trim((string) $messageId) !== '';
    }));
}

function get_partner_message_hidden_ids(array $state, string $ownerIdentifier, string $partnerIdentifier): array
{
    if (!is_array($state['partner_message_reads'] ?? null)) {
        return [];
    }

    $entry = $state['partner_message_reads'][build_partner_message_read_key($ownerIdentifier, $partnerIdentifier)] ?? null;
    if (!is_array($entry)) {
        return [];
    }

    $normalizedEntry = normalize_partner_message_read_entry($entry);
    return array_values(array_filter((array) ($normalizedEntry['hidden_message_ids'] ?? []), static function ($messageId): bool {
        return trim((string) $messageId) !== '';
    }));
}

function is_partner_message_read_for_owner(array $message, string $ownerIdentifier, array $readMessageIds = [], int $lastReadMs = 0): bool
{
    $ownerLookup = normalize_identifier_for_lookup($ownerIdentifier);
    if ($ownerLookup === '') {
        return false;
    }
    if (normalize_identifier_for_lookup((string) ($message['recipient_identifier'] ?? '')) !== $ownerLookup) {
        return true;
    }
    $messageId = trim((string) ($message['id'] ?? ''));
    if ($messageId !== '' && in_array($messageId, $readMessageIds, true)) {
        return true;
    }
    $createdMs = isset($message['created_ms']) && is_numeric($message['created_ms']) ? (int) $message['created_ms'] : 0;
    return $createdMs > 0 && $createdMs <= $lastReadMs;
}

function mark_partner_messages_read(array &$state, string $ownerIdentifier, string $partnerIdentifier, int $nowMs, ?string $messageId = null): array
{
    if (!is_array($state['partner_message_reads'] ?? null)) {
        $state['partner_message_reads'] = [];
    }

    $entryKey = build_partner_message_read_key($ownerIdentifier, $partnerIdentifier);
    $existingEntry = is_array($state['partner_message_reads'][$entryKey] ?? null)
        ? normalize_partner_message_read_entry($state['partner_message_reads'][$entryKey])
        : [
            'owner_identifier' => trim((string) $ownerIdentifier),
            'partner_identifier' => trim((string) $partnerIdentifier),
            'last_read_ms' => 0,
            'updated_ms' => 0,
            'read_message_ids' => [],
            'hidden_message_ids' => []
        ];

    $normalizedMessageId = trim((string) $messageId);
    if ($normalizedMessageId !== '') {
        $readIds = [];
        foreach ((array) ($existingEntry['read_message_ids'] ?? []) as $existingMessageId) {
            $candidate = trim((string) $existingMessageId);
            if ($candidate === '') {
                continue;
            }
            $readIds[$candidate] = $candidate;
        }
        $readIds[$normalizedMessageId] = $normalizedMessageId;
        $existingEntry['read_message_ids'] = array_values($readIds);
        $existingEntry['updated_ms'] = $nowMs;
        $state['partner_message_reads'][$entryKey] = normalize_partner_message_read_entry($existingEntry);
        return $existingEntry;
    }

    $existingEntry['last_read_ms'] = $nowMs;
    $existingEntry['updated_ms'] = $nowMs;
    $existingEntry['read_message_ids'] = [];
    $state['partner_message_reads'][$entryKey] = normalize_partner_message_read_entry($existingEntry);
    return $existingEntry;
}

function hide_partner_message_for_owner(array &$state, string $ownerIdentifier, string $partnerIdentifier, string $messageId, int $nowMs): array
{
    if (!is_array($state['partner_message_reads'] ?? null)) {
        $state['partner_message_reads'] = [];
    }

    $entryKey = build_partner_message_read_key($ownerIdentifier, $partnerIdentifier);
    $existingEntry = is_array($state['partner_message_reads'][$entryKey] ?? null)
        ? normalize_partner_message_read_entry($state['partner_message_reads'][$entryKey])
        : [
            'owner_identifier' => trim((string) $ownerIdentifier),
            'partner_identifier' => trim((string) $partnerIdentifier),
            'last_read_ms' => 0,
            'updated_ms' => 0,
            'read_message_ids' => [],
            'hidden_message_ids' => []
        ];

    $normalizedMessageId = trim((string) $messageId);
    if ($normalizedMessageId === '') {
        return $existingEntry;
    }

    $hiddenIds = [];
    foreach ((array) ($existingEntry['hidden_message_ids'] ?? []) as $existingMessageId) {
        $candidate = trim((string) $existingMessageId);
        if ($candidate === '') {
            continue;
        }
        $hiddenIds[$candidate] = $candidate;
    }
    $hiddenIds[$normalizedMessageId] = $normalizedMessageId;
    $existingEntry['hidden_message_ids'] = array_values($hiddenIds);
    $existingEntry['updated_ms'] = $nowMs;
    $state['partner_message_reads'][$entryKey] = normalize_partner_message_read_entry($existingEntry);
    return $existingEntry;
}

function get_partner_thread_unread_count_for_owner(array $thread, string $ownerIdentifier, int $lastReadMs = 0, array $readMessageIds = []): int
{
    $ownerLookup = normalize_identifier_for_lookup($ownerIdentifier);
    if ($ownerLookup === '') {
        return 0;
    }

    $unreadCount = 0;
    foreach ((array) ($thread['messages'] ?? []) as $message) {
        if (!is_array($message)) {
            continue;
        }
        if (normalize_identifier_for_lookup((string) ($message['recipient_identifier'] ?? '')) !== $ownerLookup) {
            continue;
        }
        if (!is_partner_message_read_for_owner($message, $ownerIdentifier, $readMessageIds, $lastReadMs)) {
            $unreadCount += 1;
        }
    }

    return $unreadCount;
}

function is_partner_message_seen_by_recipient(array $state, array $message): bool
{
    $senderIdentifier = trim((string) ($message['sender_identifier'] ?? ''));
    $recipientIdentifier = trim((string) ($message['recipient_identifier'] ?? ''));
    if ($senderIdentifier === '' || $recipientIdentifier === '') {
        return false;
    }

    $messageId = trim((string) ($message['id'] ?? ''));
    $recipientReadIds = get_partner_message_read_ids($state, $recipientIdentifier, $senderIdentifier);
    $recipientHiddenIds = get_partner_message_hidden_ids($state, $recipientIdentifier, $senderIdentifier);
    if ($messageId !== '' && (in_array($messageId, $recipientReadIds, true) || in_array($messageId, $recipientHiddenIds, true))) {
        return true;
    }

    $recipientLastReadMs = get_partner_message_last_read_ms($state, $recipientIdentifier, $senderIdentifier);
    $createdMs = isset($message['created_ms']) && is_numeric($message['created_ms']) ? (int) $message['created_ms'] : 0;
    return $createdMs > 0 && $createdMs <= $recipientLastReadMs;
}

function build_partner_message_thread_for_owner(array $state, string $ownIdentifier, string $partnerIdentifier): array
{
    $thread = get_partner_message_thread($state, $ownIdentifier, $partnerIdentifier);
    $hiddenMessageIds = get_partner_message_hidden_ids($state, $ownIdentifier, $partnerIdentifier);
    $hiddenMap = [];
    foreach ($hiddenMessageIds as $messageId) {
        $hiddenMap[trim((string) $messageId)] = true;
    }

    $messages = [];
    foreach ((array) ($thread['messages'] ?? []) as $message) {
        if (!is_array($message)) {
            continue;
        }
        $messageId = trim((string) ($message['id'] ?? ''));
        if ($messageId !== '' && isset($hiddenMap[$messageId])) {
            continue;
        }
        $message['recipient_seen'] = is_partner_message_seen_by_recipient($state, $message);
        $messages[] = $message;
    }

    $thread['messages'] = $messages;
    return normalize_partner_message_thread($thread);
}

function build_partner_message_inbox_summary(array $state, string $ownerIdentifier): array
{
    $ownerLookup = normalize_identifier_for_lookup($ownerIdentifier);
    if ($ownerLookup === '') {
        return [
            'owner_identifier' => trim((string) $ownerIdentifier),
            'total_unread' => 0,
            'conversations' => []
        ];
    }

    $conversations = [];
    foreach ((array) ($state['partner_message_threads'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $thread = normalize_partner_message_thread($entry);
        $participants = is_array($thread['participants'] ?? null) ? $thread['participants'] : [];
        $left = trim((string) ($participants[0] ?? ''));
        $right = trim((string) ($participants[1] ?? ''));
        if ($left === '' || $right === '') {
            continue;
        }

        $partnerIdentifier = '';
        if (normalize_identifier_for_lookup($left) === $ownerLookup) {
            $partnerIdentifier = $right;
        } elseif (normalize_identifier_for_lookup($right) === $ownerLookup) {
            $partnerIdentifier = $left;
        }
        if ($partnerIdentifier === '') {
            continue;
        }

        $hiddenMessageIds = get_partner_message_hidden_ids($state, $ownerIdentifier, $partnerIdentifier);
        $hiddenMap = [];
        foreach ($hiddenMessageIds as $messageId) {
            $hiddenMap[trim((string) $messageId)] = true;
        }
        $messages = array_values(array_filter((array) ($thread['messages'] ?? null), static function ($message) use ($hiddenMap): bool {
            if (!is_array($message)) {
                return false;
            }
            $messageId = trim((string) ($message['id'] ?? ''));
            return $messageId === '' || !isset($hiddenMap[$messageId]);
        }));
        $lastMessage = $messages ? $messages[count($messages) - 1] : null;
        $lastReadMs = get_partner_message_last_read_ms($state, $ownerIdentifier, $partnerIdentifier);
        $readMessageIds = get_partner_message_read_ids($state, $ownerIdentifier, $partnerIdentifier);
        $visibleThread = $thread;
        $visibleThread['messages'] = $messages;
        $unreadCount = get_partner_thread_unread_count_for_owner($visibleThread, $ownerIdentifier, $lastReadMs, $readMessageIds);

        $conversations[] = [
            'partner_identifier' => $partnerIdentifier,
            'updated_ms' => isset($thread['updated_ms']) && is_numeric($thread['updated_ms']) ? (int) $thread['updated_ms'] : 0,
            'last_read_ms' => $lastReadMs,
            'read_message_ids' => $readMessageIds,
            'unread_count' => $unreadCount,
            'last_message' => is_array($lastMessage) ? [
                'id' => trim((string) ($lastMessage['id'] ?? '')),
                'sender_identifier' => trim((string) ($lastMessage['sender_identifier'] ?? '')),
                'recipient_identifier' => trim((string) ($lastMessage['recipient_identifier'] ?? '')),
                'text' => trim((string) ($lastMessage['text'] ?? '')),
                'created_ms' => isset($lastMessage['created_ms']) && is_numeric($lastMessage['created_ms']) ? (int) $lastMessage['created_ms'] : 0
            ] : null
        ];
    }

    usort($conversations, static function (array $left, array $right): int {
        $leftSort = max((int) ($left['updated_ms'] ?? 0), (int) ($left['last_message']['created_ms'] ?? 0));
        $rightSort = max((int) ($right['updated_ms'] ?? 0), (int) ($right['last_message']['created_ms'] ?? 0));
        return $rightSort <=> $leftSort;
    });

    return [
        'owner_identifier' => trim((string) $ownerIdentifier),
        'total_unread' => array_sum(array_map(static function (array $conversation): int {
            return (int) ($conversation['unread_count'] ?? 0);
        }, $conversations)),
        'conversations' => $conversations
    ];
}

function build_absolute_launcher_url(array $params = []): string
{
    global $isWindows;

    $scheme = 'http';
    if (
        (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443'
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https'
    ) {
        $scheme = 'https';
    }

    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') {
        $host = $isWindows ? 'localhost' : 'espgym.com';
    }

    $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? '/cones/api.php'));
    $baseDir = rtrim(dirname($scriptName), '/');
    if (!array_key_exists('open', $params) || trim((string) $params['open']) === '') {
        $params['open'] = 'launcher';
    }

    $baseUrl = $scheme . '://' . $host . ($baseDir !== '' ? $baseDir : '') . '/telepathybeginner.html';

    if (!$params) {
        return $baseUrl;
    }

    return $baseUrl . '?' . http_build_query($params);
}

function get_active_push_subscriptions_for_identifier(array $state, string $identifier): array
{
    $lookup = normalize_identifier_for_lookup($identifier);
    if ($lookup === '') {
        return [];
    }

    $registrations = [];
    foreach ((array) ($state['push_subscriptions'] ?? []) as $record) {
        if (!is_array($record)) {
            continue;
        }
        $normalized = normalize_push_subscription_record($record);
        if (!$normalized['active']) {
            continue;
        }
        if (normalize_identifier_for_lookup((string) $normalized['identifier']) !== $lookup) {
            continue;
        }
        if ($normalized['endpoint'] === '' || $normalized['keys']['p256dh'] === '' || $normalized['keys']['auth'] === '') {
            continue;
        }
        $registrations[] = $normalized;
    }

    return $registrations;
}

function get_push_registration_status(array $state, string $identifier, string $deviceId = ''): array
{
    $subscriptions = get_active_push_subscriptions_for_identifier($state, $identifier);
    $normalizedDeviceId = normalize_device_id_value($deviceId);
    $deviceRegistration = null;

    foreach ($subscriptions as $record) {
        if ($normalizedDeviceId !== '' && $record['device_id'] === $normalizedDeviceId) {
            $deviceRegistration = $record;
            break;
        }
    }

    return [
        'identifier' => trim((string) $identifier),
        'subscription_count' => count($subscriptions),
        'device_subscription_active' => $deviceRegistration !== null,
        'device_registration' => $deviceRegistration,
        'notification_ready' => $deviceRegistration !== null && !empty($deviceRegistration['is_installed_app'])
    ];
}

function upsert_push_subscription_record(array &$state, string $identifier, string $deviceId, array $subscription, int $nowMs, array $options = []): array
{
    if (!is_array($state['push_subscriptions'] ?? null)) {
        $state['push_subscriptions'] = [];
    }

    $normalizedIdentifier = trim((string) $identifier);
    $normalizedDeviceId = normalize_device_id_value($deviceId);
    $registrationKey = build_push_registration_key($normalizedDeviceId, (string) $subscription['endpoint']);
    $createdMs = $nowMs;

    foreach ($state['push_subscriptions'] as $existingKey => $existingRecord) {
        if (!is_array($existingRecord)) {
            unset($state['push_subscriptions'][$existingKey]);
            continue;
        }

        $normalizedRecord = normalize_push_subscription_record($existingRecord);
        if ($normalizedRecord['device_id'] === $normalizedDeviceId && $existingKey !== $registrationKey) {
            $normalizedRecord['active'] = false;
            $normalizedRecord['updated_ms'] = $nowMs;
            $state['push_subscriptions'][$existingKey] = $normalizedRecord;
        }

        if ($existingKey === $registrationKey) {
            $createdMs = $normalizedRecord['created_ms'] > 0 ? $normalizedRecord['created_ms'] : $nowMs;
        }
    }

    $record = [
        'identifier' => $normalizedIdentifier,
        'device_id' => $normalizedDeviceId,
        'endpoint' => trim((string) $subscription['endpoint']),
        'keys' => [
            'p256dh' => trim((string) ($subscription['keys']['p256dh'] ?? '')),
            'auth' => trim((string) ($subscription['keys']['auth'] ?? ''))
        ],
        'content_encoding' => trim((string) ($subscription['contentEncoding'] ?? 'aes128gcm')) ?: 'aes128gcm',
        'expiration_time' => $subscription['expirationTime'] ?? null,
        'created_ms' => $createdMs,
        'updated_ms' => $nowMs,
        'active' => true,
        'app_version' => trim((string) ($options['app_version'] ?? '')),
        'is_installed_app' => !empty($options['is_installed_app']),
        'user_agent' => trim((string) ($options['user_agent'] ?? ''))
    ];

    $state['push_subscriptions'][$registrationKey] = $record;
    return $record;
}

function deactivate_push_subscription_record(array &$state, string $identifier, string $deviceId, int $nowMs): bool
{
    if (!is_array($state['push_subscriptions'] ?? null)) {
        $state['push_subscriptions'] = [];
        return false;
    }

    $normalizedIdentifier = normalize_identifier_for_lookup($identifier);
    $normalizedDeviceId = normalize_device_id_value($deviceId);
    $changed = false;

    foreach ($state['push_subscriptions'] as $key => $record) {
        if (!is_array($record)) {
            continue;
        }
        $normalizedRecord = normalize_push_subscription_record($record);
        if ($normalizedDeviceId !== '' && $normalizedRecord['device_id'] !== $normalizedDeviceId) {
            continue;
        }
        if ($normalizedIdentifier !== '' && normalize_identifier_for_lookup((string) $normalizedRecord['identifier']) !== $normalizedIdentifier) {
            continue;
        }
        if ($normalizedRecord['active']) {
            $normalizedRecord['active'] = false;
            $normalizedRecord['updated_ms'] = $nowMs;
            $state['push_subscriptions'][$key] = $normalizedRecord;
            $changed = true;
        }
    }

    return $changed;
}

function get_partner_message_thread(array $state, string $ownIdentifier, string $partnerIdentifier): array
{
    $threadKey = build_partner_message_thread_key($ownIdentifier, $partnerIdentifier);
    if (!is_array($state['partner_message_threads'] ?? null)) {
        return default_partner_message_thread($ownIdentifier, $partnerIdentifier);
    }

    $thread = $state['partner_message_threads'][$threadKey] ?? null;
    if (!is_array($thread)) {
        return default_partner_message_thread($ownIdentifier, $partnerIdentifier);
    }

    return normalize_partner_message_thread($thread);
}

function append_partner_message(array &$state, string $senderIdentifier, string $recipientIdentifier, string $senderRole, string $recipientRole, string $text, int $nowMs): array
{
    if (!is_array($state['partner_message_threads'] ?? null)) {
        $state['partner_message_threads'] = [];
    }

    $threadKey = build_partner_message_thread_key($senderIdentifier, $recipientIdentifier);
    $thread = get_partner_message_thread($state, $senderIdentifier, $recipientIdentifier);
    $messageRecord = [
        'id' => bin2hex(random_bytes(8)),
        'sender_identifier' => trim((string) $senderIdentifier),
        'recipient_identifier' => trim((string) $recipientIdentifier),
        'sender_role' => trim((string) $senderRole),
        'recipient_role' => trim((string) $recipientRole),
        'text' => trim((string) $text),
        'created_ms' => $nowMs
    ];

    $thread['messages'][] = $messageRecord;
    $thread['updated_ms'] = $nowMs;
    $state['partner_message_threads'][$threadKey] = normalize_partner_message_thread($thread);

    return $messageRecord;
}

function delete_partner_message(array &$state, string $ownIdentifier, string $partnerIdentifier, string $messageId, int $nowMs): array
{
    $thread = get_partner_message_thread($state, $ownIdentifier, $partnerIdentifier);
    $messages = is_array($thread['messages'] ?? null) ? $thread['messages'] : [];
    $normalizedMessageId = trim((string) $messageId);
    $deleted = false;

    foreach ($messages as $message) {
        if (!is_array($message)) {
            continue;
        }
        $currentId = trim((string) ($message['id'] ?? ''));
        if ($normalizedMessageId !== '' && $currentId === $normalizedMessageId) {
            $deleted = true;
            break;
        }
    }

    if ($deleted) {
        hide_partner_message_for_owner($state, $ownIdentifier, $partnerIdentifier, $normalizedMessageId, $nowMs);
    }

    return [
        'deleted' => $deleted,
        'thread' => build_partner_message_thread_for_owner($state, $ownIdentifier, $partnerIdentifier)
    ];
}

function send_push_notification_to_identifier(array &$state, array $webPushConfig, string $recipientIdentifier, array $payload, int $nowMs): array
{
    if (empty($webPushConfig['available'])) {
        return [
            'sent_count' => 0,
            'expired_count' => 0,
            'message' => trim((string) ($webPushConfig['message'] ?? 'Web Push is unavailable.'))
        ];
    }

    $subscriptions = get_active_push_subscriptions_for_identifier($state, $recipientIdentifier);
    if (!$subscriptions) {
        return [
            'sent_count' => 0,
            'expired_count' => 0,
            'message' => 'No active notification subscriptions were found for this recipient.'
        ];
    }

    $webPush = new WebPush([
        'VAPID' => [
            'subject' => (string) $webPushConfig['subject'],
            'publicKey' => (string) $webPushConfig['publicKey'],
            'privateKey' => (string) $webPushConfig['privateKey']
        ]
    ]);

    $encodedPayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($encodedPayload === false) {
        return [
            'sent_count' => 0,
            'expired_count' => 0,
            'message' => 'Notification payload could not be encoded.'
        ];
    }

    $sentCount = 0;
    $expiredCount = 0;
    $errors = [];

    foreach ($subscriptions as $subscriptionRecord) {
        try {
            $subscription = Subscription::create([
                'endpoint' => (string) $subscriptionRecord['endpoint'],
                'keys' => [
                    'p256dh' => (string) ($subscriptionRecord['keys']['p256dh'] ?? ''),
                    'auth' => (string) ($subscriptionRecord['keys']['auth'] ?? '')
                ],
                'contentEncoding' => (string) ($subscriptionRecord['content_encoding'] ?? 'aes128gcm')
            ]);

            $report = $webPush->sendOneNotification($subscription, $encodedPayload, ['TTL' => 300]);
            if ($report->isSuccess()) {
                $sentCount++;
                continue;
            }

            if ($report->isSubscriptionExpired()) {
                $expiredCount++;
                deactivate_push_subscription_record($state, (string) $subscriptionRecord['identifier'], (string) $subscriptionRecord['device_id'], $nowMs);
            }

            $errors[] = $report->getReason();
        } catch (Throwable $exception) {
            $errors[] = $exception->getMessage();
        }
    }

    return [
        'sent_count' => $sentCount,
        'expired_count' => $expiredCount,
        'message' => $sentCount > 0
            ? 'Notification sent.'
            : ($errors ? implode(' ', array_unique($errors)) : 'Notification could not be delivered.')
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

function replace_identifier_if_match(string $value, string $previousIdentifier, string $nextIdentifier): string
{
    return normalize_identifier_for_lookup($value) === normalize_identifier_for_lookup($previousIdentifier)
        ? $nextIdentifier
        : $value;
}

function replace_identifier_in_list(array $values, string $previousIdentifier, string $nextIdentifier): array
{
    $updated = [];
    foreach ($values as $value) {
        $text = trim((string) $value);
        if ($text === '') {
            continue;
        }
        $updated[] = replace_identifier_if_match($text, $previousIdentifier, $nextIdentifier);
    }

    return sanitize_string_list($updated);
}

function validate_partner_message_text($value, string $field = 'message_text'): string
{
    $text = trim((string) $value);
    if ($text === '') {
        throw new RuntimeException($field . ' is required.');
    }
    if (mb_strlen($text) > 300) {
        throw new RuntimeException($field . ' must not exceed 300 characters.');
    }
    return $text;
}

function fail_request($handle, int $nowMs, string $message, int $statusCode = 400, array $extra = []): void
{
    http_response_code($statusCode);
    $response = array_merge([
        'ok' => false,
        'error' => $message,
        'server_now_ms' => $nowMs
    ], $extra);

    if (is_resource($handle)) {
        @flock($handle, LOCK_UN);
        @fclose($handle);
    }

    echo json_encode($response);
    exit;
}

function require_allowed_keys(array $value, array $allowedKeys, string $path): void
{
    $unexpected = array_diff(array_keys($value), $allowedKeys);
    if ($unexpected !== []) {
        throw new RuntimeException($path . ' contains unexpected field(s): ' . implode(', ', $unexpected));
    }
}

function validate_email_identifier_string($value, string $field, bool $required = true): string
{
    $text = trim((string) $value);
    if ($text === '') {
        if ($required) {
            throw new RuntimeException($field . ' is required.');
        }
        return '';
    }

    if (strlen($text) > 254) {
        throw new RuntimeException($field . ' is too long.');
    }

    if (!filter_var($text, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException($field . ' must be a valid email address.');
    }

    return $text;
}

function normalize_handle_lookup(string $value): string
{
    return strtolower(trim(preg_replace('/\s+/', ' ', (string) $value) ?? ''));
}

function canonicalize_handle(string $value): string
{
    return normalize_handle_lookup($value);
}

function get_handle_owner_key(string $ownerIdentifier): string
{
    return normalize_identifier_for_lookup(trim(preg_replace('/\s+/', ' ', $ownerIdentifier) ?? ''));
}

function default_handle_owner_record(string $ownerIdentifier = ''): array
{
    return [
        'owner_identifier' => trim(preg_replace('/\s+/', ' ', $ownerIdentifier) ?? ''),
        'current_handle' => '',
        'current_canonical_handle' => '',
        'first_claimed_ms' => 0,
        'last_substantive_change_ms' => 0,
        'substantive_change_count' => 0,
        'lifetime_claim_count' => 0,
        'retired_handles' => [],
        'updated_ms' => 0
    ];
}

function get_or_create_handle_owner_record(array &$state, string $ownerIdentifier, int $nowMs): array
{
    if (!is_array($state['handle_owners'] ?? null)) {
        $state['handle_owners'] = [];
    }

    $ownerKey = get_handle_owner_key($ownerIdentifier);
    if ($ownerKey === '') {
        return default_handle_owner_record($ownerIdentifier);
    }

    $record = is_array($state['handle_owners'][$ownerKey] ?? null)
        ? $state['handle_owners'][$ownerKey]
        : default_handle_owner_record($ownerIdentifier);

    $record['owner_identifier'] = trim((string) ($record['owner_identifier'] ?? '')) !== ''
        ? trim((string) $record['owner_identifier'])
        : trim(preg_replace('/\s+/', ' ', $ownerIdentifier) ?? '');
    $record['current_handle'] = trim((string) ($record['current_handle'] ?? ''));
    $record['current_canonical_handle'] = canonicalize_handle((string) ($record['current_canonical_handle'] ?? $record['current_handle'] ?? ''));
    $record['first_claimed_ms'] = isset($record['first_claimed_ms']) && is_numeric($record['first_claimed_ms']) ? (int) $record['first_claimed_ms'] : 0;
    $record['last_substantive_change_ms'] = isset($record['last_substantive_change_ms']) && is_numeric($record['last_substantive_change_ms']) ? (int) $record['last_substantive_change_ms'] : 0;
    $record['substantive_change_count'] = isset($record['substantive_change_count']) && is_numeric($record['substantive_change_count']) ? max(0, (int) $record['substantive_change_count']) : 0;
    $record['lifetime_claim_count'] = isset($record['lifetime_claim_count']) && is_numeric($record['lifetime_claim_count']) ? max(0, (int) $record['lifetime_claim_count']) : 0;
    $record['retired_handles'] = is_array($record['retired_handles'] ?? null)
        ? array_values(array_unique(array_filter(array_map(
            static fn($value): string => canonicalize_handle((string) $value),
            $record['retired_handles']
        ), static fn(string $value): bool => $value !== '')))
        : [];
    $record['updated_ms'] = isset($record['updated_ms']) && is_numeric($record['updated_ms']) ? (int) $record['updated_ms'] : $nowMs;

    $state['handle_owners'][$ownerKey] = $record;
    return $record;
}

function is_retired_handle(array $state, string $canonicalHandle): bool
{
    $handleKey = canonicalize_handle($canonicalHandle);
    if ($handleKey === '') {
        return false;
    }

    return isset($state['retired_handles'][$handleKey]) && is_array($state['retired_handles'][$handleKey]);
}

function is_cosmetic_handle_edit(string $oldCanonical, string $newCanonical): bool
{
    return $oldCanonical !== '' && $oldCanonical === $newCanonical;
}

function retire_active_handle(array &$state, string $canonicalHandle, string $ownerIdentifier, int $nowMs): void
{
    $handleKey = canonicalize_handle($canonicalHandle);
    if ($handleKey === '') {
        return;
    }

    if (!is_array($state['retired_handles'] ?? null)) {
        $state['retired_handles'] = [];
    }
    if (!is_array($state['handle_owners'] ?? null)) {
        $state['handle_owners'] = [];
    }

    $activeEntry = is_array($state['unique_handles'][$handleKey] ?? null) ? $state['unique_handles'][$handleKey] : [];
    $retiredHandle = trim((string) ($activeEntry['handle'] ?? $canonicalHandle));
    $owner = trim((string) ($activeEntry['owner_identifier'] ?? $ownerIdentifier));

    $state['retired_handles'][$handleKey] = [
        'handle' => $retiredHandle,
        'canonical_handle' => $handleKey,
        'owner_identifier' => $owner,
        'retired_ms' => $nowMs
    ];

    $ownerKey = get_handle_owner_key($owner);
    if ($ownerKey !== '') {
        $record = get_or_create_handle_owner_record($state, $owner, $nowMs);
        $retired = is_array($record['retired_handles'] ?? null) ? $record['retired_handles'] : [];
        if (!in_array($handleKey, $retired, true)) {
            $retired[] = $handleKey;
        }
        $record['retired_handles'] = array_values(array_unique(array_filter($retired, static fn($value): bool => trim((string) $value) !== '')));
        $record['updated_ms'] = $nowMs;
        $state['handle_owners'][$ownerKey] = $record;
    }
}

function validate_handle_change_allowed(array $ownerRecord, string $oldCanonical, string $newCanonical, int $nowMs): array
{
    global $handleChangeCooldownMs, $maxHandleSubstantiveChanges, $maxHandleLifetimeClaims;

    if ($oldCanonical === '') {
        $lifetimeClaims = isset($ownerRecord['lifetime_claim_count']) && is_numeric($ownerRecord['lifetime_claim_count'])
            ? (int) $ownerRecord['lifetime_claim_count']
            : 0;
        if ($lifetimeClaims >= $maxHandleLifetimeClaims) {
            return [
                'allowed' => false,
                'operation_type' => 'first_claim',
                'reason' => 'max_lifetime_claims_reached'
            ];
        }

        return [
            'allowed' => true,
            'operation_type' => 'first_claim',
            'reason' => ''
        ];
    }

    if (is_cosmetic_handle_edit($oldCanonical, $newCanonical)) {
        return [
            'allowed' => true,
            'operation_type' => 'cosmetic_edit',
            'reason' => ''
        ];
    }

    $substantiveChanges = isset($ownerRecord['substantive_change_count']) && is_numeric($ownerRecord['substantive_change_count'])
        ? (int) $ownerRecord['substantive_change_count']
        : 0;
    if ($substantiveChanges >= $maxHandleSubstantiveChanges) {
        return [
            'allowed' => false,
            'operation_type' => 'substantive_change',
            'reason' => 'max_changes_reached'
        ];
    }

    $lifetimeClaims = isset($ownerRecord['lifetime_claim_count']) && is_numeric($ownerRecord['lifetime_claim_count'])
        ? (int) $ownerRecord['lifetime_claim_count']
        : 0;
    if ($lifetimeClaims >= $maxHandleLifetimeClaims) {
        return [
            'allowed' => false,
            'operation_type' => 'substantive_change',
            'reason' => 'max_lifetime_claims_reached'
        ];
    }

    $lastChangeMs = isset($ownerRecord['last_substantive_change_ms']) && is_numeric($ownerRecord['last_substantive_change_ms'])
        ? (int) $ownerRecord['last_substantive_change_ms']
        : 0;
    if ($lastChangeMs > 0 && ($nowMs - $lastChangeMs) < $handleChangeCooldownMs) {
        return [
            'allowed' => false,
            'operation_type' => 'substantive_change',
            'reason' => 'cooldown_active',
            'retry_after_ms' => max(0, $handleChangeCooldownMs - ($nowMs - $lastChangeMs))
        ];
    }

    return [
        'allowed' => true,
        'operation_type' => 'substantive_change',
        'reason' => ''
    ];
}

function is_valid_handle_identifier(string $value): bool
{
    $text = trim(preg_replace('/\s+/', ' ', $value) ?? '');
    return (bool) preg_match('/^[A-Za-z0-9](?:[A-Za-z0-9._ -]{1,22}[A-Za-z0-9])?$/', $text);
}

function validate_participant_identifier_string($value, string $field, bool $required = true): string
{
    $text = trim((string) $value);
    if ($text === '') {
        if ($required) {
            throw new RuntimeException($field . ' is required.');
        }
        return '';
    }

    if (strlen($text) > 254) {
        throw new RuntimeException($field . ' is too long.');
    }

    if (filter_var($text, FILTER_VALIDATE_EMAIL)) {
        return $text;
    }

    if (is_valid_handle_identifier($text)) {
        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }

    throw new RuntimeException($field . ' must be a valid email address or unique handle.');
}

function get_canonical_identifier_key(array $state, string $identifier): string
{
    $lookup = normalize_identifier_for_lookup($identifier);
    if ($lookup === '') {
        return '';
    }

    $uniqueHandles = is_array($state['unique_handles'] ?? null) ? $state['unique_handles'] : [];
    $identifierAliases = is_array($state['identifier_aliases'] ?? null) ? $state['identifier_aliases'] : [];
    $current = $lookup;
    $visited = [];

    for ($step = 0; $step < 8; $step++) {
        if ($current === '' || isset($visited[$current])) {
            break;
        }
        $visited[$current] = true;

        if (isset($identifierAliases[$current]) && is_string($identifierAliases[$current]) && $identifierAliases[$current] !== '') {
            $aliased = normalize_handle_lookup($identifierAliases[$current]);
            if ($aliased !== '' && $aliased !== $current) {
                $current = $aliased;
                continue;
            }
        }

        if (isset($uniqueHandles[$current]) && is_array($uniqueHandles[$current])) {
            return $current;
        }

        break;
    }

    return $current;
}

function get_identifier_status(array $state, string $identifier): array
{
    $input = trim($identifier);
    $lookup = normalize_identifier_for_lookup($input);
    $canonicalKey = get_canonical_identifier_key($state, $input);
    $uniqueHandles = is_array($state['unique_handles'] ?? null) ? $state['unique_handles'] : [];
    $identifierAliases = is_array($state['identifier_aliases'] ?? null) ? $state['identifier_aliases'] : [];
    $retiredHandles = is_array($state['retired_handles'] ?? null) ? $state['retired_handles'] : [];
    $handleOwners = is_array($state['handle_owners'] ?? null) ? $state['handle_owners'] : [];

    $preferredHandle = '';
    $ownerIdentifier = $input;
    $usesHandle = false;
    if ($canonicalKey !== '' && isset($uniqueHandles[$canonicalKey]) && is_array($uniqueHandles[$canonicalKey])) {
        $entry = $uniqueHandles[$canonicalKey];
        $preferredHandle = trim((string) ($entry['handle'] ?? ''));
        $ownerIdentifier = trim((string) ($entry['owner_identifier'] ?? $preferredHandle));
        $usesHandle = $preferredHandle !== '';
    } elseif ($lookup !== '' && isset($identifierAliases[$lookup]) && is_string($identifierAliases[$lookup])) {
        $preferredHandle = trim((string) $identifierAliases[$lookup]);
        $usesHandle = $preferredHandle !== '';
        $ownerIdentifier = $input;
    } elseif ($canonicalKey !== '' && isset($retiredHandles[$canonicalKey]) && is_array($retiredHandles[$canonicalKey])) {
        $retiredEntry = $retiredHandles[$canonicalKey];
        $ownerIdentifier = trim((string) ($retiredEntry['owner_identifier'] ?? $input));
        $ownerKey = get_handle_owner_key($ownerIdentifier);
        $ownerRecord = $ownerKey !== '' && isset($handleOwners[$ownerKey]) && is_array($handleOwners[$ownerKey])
            ? $handleOwners[$ownerKey]
            : null;
        $currentHandle = trim((string) ($ownerRecord['current_handle'] ?? ''));
        if ($currentHandle !== '') {
            $preferredHandle = $currentHandle;
            $usesHandle = true;
        }
    }

    $preferredIdentifier = $preferredHandle !== '' ? $preferredHandle : $input;
    return [
        'input_identifier' => $input,
        'preferred_identifier' => $preferredIdentifier,
        'preferred_handle' => $preferredHandle,
        'owner_identifier' => $ownerIdentifier,
        'uses_handle' => $usesHandle,
        'is_handle' => $preferredHandle !== '' && normalize_handle_lookup($input) === normalize_handle_lookup($preferredHandle)
    ];
}

function normalize_user_type($value): string
{
    $type = strtolower(trim((string) $value));
    return $type === 'pro' ? 'pro' : 'standard';
}

function get_user_type_for_identifier(array &$state, string $identifier): string
{
    $trialStatus = get_explore_pro_trial_status_for_identifier($state, $identifier, (int) floor(microtime(true) * 1000));
    if (is_array($trialStatus) && ($trialStatus['phase'] ?? '') === 'active') {
        return 'pro';
    }

    $status = get_identifier_status($state, $identifier);
    $preferred = trim((string) ($status['preferred_identifier'] ?? $identifier));
    $lookupKey = get_canonical_identifier_key($state, $preferred);
    $fallbackKey = normalize_identifier_for_lookup($preferred);
    $userTypes = is_array($state['user_types'] ?? null) ? $state['user_types'] : [];

    if ($lookupKey !== '' && isset($userTypes[$lookupKey])) {
        return normalize_user_type($userTypes[$lookupKey]);
    }
    if ($fallbackKey !== '' && isset($userTypes[$fallbackKey])) {
        return normalize_user_type($userTypes[$fallbackKey]);
    }

    return 'standard';
}

function participant_identifier_exists(array $state, string $pairsDir, string $identifier): bool
{
    $cleanIdentifier = trim((string) $identifier);
    $lookup = normalize_identifier_for_lookup($cleanIdentifier);
    if ($lookup === 'robot') {
        return true;
    }
    if ($lookup === '') {
        return false;
    }

    $status = get_identifier_status($state, $cleanIdentifier);
    $preferredIdentifier = trim((string) ($status['preferred_identifier'] ?? $cleanIdentifier));
    $preferredLookup = normalize_identifier_for_lookup($preferredIdentifier);
    $checks = array_values(array_unique(array_filter([$lookup, $preferredLookup], static fn(string $value): bool => $value !== '')));

    foreach ($checks as $check) {
        if (isset($state['unique_handles'][$check]) && is_array($state['unique_handles'][$check])) {
            return true;
        }
        if (isset($state['retired_handles'][$check]) && is_array($state['retired_handles'][$check])) {
            return true;
        }
        if (isset($state['user_types'][$check])) {
            return true;
        }
        if (isset($state['launcher_profiles'][$check]) && is_array($state['launcher_profiles'][$check])) {
            return true;
        }
        if (isset($state['handle_owners'][$check]) && is_array($state['handle_owners'][$check])) {
            return true;
        }
    }

    foreach ((array) ($state['sessions'] ?? []) as $sessionEntry) {
        if (!is_array($sessionEntry)) {
            continue;
        }
        foreach (['sender', 'receiver'] as $roleKey) {
            $profile = is_array($sessionEntry[$roleKey]['profile'] ?? null) ? $sessionEntry[$roleKey]['profile'] : [];
            foreach (['own_email', 'partner_email', 'name'] as $fieldKey) {
                $valueLookup = normalize_identifier_for_lookup((string) ($profile[$fieldKey] ?? ''));
                if ($valueLookup !== '' && in_array($valueLookup, $checks, true)) {
                    return true;
                }
            }
        }
    }

    foreach ((array) ($state['session_registry'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        foreach (['sender_name', 'receiver_name'] as $fieldKey) {
            $valueLookup = normalize_identifier_for_lookup((string) ($entry[$fieldKey] ?? ''));
            if ($valueLookup !== '' && in_array($valueLookup, $checks, true)) {
                return true;
            }
        }
    }

    foreach ((array) ($state['pair_difficulties'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        foreach (['sender_name', 'receiver_name'] as $fieldKey) {
            $valueLookup = normalize_identifier_for_lookup((string) ($entry[$fieldKey] ?? ''));
            if ($valueLookup !== '' && in_array($valueLookup, $checks, true)) {
                return true;
            }
        }
    }

    foreach (read_all_pair_trial_records($pairsDir) as $record) {
        if (!is_array($record)) {
            continue;
        }
        foreach (['rx name', 'tx name'] as $fieldKey) {
            $valueLookup = normalize_identifier_for_lookup((string) ($record[$fieldKey] ?? ''));
            if ($valueLookup !== '' && in_array($valueLookup, $checks, true)) {
                return true;
            }
        }
    }

    return false;
}

function identifier_has_trial_history(string $identifier, string $pairsDir, string $simulationPairsDir): bool
{
    $cleanIdentifier = trim((string) $identifier);
    $lookup = normalize_identifier_for_lookup($cleanIdentifier);
    if ($lookup === '' || $lookup === 'robot') {
        return false;
    }

    foreach ([$pairsDir, $simulationPairsDir] as $dir) {
        foreach (read_all_pair_trial_records($dir, $dir === $simulationPairsDir) as $record) {
            if (!is_array($record)) {
                continue;
            }
            foreach (['rx name', 'tx name'] as $fieldKey) {
                $valueLookup = normalize_identifier_for_lookup((string) ($record[$fieldKey] ?? ''));
                if ($valueLookup !== '' && $valueLookup === $lookup) {
                    return true;
                }
            }
        }
    }

    return false;
}

function assign_user_type_for_identifier(array &$state, string $identifier, string $userType, int $nowMs): array
{
    $cleanIdentifier = validate_participant_identifier_string($identifier, 'user_identifier', true);

    if (!is_array($state['user_types'] ?? null)) {
        $state['user_types'] = [];
    }

    $status = get_identifier_status($state, $cleanIdentifier);
    $preferredIdentifier = trim((string) ($status['preferred_identifier'] ?? $cleanIdentifier));
    $canonicalKey = get_canonical_identifier_key($state, $preferredIdentifier);
    $storageKey = $canonicalKey !== '' ? $canonicalKey : normalize_identifier_for_lookup($preferredIdentifier);
    if ($storageKey === '') {
        throw new RuntimeException('User identifier is invalid.');
    }

    $normalizedType = normalize_user_type($userType);
    $state['user_types'][$storageKey] = $normalizedType;

    return [
        'identifier' => $preferredIdentifier,
        'user_type' => $normalizedType,
        'updated_ms' => $nowMs
    ];
}

function generate_temporary_handle_candidate(int $length = 5): string
{
    $alphabet = 'abcdefghijklmnopqrstuvwxyz';
    $targetLength = max(4, min(12, $length));
    $result = '';
    for ($index = 0; $index < $targetLength; $index += 1) {
        $result .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $result;
}

function create_temporary_identifier(array &$state, string $pairsDir, string $userType, int $nowMs): array
{
    $normalizedType = normalize_user_type($userType);
    $identifier = '';

    for ($attempt = 0; $attempt < 64; $attempt += 1) {
        $candidate = generate_temporary_handle_candidate(5);
        if (!participant_identifier_exists($state, $pairsDir, $candidate)) {
            $identifier = $candidate;
            break;
        }
    }

    if ($identifier === '') {
        throw new RuntimeException('Unable to create a temporary identity right now.');
    }

    claim_unique_handle($state, '', $identifier, $nowMs);
    assign_user_type_for_identifier($state, $identifier, $normalizedType, $nowMs);

    return [
        'identifier' => $identifier,
        'user_type' => $normalizedType,
        'created_ms' => $nowMs
    ];
}

function claim_unique_handle(array &$state, string $ownerIdentifier, string $proposedHandle, int $nowMs): array
{
    $handle = trim(preg_replace('/\s+/', ' ', $proposedHandle) ?? '');
    if (!is_valid_handle_identifier($handle)) {
        throw new RuntimeException('Unique handle must be 3 to 24 characters long and use only letters, numbers, spaces, period, underscore, or hyphen.');
    }

    if (!is_array($state['unique_handles'] ?? null)) {
        $state['unique_handles'] = [];
    }
    if (!is_array($state['identifier_aliases'] ?? null)) {
        $state['identifier_aliases'] = [];
    }
    if (!is_array($state['retired_handles'] ?? null)) {
        $state['retired_handles'] = [];
    }
    if (!is_array($state['handle_owners'] ?? null)) {
        $state['handle_owners'] = [];
    }

    $handleKey = canonicalize_handle($handle);
    $rawOwner = trim(preg_replace('/\s+/', ' ', $ownerIdentifier) ?? '');
    $resolvedStatus = $rawOwner !== '' ? get_identifier_status($state, $rawOwner) : [];
    $owner = trim((string) ($resolvedStatus['owner_identifier'] ?? $rawOwner));
    if ($owner === '') {
        $owner = $handle;
    }
    $ownerKey = get_handle_owner_key($owner);
    if ($ownerKey === '') {
        $ownerKey = $handleKey;
        $owner = $handle;
    }
    $ownerRecord = get_or_create_handle_owner_record($state, $owner, $nowMs);
    $oldHandleKey = canonicalize_handle((string) ($ownerRecord['current_canonical_handle'] ?? ''));
    $oldHandle = trim((string) ($ownerRecord['current_handle'] ?? ''));

    $existing = $state['unique_handles'][$handleKey] ?? null;
    if (is_array($existing)) {
        $existingOwner = get_handle_owner_key((string) ($existing['owner_identifier'] ?? ''));
        if ($existingOwner !== '' && $existingOwner !== $ownerKey) {
            throw new RuntimeException('That unique handle is already in use.');
        }
    }

    if (is_retired_handle($state, $handleKey) && $oldHandleKey !== $handleKey) {
        throw new RuntimeException('That unique handle was used previously and is no longer available.');
    }

    $realPairsDir = (string) ($GLOBALS['pairsDir'] ?? '');
    $simulationPairsDir = (string) ($GLOBALS['simulationPairsDir'] ?? '');
    $belongsToSameActiveOwner = is_array($existing)
        && get_handle_owner_key((string) ($existing['owner_identifier'] ?? '')) === $ownerKey;
    if (
        !$belongsToSameActiveOwner
        && $oldHandleKey !== $handleKey
        && $realPairsDir !== ''
        && $simulationPairsDir !== ''
        && identifier_has_trial_history($handle, $realPairsDir, $simulationPairsDir)
    ) {
        throw new RuntimeException('That unique handle has already been used previously and is no longer available.');
    }

    $changeValidation = validate_handle_change_allowed($ownerRecord, $oldHandleKey, $handleKey, $nowMs);
    if (!($changeValidation['allowed'] ?? false)) {
        $reason = (string) ($changeValidation['reason'] ?? 'invalid_handle_change');
        if ($reason === 'cooldown_active') {
            throw new RuntimeException('That handle cannot be changed yet. Please wait before changing it again.');
        }
        if ($reason === 'max_changes_reached') {
            throw new RuntimeException('That identifier has already used the maximum number of handle changes.');
        }
        if ($reason === 'max_lifetime_claims_reached') {
            throw new RuntimeException('That identifier has already used the maximum number of unique handles.');
        }
        throw new RuntimeException('That handle change is not allowed.');
    }

    $previousIdentifiers = [];
    $currentIdentifier = $rawOwner;
    if ($currentIdentifier !== '') {
        $previousIdentifiers[] = $currentIdentifier;
    }
    if ($owner !== '' && get_handle_owner_key($owner) !== get_handle_owner_key($currentIdentifier)) {
        $previousIdentifiers[] = $owner;
    }
    if ($oldHandle !== '') {
        $previousIdentifiers[] = $oldHandle;
    }

    if (!is_array($state['launcher_profiles'] ?? null)) {
        $state['launcher_profiles'] = [];
    }
    if (!is_array($state['user_types'] ?? null)) {
        $state['user_types'] = [];
    }

    $state['identifier_aliases'][$ownerKey] = $handle;
    foreach ($previousIdentifiers as $previousIdentifier) {
        $previousLookup = normalize_identifier_for_lookup($previousIdentifier);
        if ($previousLookup !== '' && $previousLookup !== $handleKey) {
            $state['identifier_aliases'][$previousLookup] = $handle;
        }
    }

    if ($oldHandleKey !== '' && $oldHandleKey !== $handleKey && isset($state['unique_handles'][$oldHandleKey]) && is_array($state['unique_handles'][$oldHandleKey])) {
        retire_active_handle($state, $oldHandleKey, $owner, $nowMs);
        unset($state['unique_handles'][$oldHandleKey]);
    }

    $state['unique_handles'][$handleKey] = [
        'handle' => $handle,
        'canonical_handle' => $handleKey,
        'owner_identifier' => $owner,
        'created_ms' => is_array($existing) && isset($existing['created_ms']) && is_numeric($existing['created_ms'])
            ? (int) $existing['created_ms']
            : (($changeValidation['operation_type'] ?? '') === 'cosmetic_edit' && ((int) ($ownerRecord['first_claimed_ms'] ?? 0)) > 0
                ? (int) $ownerRecord['first_claimed_ms']
                : $nowMs),
        'updated_ms' => $nowMs
    ];

    foreach ($previousIdentifiers as $previousIdentifier) {
        $previousLookup = normalize_identifier_for_lookup($previousIdentifier);
        if ($previousLookup === '' || $previousLookup === $handleKey) {
            continue;
        }

        if (isset($state['launcher_profiles'][$previousLookup]) && is_array($state['launcher_profiles'][$previousLookup])) {
            $targetProfiles = is_array($state['launcher_profiles'][$handleKey] ?? null) ? $state['launcher_profiles'][$handleKey] : [];
            foreach ($state['launcher_profiles'][$previousLookup] as $role => $profile) {
                if (!is_array($profile)) {
                    continue;
                }
                $existingProfile = is_array($targetProfiles[$role] ?? null) ? $targetProfiles[$role] : [];
                $targetProfiles[$role] = [
                    'own_email' => trim((string) ($existingProfile['own_email'] ?? $profile['own_email'] ?? $handle)),
                    'preferred_handle' => $handle,
                    'current_partner' => trim((string) ($existingProfile['current_partner'] ?? $profile['current_partner'] ?? '')),
                    'partner_history' => array_values(array_unique(array_filter(array_merge(
                        is_array($existingProfile['partner_history'] ?? null) ? $existingProfile['partner_history'] : [],
                        is_array($profile['partner_history'] ?? null) ? $profile['partner_history'] : []
                    ), static fn($value): bool => trim((string) $value) !== ''))),
                    'deleted_partners' => array_values(array_unique(array_filter(array_merge(
                        is_array($existingProfile['deleted_partners'] ?? null) ? $existingProfile['deleted_partners'] : [],
                        is_array($profile['deleted_partners'] ?? null) ? $profile['deleted_partners'] : []
                    ), static fn($value): bool => trim((string) $value) !== ''))),
                    'updated_ms' => max((int) ($existingProfile['updated_ms'] ?? 0), (int) ($profile['updated_ms'] ?? 0), $nowMs)
                ];
            }
            $state['launcher_profiles'][$handleKey] = $targetProfiles;
            unset($state['launcher_profiles'][$previousLookup]);
        }

        if (isset($state['user_types'][$previousLookup]) && !isset($state['user_types'][$handleKey])) {
            $state['user_types'][$handleKey] = $state['user_types'][$previousLookup];
        }
    }

    $ownerRecord['owner_identifier'] = $owner;
    $ownerRecord['current_handle'] = $handle;
    $ownerRecord['current_canonical_handle'] = $handleKey;
    if (($changeValidation['operation_type'] ?? '') === 'first_claim') {
        $ownerRecord['first_claimed_ms'] = ((int) ($ownerRecord['first_claimed_ms'] ?? 0)) > 0 ? (int) $ownerRecord['first_claimed_ms'] : $nowMs;
        $ownerRecord['lifetime_claim_count'] = max(1, (int) ($ownerRecord['lifetime_claim_count'] ?? 0));
    } elseif (($changeValidation['operation_type'] ?? '') === 'substantive_change') {
        $ownerRecord['last_substantive_change_ms'] = $nowMs;
        $ownerRecord['substantive_change_count'] = max(0, (int) ($ownerRecord['substantive_change_count'] ?? 0)) + 1;
        $ownerRecord['lifetime_claim_count'] = max(1, (int) ($ownerRecord['lifetime_claim_count'] ?? 0)) + 1;
    }
    if (($changeValidation['operation_type'] ?? '') === 'cosmetic_edit' && (int) ($ownerRecord['lifetime_claim_count'] ?? 0) <= 0) {
        $ownerRecord['lifetime_claim_count'] = 1;
    }
    $ownerRecord['updated_ms'] = $nowMs;
    $state['handle_owners'][$ownerKey] = $ownerRecord;

    return [
        'accepted' => true,
        'handle' => $handle,
        'owner_identifier' => $owner,
        'operation_type' => (string) ($changeValidation['operation_type'] ?? 'first_claim'),
        'substantive_change_count' => (int) ($ownerRecord['substantive_change_count'] ?? 0),
        'lifetime_claim_count' => (int) ($ownerRecord['lifetime_claim_count'] ?? 0),
        'previous_identifiers' => array_values(array_unique(array_filter(array_map(
            static fn($value): string => trim((string) $value),
            $previousIdentifiers
        ), static fn(string $value): bool => $value !== '' && normalize_identifier_for_lookup($value) !== $handleKey))),
        'message' => 'Unique handle accepted.'
    ];
}

function admin_update_unique_handle(array &$state, string $pairsDir, string $previousHandle, string $nextIdentifier, int $nowMs): array
{
    $oldHandle = trim(preg_replace('/\s+/', ' ', $previousHandle) ?? '');
    $newIdentifier = validate_participant_identifier_string($nextIdentifier, 'new_identifier', true);
    $newIdentifier = filter_var($newIdentifier, FILTER_VALIDATE_EMAIL)
        ? $newIdentifier
        : trim(preg_replace('/\s+/', ' ', $newIdentifier) ?? '');
    $newIsHandle = is_valid_handle_identifier($newIdentifier) && !filter_var($newIdentifier, FILTER_VALIDATE_EMAIL);

    if (!is_valid_handle_identifier($oldHandle)) {
        throw new RuntimeException('Current handle is invalid.');
    }
    if ($newIsHandle && !is_valid_handle_identifier($newIdentifier)) {
        throw new RuntimeException('New identifier is invalid.');
    }

    if (!is_array($state['unique_handles'] ?? null)) {
        $state['unique_handles'] = [];
    }
    if (!is_array($state['identifier_aliases'] ?? null)) {
        $state['identifier_aliases'] = [];
    }
    if (!is_array($state['user_types'] ?? null)) {
        $state['user_types'] = [];
    }
    if (!is_array($state['launcher_profiles'] ?? null)) {
        $state['launcher_profiles'] = [];
    }
    if (!is_array($state['retired_handles'] ?? null)) {
        $state['retired_handles'] = [];
    }
    if (!is_array($state['handle_owners'] ?? null)) {
        $state['handle_owners'] = [];
    }

    $oldKey = canonicalize_handle($oldHandle);
    $newKey = $newIsHandle ? canonicalize_handle($newIdentifier) : normalize_identifier_for_lookup($newIdentifier);
    $existingOld = is_array($state['unique_handles'][$oldKey] ?? null) ? $state['unique_handles'][$oldKey] : null;

    if (!$existingOld) {
        throw new RuntimeException('That current handle does not exist.');
    }

    if ($newKey !== $oldKey) {
        if ($newIsHandle) {
            $existingNew = is_array($state['unique_handles'][$newKey] ?? null) ? $state['unique_handles'][$newKey] : null;
            if ($existingNew) {
                throw new RuntimeException('That new handle is already in use.');
            }
            if (is_retired_handle($state, $newKey)) {
                throw new RuntimeException('That new handle was used previously and is no longer available.');
            }
        }
    }

    $ownerIdentifier = trim((string) ($existingOld['owner_identifier'] ?? $oldHandle));
    $nextOwnerIdentifier = $newIsHandle ? $ownerIdentifier : $newIdentifier;
    $ownerKey = get_handle_owner_key($ownerIdentifier);
    $nextOwnerKey = get_handle_owner_key($nextOwnerIdentifier);
    $ownerRecord = get_or_create_handle_owner_record($state, $ownerIdentifier, $nowMs);

    if ($newKey !== $oldKey) {
        retire_active_handle($state, $oldKey, $ownerIdentifier, $nowMs);
    }
    unset($state['unique_handles'][$oldKey]);

    if ($newIsHandle) {
        $state['unique_handles'][$newKey] = [
            'handle' => $newIdentifier,
            'canonical_handle' => $newKey,
            'owner_identifier' => $ownerIdentifier,
            'created_ms' => isset($existingOld['created_ms']) && is_numeric($existingOld['created_ms'])
                ? (int) $existingOld['created_ms']
                : (isset($existingOld['updated_ms']) && is_numeric($existingOld['updated_ms']) ? (int) $existingOld['updated_ms'] : $nowMs),
            'updated_ms' => $nowMs
        ];
    }

    foreach (array_keys($state['identifier_aliases']) as $aliasKey) {
        $aliasValue = $state['identifier_aliases'][$aliasKey];
        if (!is_string($aliasValue) || trim($aliasValue) === '') {
            continue;
        }
        if (canonicalize_handle($aliasValue) === $oldKey) {
            if ($newIsHandle) {
                $state['identifier_aliases'][$aliasKey] = $newIdentifier;
            } else {
                unset($state['identifier_aliases'][$aliasKey]);
            }
        }
    }
    if ($newIsHandle) {
        $state['identifier_aliases'][$oldKey] = $newIdentifier;
        if ($ownerKey !== '') {
            $state['identifier_aliases'][$ownerKey] = $newIdentifier;
        }
    } else {
        unset($state['identifier_aliases'][$oldKey]);
        if ($ownerKey !== '') {
            unset($state['identifier_aliases'][$ownerKey]);
        }
    }

    if ($newKey !== $oldKey && isset($state['user_types'][$oldKey])) {
        if (!isset($state['user_types'][$newKey])) {
            $state['user_types'][$newKey] = $state['user_types'][$oldKey];
        }
        unset($state['user_types'][$oldKey]);
    }

    $updatedLauncherProfiles = [];
    foreach ($state['launcher_profiles'] as $profileKey => $profileSet) {
        if (!is_array($profileSet)) {
            continue;
        }
        $targetProfileKey = $profileKey === $oldKey ? $newKey : $profileKey;
        if (!isset($updatedLauncherProfiles[$targetProfileKey]) || !is_array($updatedLauncherProfiles[$targetProfileKey])) {
            $updatedLauncherProfiles[$targetProfileKey] = [];
        }

        foreach ($profileSet as $role => $profile) {
            if (!is_array($profile)) {
                continue;
            }
            $existingProfile = is_array($updatedLauncherProfiles[$targetProfileKey][$role] ?? null)
                ? $updatedLauncherProfiles[$targetProfileKey][$role]
                : default_launcher_profile_state();

            $ownEmail = replace_identifier_if_match(trim((string) ($profile['own_email'] ?? '')), $oldHandle, $newIdentifier);
            $preferredHandle = trim((string) ($profile['preferred_handle'] ?? ''));
            if (canonicalize_handle($preferredHandle) === $oldKey) {
                $preferredHandle = $newIsHandle ? $newIdentifier : '';
            }

            $currentPartner = replace_identifier_if_match(trim((string) ($profile['current_partner'] ?? '')), $oldHandle, $newIdentifier);
            $partnerHistory = replace_identifier_in_list(is_array($profile['partner_history'] ?? null) ? $profile['partner_history'] : [], $oldHandle, $newIdentifier);
            $deletedPartners = replace_identifier_in_list(is_array($profile['deleted_partners'] ?? null) ? $profile['deleted_partners'] : [], $oldHandle, $newIdentifier);

            $updatedLauncherProfiles[$targetProfileKey][$role] = [
                'own_email' => $ownEmail !== '' ? $ownEmail : trim((string) ($existingProfile['own_email'] ?? '')),
                'preferred_handle' => $preferredHandle,
                'current_partner' => $currentPartner !== '' ? $currentPartner : trim((string) ($existingProfile['current_partner'] ?? '')),
                'partner_history' => sanitize_string_list(array_merge(
                    is_array($existingProfile['partner_history'] ?? null) ? $existingProfile['partner_history'] : [],
                    $partnerHistory
                )),
                'deleted_partners' => sanitize_string_list(array_merge(
                    is_array($existingProfile['deleted_partners'] ?? null) ? $existingProfile['deleted_partners'] : [],
                    $deletedPartners
                )),
                'updated_ms' => max((int) ($existingProfile['updated_ms'] ?? 0), (int) ($profile['updated_ms'] ?? 0), $nowMs)
            ];
        }
    }
    $state['launcher_profiles'] = $updatedLauncherProfiles;

    if (is_array($state['invitees'] ?? null) && isset($state['invitees'][$oldKey]) && is_array($state['invitees'][$oldKey])) {
        $inviteeRecord = $state['invitees'][$oldKey];
        unset($state['invitees'][$oldKey]);
        if ($newIsHandle) {
            $inviteeRecord['identifier'] = $newIdentifier;
            $inviteeRecord['updated_ms'] = $nowMs;
            $state['invitees'][$newKey] = $inviteeRecord;
        }
    }

    foreach ($state['sessions'] as &$sessionEntry) {
        if (!is_array($sessionEntry)) {
            continue;
        }

        foreach (['sender', 'receiver'] as $roleKey) {
            if (!is_array($sessionEntry[$roleKey]['profile'] ?? null)) {
                continue;
            }
            foreach (['own_email', 'partner_email', 'name'] as $fieldKey) {
                $sessionEntry[$roleKey]['profile'][$fieldKey] = replace_identifier_if_match(
                    trim((string) ($sessionEntry[$roleKey]['profile'][$fieldKey] ?? '')),
                    $oldHandle,
                    $newIdentifier
                );
            }
        }
    }
    unset($sessionEntry);

    foreach ($state['session_registry'] as $sessionCode => $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $state['session_registry'][$sessionCode]['sender_name'] = replace_identifier_if_match(trim((string) ($entry['sender_name'] ?? '')), $oldHandle, $newIdentifier);
        $state['session_registry'][$sessionCode]['receiver_name'] = replace_identifier_if_match(trim((string) ($entry['receiver_name'] ?? '')), $oldHandle, $newIdentifier);
    }

    foreach ($state['pair_difficulties'] as $sessionCode => $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $state['pair_difficulties'][$sessionCode]['sender_name'] = replace_identifier_if_match(trim((string) ($entry['sender_name'] ?? '')), $oldHandle, $newIdentifier);
        $state['pair_difficulties'][$sessionCode]['receiver_name'] = replace_identifier_if_match(trim((string) ($entry['receiver_name'] ?? '')), $oldHandle, $newIdentifier);
    }

    $ownerRecord['owner_identifier'] = $nextOwnerIdentifier;
    $ownerRecord['current_handle'] = $newIsHandle ? $newIdentifier : '';
    $ownerRecord['current_canonical_handle'] = $newIsHandle ? $newKey : '';
    $retiredList = is_array($ownerRecord['retired_handles'] ?? null) ? $ownerRecord['retired_handles'] : [];
    if ($newKey !== $oldKey && !in_array($oldKey, $retiredList, true)) {
        $retiredList[] = $oldKey;
    }
    $ownerRecord['retired_handles'] = array_values(array_unique(array_filter($retiredList, static fn($value): bool => trim((string) $value) !== '')));
    $ownerRecord['updated_ms'] = $nowMs;
    if ($ownerKey !== '' && $ownerKey !== $nextOwnerKey) {
        unset($state['handle_owners'][$ownerKey]);
    }
    if ($nextOwnerKey !== '') {
        $state['handle_owners'][$nextOwnerKey] = $ownerRecord;
    }

    migrate_identifier_history_in_pair_storage($pairsDir, $oldHandle, $newIdentifier);
    migrate_identifier_in_partner_messaging_state($state, $oldHandle, $newIdentifier);
    migrate_explore_pro_trial_identifier($state, $oldHandle, $newIdentifier);

    return [
        'updated' => true,
        'previous_handle' => $oldHandle,
        'new_handle' => $newIdentifier,
        'owner_identifier' => $nextOwnerIdentifier,
        'message' => $newIsHandle ? 'Handle successfully updated.' : 'Handle successfully reverted to an email identifier.'
    ];
}

function get_handle_admin_summary(array $state, string $handle): array
{
    $cleanHandle = trim(preg_replace('/\s+/', ' ', $handle) ?? '');
    if (!is_valid_handle_identifier($cleanHandle)) {
        throw new RuntimeException('Handle is invalid.');
    }

    $handleKey = canonicalize_handle($cleanHandle);
    $activeEntry = is_array($state['unique_handles'][$handleKey] ?? null) ? $state['unique_handles'][$handleKey] : null;
    $retiredEntry = is_array($state['retired_handles'][$handleKey] ?? null) ? $state['retired_handles'][$handleKey] : null;
    $status = get_identifier_status($state, $cleanHandle);

    $ownerIdentifier = '';
    $currentHandle = '';
    $isActive = false;
    $isRetired = false;

    if ($activeEntry) {
        $ownerIdentifier = trim((string) ($activeEntry['owner_identifier'] ?? ''));
        $currentHandle = trim((string) ($activeEntry['handle'] ?? $cleanHandle));
        $isActive = true;
    } elseif ($retiredEntry) {
        $ownerIdentifier = trim((string) ($retiredEntry['owner_identifier'] ?? ''));
        $currentHandle = trim((string) ($status['preferred_handle'] ?? ''));
        $isRetired = true;
    } else {
        throw new RuntimeException('That user handle does not exist.');
    }

    if ($ownerIdentifier === '') {
        $ownerIdentifier = trim((string) ($status['owner_identifier'] ?? ''));
    }

    $ownerRecord = $ownerIdentifier !== ''
        ? get_or_create_handle_owner_record($state, $ownerIdentifier, (int) floor(microtime(true) * 1000))
        : default_handle_owner_record('');
    $retiredHandles = is_array($ownerRecord['retired_handles'] ?? null) ? $ownerRecord['retired_handles'] : [];

    $history = [];
    foreach ($retiredHandles as $retiredHandleKey) {
        $retiredKey = canonicalize_handle((string) $retiredHandleKey);
        if ($retiredKey === '') {
            continue;
        }
        $retiredHandleEntry = is_array($state['retired_handles'][$retiredKey] ?? null) ? $state['retired_handles'][$retiredKey] : null;
        $history[] = trim((string) ($retiredHandleEntry['handle'] ?? $retiredKey));
    }

    $currentHandle = $currentHandle !== '' ? $currentHandle : trim((string) ($ownerRecord['current_handle'] ?? $cleanHandle));
    if ($currentHandle !== '') {
        $history[] = $currentHandle;
    }
    $history = array_values(array_unique(array_filter(array_map(
        static fn($value): string => trim((string) $value),
        $history
    ), static fn(string $value): bool => $value !== '')));

    $ownerEmail = filter_var($ownerIdentifier, FILTER_VALIDATE_EMAIL) ? $ownerIdentifier : '';
    $userType = $currentHandle !== '' ? get_user_type_for_identifier($state, $currentHandle) : 'standard';

    return [
        'requested_handle' => $cleanHandle,
        'current_handle' => $currentHandle,
        'owner_identifier' => $ownerIdentifier,
        'owner_email' => $ownerEmail,
        'user_type' => $userType === 'pro' ? 'PRO' : 'STD',
        'is_active' => $isActive,
        'is_retired' => $isRetired,
        'handle_history' => $history
    ];
}

function validate_role_value($value, string $field = 'launcher_role'): string
{
    $role = trim((string) $value);
    if (!in_array($role, ['sender', 'receiver', 'remote-viewer'], true)) {
        throw new RuntimeException($field . ' must be sender, receiver, or remote-viewer.');
    }
    return $role;
}

function validate_session_code_value($value, string $field = 'session_code', bool $required = false): string
{
    $sessionCode = trim((string) $value);
    if ($sessionCode === '') {
        if ($required) {
            throw new RuntimeException($field . ' is required.');
        }
        return '';
    }

    if (strlen($sessionCode) > 200) {
        throw new RuntimeException($field . ' is too long.');
    }

    if (!preg_match('/^[A-Za-z0-9_-]+$/', $sessionCode)) {
        throw new RuntimeException($field . ' contains invalid characters.');
    }

    return $sessionCode;
}

function validate_email_identifier_list($value, string $field, int $maxItems = 200): array
{
    if (!is_array($value)) {
        throw new RuntimeException($field . ' must be an array.');
    }

    if (count($value) > $maxItems) {
        throw new RuntimeException($field . ' contains too many items.');
    }

    $clean = [];
    foreach ($value as $index => $item) {
        $clean[] = validate_email_identifier_string($item, $field . '[' . $index . ']', true);
    }

    return array_values(array_unique($clean));
}

function validate_identifier_list($value, string $field, int $maxItems = 200): array
{
    if (!is_array($value)) {
        throw new RuntimeException($field . ' must be an array.');
    }

    if (count($value) > $maxItems) {
        throw new RuntimeException($field . ' contains too many items.');
    }

    $clean = [];
    foreach ($value as $index => $item) {
        $clean[] = validate_participant_identifier_string($item, $field . '[' . $index . ']', true);
    }

    return array_values(array_unique($clean));
}

function validate_selected_pair_payload($value, string $field = 'selected_pair'): array
{
    if (!is_array($value)) {
        throw new RuntimeException($field . ' must be an object.');
    }

    require_allowed_keys($value, ['receiver_name', 'sender_name', 'session_code', 'source'], $field);

    $source = trim((string) ($value['source'] ?? ''));
    if ($source !== '' && $source !== 'real' && $source !== 'simulation') {
        throw new RuntimeException($field . '.source must be real or simulation.');
    }

    return [
        'receiver_name' => validate_participant_identifier_string($value['receiver_name'] ?? '', $field . '.receiver_name', true),
        'sender_name' => validate_participant_identifier_string($value['sender_name'] ?? '', $field . '.sender_name', true),
        'session_code' => validate_session_code_value($value['session_code'] ?? '', $field . '.session_code', false),
        'source' => $source !== '' ? $source : 'real'
    ];
}

function validate_launcher_profile_payload($value, string $field = 'launcher_profile'): array
{
    if (!is_array($value)) {
        throw new RuntimeException($field . ' must be an object.');
    }

    require_allowed_keys($value, ['current_partner', 'difficulty_level', 'partner_history', 'deleted_partners'], $field);

    return [
        'current_partner' => validate_participant_identifier_string($value['current_partner'] ?? '', $field . '.current_partner', false),
        'difficulty_level' => normalize_difficulty_level($value['difficulty_level'] ?? '1'),
        'partner_history' => validate_identifier_list($value['partner_history'] ?? [], $field . '.partner_history'),
        'deleted_partners' => validate_identifier_list($value['deleted_partners'] ?? [], $field . '.deleted_partners')
    ];
}

function validate_analysis_metrics_payload($value, string $field = 'analysis.metrics'): array
{
    if (!is_array($value)) {
        throw new RuntimeException($field . ' must be an object.');
    }

    $allowed = [
        'raw_trial_count',
        'completed_trial_count',
        'aborted_trial_count',
        'timed_out_trial_count',
        'score_total',
        'chance_score',
        'excess_over_chance',
        'telepathic_significance_p',
        'average_confidence',
        'confidence_vs_score_correlation',
        'average_reaction_time_seconds',
        'reaction_time_vs_score_correlation',
        'average_distance_meters',
        'receiver_location_spread_meters',
        'sender_location_spread_meters',
        'first_half_excess_over_chance',
        'second_half_excess_over_chance',
        'level_breakdown'
    ];
    require_allowed_keys($value, $allowed, $field);

    $result = [];
    foreach ($allowed as $key) {
        if ($key === 'level_breakdown') {
            continue;
        }
        $current = $value[$key] ?? null;
        if ($current === null || $current === '') {
            $result[$key] = null;
            continue;
        }
        if (!is_numeric($current)) {
            throw new RuntimeException($field . '.' . $key . ' must be numeric or null.');
        }
        $number = (float) $current;
        if (!is_finite($number)) {
            throw new RuntimeException($field . '.' . $key . ' must be finite.');
        }
        if (str_contains($key, '_count') && $number < 0) {
            throw new RuntimeException($field . '.' . $key . ' cannot be negative.');
        }
        if ($key === 'telepathic_significance_p' && ($number < 0 || $number > 1)) {
            throw new RuntimeException($field . '.' . $key . ' must be between 0 and 1.');
        }
        $result[$key] = $number;
    }

    $breakdown = $value['level_breakdown'] ?? [];
    if (!is_array($breakdown)) {
        throw new RuntimeException($field . '.level_breakdown must be an object.');
    }
    require_allowed_keys($breakdown, ['level_1', 'level_2', 'level_3'], $field . '.level_breakdown');
    $result['level_breakdown'] = [];
    foreach (['level_1', 'level_2', 'level_3'] as $levelKey) {
        $levelValue = $breakdown[$levelKey] ?? [];
        if (!is_array($levelValue)) {
            throw new RuntimeException($field . '.level_breakdown.' . $levelKey . ' must be an object.');
        }
        require_allowed_keys($levelValue, ['completed_trials', 'score', 'chance_score', 'excess_over_chance'], $field . '.level_breakdown.' . $levelKey);
        $result['level_breakdown'][$levelKey] = [
            'completed_trials' => isset($levelValue['completed_trials']) && is_numeric($levelValue['completed_trials']) ? max(0, (int) $levelValue['completed_trials']) : 0,
            'score' => isset($levelValue['score']) && is_numeric($levelValue['score']) ? (float) $levelValue['score'] : 0.0,
            'chance_score' => isset($levelValue['chance_score']) && is_numeric($levelValue['chance_score']) ? (float) $levelValue['chance_score'] : 0.0,
            'excess_over_chance' => isset($levelValue['excess_over_chance']) && is_numeric($levelValue['excess_over_chance']) ? (float) $levelValue['excess_over_chance'] : 0.0
        ];
    }

    return $result;
}

function validate_analysis_payload($value): array
{
    if (!is_array($value)) {
        throw new RuntimeException('analysis must be an object.');
    }

    require_allowed_keys($value, ['analysis_version', 'app_version', 'generated_at_utc', 'pair', 'source_csv_path', 'metrics', 'messages', 'continuity_text'], 'analysis');

    $pair = validate_selected_pair_payload($value['pair'] ?? [], 'analysis.pair');
    $messages = $value['messages'] ?? [];
    if (!is_array($messages)) {
        throw new RuntimeException('analysis.messages must be an object.');
    }
    require_allowed_keys($messages, ['headline', 'recommendation', 'confidence_relationship', 'time_relationship', 'location_note'], 'analysis.messages');

    $continuityText = (string) ($value['continuity_text'] ?? '');
    if ($continuityText === '') {
        throw new RuntimeException('analysis.continuity_text is required.');
    }
    if (strlen($continuityText) > 50000) {
        throw new RuntimeException('analysis.continuity_text is too long.');
    }

    return [
        'analysis_version' => substr(trim((string) ($value['analysis_version'] ?? '')), 0, 32),
        'app_version' => substr(trim((string) ($value['app_version'] ?? '')), 0, 64),
        'generated_at_utc' => substr(trim((string) ($value['generated_at_utc'] ?? '')), 0, 64),
        'pair' => $pair,
        'source_csv_path' => substr(trim((string) ($value['source_csv_path'] ?? '')), 0, 512),
        'metrics' => validate_analysis_metrics_payload($value['metrics'] ?? [], 'analysis.metrics'),
        'messages' => [
            'headline' => substr(trim((string) ($messages['headline'] ?? '')), 0, 500),
            'recommendation' => substr(trim((string) ($messages['recommendation'] ?? '')), 0, 1000),
            'confidence_relationship' => substr(trim((string) ($messages['confidence_relationship'] ?? '')), 0, 500),
            'time_relationship' => substr(trim((string) ($messages['time_relationship'] ?? '')), 0, 500),
            'location_note' => substr(trim((string) ($messages['location_note'] ?? '')), 0, 500)
        ],
        'continuity_text' => $continuityText
    ];
}

function get_launcher_profile_entry(array $state, string $role, string $ownEmail): array
{
    $default = default_launcher_profile_state();
    $normalizedRole = $role === 'sender'
        ? 'sender'
        : ($role === 'remote-viewer' ? 'remote-viewer' : 'receiver');
    $lookupKey = get_canonical_identifier_key($state, $ownEmail);
    if ($lookupKey === '') {
        return $default;
    }

    $entry = $state['launcher_profiles'][$lookupKey][$normalizedRole] ?? null;
    if (!is_array($entry)) {
        $identifierStatus = get_identifier_status($state, $ownEmail);
        return array_merge($default, [
            'own_email' => trim($identifierStatus['preferred_identifier'] ?? $ownEmail),
            'preferred_handle' => trim((string) ($identifierStatus['preferred_handle'] ?? ''))
        ]);
    }

    return [
        'own_email' => trim((string) ($entry['own_email'] ?? $ownEmail)),
        'preferred_handle' => trim((string) ($entry['preferred_handle'] ?? '')),
        'current_partner' => trim((string) ($entry['current_partner'] ?? '')),
        'difficulty_level' => normalize_difficulty_level($entry['difficulty_level'] ?? '1'),
        'partner_history' => sanitize_string_list(is_array($entry['partner_history'] ?? null) ? $entry['partner_history'] : []),
        'deleted_partners' => sanitize_string_list(is_array($entry['deleted_partners'] ?? null) ? $entry['deleted_partners'] : []),
        'updated_ms' => isset($entry['updated_ms']) && is_numeric($entry['updated_ms']) ? (int) $entry['updated_ms'] : 0
    ];
}

function set_launcher_profile_entry(array &$state, string $role, string $ownEmail, array $entry, int $nowMs): array
{
    $normalizedRole = $role === 'sender'
        ? 'sender'
        : ($role === 'remote-viewer' ? 'remote-viewer' : 'receiver');
    $lookupKey = get_canonical_identifier_key($state, $ownEmail);
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
        'own_email' => trim((string) (get_identifier_status($state, $ownEmail)['preferred_identifier'] ?? $ownEmail)),
        'preferred_handle' => trim((string) (get_identifier_status($state, $ownEmail)['preferred_handle'] ?? '')),
        'current_partner' => $currentPartner,
        'difficulty_level' => normalize_difficulty_level($entry['difficulty_level'] ?? '1'),
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

function resolve_pair_trial_csv_path(string $pairsDir, string $receiverName, string $senderName, string $sessionCode = ''): string
{
    $exactPath = get_pair_trial_csv_path($pairsDir, $receiverName, $senderName, $sessionCode);
    if (is_file($exactPath)) {
        return $exactPath;
    }

    if ($sessionCode !== '') {
        $fallbackPath = get_pair_trial_csv_path($pairsDir, $receiverName, $senderName, '');
        if (is_file($fallbackPath)) {
            return $fallbackPath;
        }
    }

    return $exactPath;
}

function get_pair_analysis_json_path(string $pairsDir, string $receiverName, string $senderName, string $sessionCode = ''): string
{
    return $pairsDir . DIRECTORY_SEPARATOR . build_pair_storage_key($receiverName, $senderName, $sessionCode) . '.analysis.json';
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

function is_robot_simulation_identifier(string $value): bool
{
    return normalize_identifier_for_lookup($value) === 'robot';
}

function is_internal_visitor_simulation_identifier(string $value): bool
{
    $normalized = trim((string) $value);
    if ($normalized === '') {
        return false;
    }
    return preg_match('/^visitor (?:[a-z0-9]{4}|demo)$/i', $normalized) === 1;
}

function is_anonymous_visitor_simulation_trial_record(array $record): bool
{
    $receiverName = trim((string) ($record['rx name'] ?? ''));
    $senderName = trim((string) ($record['tx name'] ?? ''));
    return is_internal_visitor_simulation_identifier($receiverName) || is_internal_visitor_simulation_identifier($senderName);
}

function is_robot_simulation_trial_record(array $record): bool
{
    $receiverName = trim((string) ($record['rx name'] ?? ''));
    $senderName = trim((string) ($record['tx name'] ?? ''));
    return is_robot_simulation_identifier($receiverName) || is_robot_simulation_identifier($senderName);
}

function append_pair_trial_record(string $pairsDir, array $record, string $sessionCode = '', string $simulationMode = ''): array
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
    $targetPairsDir = ($simulationMode === 'robot' || is_robot_simulation_trial_record($record))
        ? ($GLOBALS['simulationPairsDir'] ?? $pairsDir)
        : $pairsDir;
    $path = get_pair_trial_csv_path($targetPairsDir, $receiverName, $senderName, $sessionCode);
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

function save_pair_analysis_record(string $pairsDir, array $pairInfo, array $analysis): array
{
    $receiverName = trim((string) ($pairInfo['receiver_name'] ?? ''));
    $senderName = trim((string) ($pairInfo['sender_name'] ?? ''));
    $sessionCode = trim((string) ($pairInfo['session_code'] ?? ''));

    if ($receiverName === '' || $senderName === '') {
        return [
            'saved' => false,
            'path' => '',
            'message' => 'Analysis record is missing receiver or sender name.'
        ];
    }

    $path = get_pair_analysis_json_path($pairsDir, $receiverName, $senderName, $sessionCode);
    $payload = json_encode($analysis, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        return [
            'saved' => false,
            'path' => $path,
            'message' => 'Unable to encode analysis JSON.'
        ];
    }

    file_put_contents($path, $payload . PHP_EOL, LOCK_EX);

    return [
        'saved' => true,
        'path' => $path,
        'message' => 'Analysis JSON saved.'
    ];
}

function write_pair_trial_records(string $path, array $records): void
{
    $headers = get_trial_csv_headers();
    if (!$records) {
        if (is_file($path)) {
            @unlink($path);
        }
        return;
    }

    $headerLine = implode(',', array_map('csv_cell', $headers)) . PHP_EOL;
    $body = '';
    foreach ($records as $record) {
        $body .= implode(',', array_map(
            static fn(string $header): string => csv_cell((string) ($record[$header] ?? '')),
            $headers
        )) . PHP_EOL;
    }
    file_put_contents($path, $headerLine . $body, LOCK_EX);
}

function prune_anonymous_visitor_simulation_records(string $pairsDir, int $nowMs, int $retentionMs): int
{
    if (!is_dir($pairsDir)) {
        return 0;
    }

    $prunedCount = 0;
    $paths = glob($pairsDir . DIRECTORY_SEPARATOR . '*.csv');
    if (!is_array($paths)) {
        return 0;
    }

    foreach ($paths as $path) {
        if (!is_string($path) || !is_file($path)) {
            continue;
        }

        $records = read_csv_records($path);
        if (!$records) {
            continue;
        }

        $keptRecords = [];
        $fileChanged = false;

        foreach ($records as $record) {
            if (!is_array($record) || !is_anonymous_visitor_simulation_trial_record($record)) {
                $keptRecords[] = $record;
                continue;
            }

            $recordUtc = trim((string) ($record['utc time'] ?? ''));
            $recordMillis = $recordUtc !== '' ? strtotime($recordUtc) : false;
            $recordAgeMs = $recordMillis !== false ? ($nowMs - ((int) $recordMillis * 1000)) : ($nowMs - ((int) @filemtime($path) * 1000));

            if ($recordAgeMs > $retentionMs) {
                $fileChanged = true;
                $prunedCount++;
                continue;
            }

            $keptRecords[] = $record;
        }

        if ($fileChanged) {
            write_pair_trial_records($path, $keptRecords);
        }
    }

    return $prunedCount;
}

function merge_pair_trial_records(array $existingRecords, array $incomingRecords): array
{
    $merged = [];
    foreach (array_merge($existingRecords, $incomingRecords) as $record) {
        if (!is_array($record)) {
            continue;
        }
        $roundId = trim((string) ($record['round_id'] ?? ''));
        $key = $roundId !== '' ? $roundId : md5(json_encode($record));
        $merged[$key] = $record;
    }

    $result = array_values($merged);
    usort($result, static function (array $left, array $right): int {
        $leftUtc = trim((string) ($left['utc time'] ?? ''));
        $rightUtc = trim((string) ($right['utc time'] ?? ''));
        return strcmp($leftUtc, $rightUtc);
    });
    return $result;
}

function migrate_identifier_history_in_pair_storage(string $pairsDir, string $previousIdentifier, string $nextIdentifier): void
{
    $prior = normalize_identifier_for_lookup($previousIdentifier);
    $next = trim(preg_replace('/\s+/', ' ', $nextIdentifier) ?? '');
    if ($prior === '' || $next === '' || $prior === normalize_identifier_for_lookup($next)) {
        return;
    }

    $csvPaths = glob($pairsDir . DIRECTORY_SEPARATOR . '*.csv') ?: [];
    foreach ($csvPaths as $path) {
        if (!is_file($path)) {
            continue;
        }

        $records = read_csv_records($path);
        $changed = false;
        foreach ($records as &$record) {
            if (normalize_identifier_for_lookup((string) ($record['rx name'] ?? '')) === $prior) {
                $record['rx name'] = $next;
                $changed = true;
            }
            if (normalize_identifier_for_lookup((string) ($record['tx name'] ?? '')) === $prior) {
                $record['tx name'] = $next;
                $changed = true;
            }
        }
        unset($record);

        if (!$changed) {
            continue;
        }

        if (is_file($path)) {
            @unlink($path);
        }

        $groupedByTarget = [];
        foreach ($records as $record) {
            $targetPath = get_pair_trial_csv_path(
                $pairsDir,
                trim((string) ($record['rx name'] ?? '')),
                trim((string) ($record['tx name'] ?? ''))
            );
            $groupedByTarget[$targetPath][] = $record;
        }

        foreach ($groupedByTarget as $targetPath => $targetRecords) {
            $existingTargetRecords = is_file($targetPath) ? read_csv_records($targetPath) : [];
            write_pair_trial_records($targetPath, merge_pair_trial_records($existingTargetRecords, $targetRecords));
        }
    }

    $analysisPaths = glob($pairsDir . DIRECTORY_SEPARATOR . '*.analysis.json') ?: [];
    foreach ($analysisPaths as $path) {
        if (!is_file($path)) {
            continue;
        }

        $raw = @file_get_contents($path);
        $analysis = $raw !== false ? json_decode($raw, true) : null;
        if (!is_array($analysis)) {
            continue;
        }

        $pair = is_array($analysis['pair'] ?? null) ? $analysis['pair'] : [];
        $receiverName = trim((string) ($pair['receiver_name'] ?? ''));
        $senderName = trim((string) ($pair['sender_name'] ?? ''));
        $changed = false;

        if (normalize_identifier_for_lookup($receiverName) === $prior) {
            $receiverName = $next;
            $analysis['pair']['receiver_name'] = $next;
            $changed = true;
        }
        if (normalize_identifier_for_lookup($senderName) === $prior) {
            $senderName = $next;
            $analysis['pair']['sender_name'] = $next;
            $changed = true;
        }

        if (!$changed) {
            continue;
        }

        $targetPath = get_pair_analysis_json_path(
            $pairsDir,
            $receiverName,
            $senderName,
            trim((string) ($pair['session_code'] ?? ''))
        );
        $payload = json_encode($analysis, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if ($payload !== false) {
            file_put_contents($targetPath, $payload . PHP_EOL, LOCK_EX);
        }
        if ($path !== $targetPath && is_file($path)) {
            @unlink($path);
        }
    }
}

function migrate_identifier_in_partner_messaging_state(array &$state, string $previousIdentifier, string $nextIdentifier): void
{
    $priorLookup = normalize_identifier_for_lookup($previousIdentifier);
    $next = trim(preg_replace('/\s+/', ' ', $nextIdentifier) ?? '');
    if ($priorLookup === '' || $next === '' || $priorLookup === normalize_identifier_for_lookup($next)) {
        return;
    }

    $updatedSubscriptions = [];
    foreach ((array) ($state['push_subscriptions'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $normalizedEntry = normalize_push_subscription_record($entry);
        if (normalize_identifier_for_lookup((string) $normalizedEntry['identifier']) === $priorLookup) {
            $normalizedEntry['identifier'] = $next;
        }
        $updatedSubscriptions[build_push_registration_key($normalizedEntry['device_id'], $normalizedEntry['endpoint'])] = $normalizedEntry;
    }
    $state['push_subscriptions'] = $updatedSubscriptions;

    $updatedThreads = [];
    foreach ((array) ($state['partner_message_threads'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $normalizedThread = normalize_partner_message_thread($entry);
        $participants = is_array($normalizedThread['participants'] ?? null) ? $normalizedThread['participants'] : [];
        foreach ($participants as $index => $participant) {
            if (normalize_identifier_for_lookup((string) $participant) === $priorLookup) {
                $participants[$index] = $next;
            }
        }
        $normalizedThread['participants'] = array_values($participants);

        $messages = [];
        foreach ((array) ($normalizedThread['messages'] ?? []) as $message) {
            if (!is_array($message)) {
                continue;
            }
            if (normalize_identifier_for_lookup((string) ($message['sender_identifier'] ?? '')) === $priorLookup) {
                $message['sender_identifier'] = $next;
            }
            if (normalize_identifier_for_lookup((string) ($message['recipient_identifier'] ?? '')) === $priorLookup) {
                $message['recipient_identifier'] = $next;
            }
            $messages[] = $message;
        }
        $normalizedThread['messages'] = $messages;

        $left = trim((string) ($normalizedThread['participants'][0] ?? ''));
        $right = trim((string) ($normalizedThread['participants'][1] ?? ''));
        if ($left === '' || $right === '') {
            continue;
        }

        $updatedThreads[build_partner_message_thread_key($left, $right)] = normalize_partner_message_thread($normalizedThread);
    }
    $state['partner_message_threads'] = $updatedThreads;

    $updatedReads = [];
    foreach ((array) ($state['partner_message_reads'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $normalizedRead = normalize_partner_message_read_entry($entry);
        if (normalize_identifier_for_lookup((string) $normalizedRead['owner_identifier']) === $priorLookup) {
            $normalizedRead['owner_identifier'] = $next;
        }
        if (normalize_identifier_for_lookup((string) $normalizedRead['partner_identifier']) === $priorLookup) {
            $normalizedRead['partner_identifier'] = $next;
        }
        if ($normalizedRead['owner_identifier'] === '' || $normalizedRead['partner_identifier'] === '') {
            continue;
        }
        $updatedReads[build_partner_message_read_key($normalizedRead['owner_identifier'], $normalizedRead['partner_identifier'])] = $normalizedRead;
    }
    $state['partner_message_reads'] = $updatedReads;
}

function read_all_pair_trial_records(string $pairsDir, bool $includeRobotSimulation = false): array
{
    $records = [];
    $paths = glob($pairsDir . DIRECTORY_SEPARATOR . '*.csv') ?: [];

    foreach ($paths as $path) {
        if (!is_file($path)) {
            continue;
        }

        foreach (read_csv_records($path) as $record) {
            if (!is_array($record)) {
                continue;
            }
            if (!$includeRobotSimulation && is_robot_simulation_trial_record($record)) {
                continue;
            }
            $records[] = $record;
        }
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

    $path = resolve_pair_trial_csv_path($pairsDir, $receiverName, $senderName, $sessionCode);
    if (!is_file($path)) {
        return [];
    }

    return read_csv_records($path);
}

function parse_location_visualization_value($rawValue): ?array
{
    $text = trim((string) $rawValue);
    if ($text === '') {
        return null;
    }

    $parsed = json_decode($text, true);
    if (is_array($parsed)) {
        $latitude = isset($parsed['latitude']) && is_numeric($parsed['latitude']) ? (float) $parsed['latitude'] : NAN;
        $longitude = isset($parsed['longitude']) && is_numeric($parsed['longitude']) ? (float) $parsed['longitude'] : NAN;
        $accuracy = isset($parsed['accuracy']) && is_numeric($parsed['accuracy']) ? (float) $parsed['accuracy'] : null;
        $timestamp = isset($parsed['timestamp']) && is_numeric($parsed['timestamp']) ? (int) $parsed['timestamp'] : null;
        if (is_finite($latitude) && is_finite($longitude)) {
            return [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'accuracy' => $accuracy,
                'timestamp' => $timestamp
            ];
        }
    }

    if (preg_match('/(?:latitude|lat)["=: ]+(-?\d+(?:\.\d+)?)/i', $text, $latMatch)
        && preg_match('/(?:longitude|lon|long)["=: ]+(-?\d+(?:\.\d+)?)/i', $text, $lonMatch)) {
        $latitude = (float) $latMatch[1];
        $longitude = (float) $lonMatch[1];
        $accuracy = preg_match('/accuracy["=: ]+(-?\d+(?:\.\d+)?)/i', $text, $accuracyMatch)
            ? (float) $accuracyMatch[1]
            : null;
        if (is_finite($latitude) && is_finite($longitude)) {
            return [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'accuracy' => $accuracy,
                'timestamp' => null
            ];
        }
    }

    return null;
}

function round_location_visualization_coordinate(float $value, int $decimals): float
{
    return round($value, $decimals);
}

function build_location_visualization_connection_key(array $senderLocation, array $receiverLocation): string
{
    return sprintf(
        '%.6f,%.6f__%.6f,%.6f',
        $senderLocation['longitude'],
        $senderLocation['latitude'],
        $receiverLocation['longitude'],
        $receiverLocation['latitude']
    );
}

function get_location_visualization_layout_cone_count(int $layoutNumber): int
{
    static $layoutCounts = [
        1 => 1,
        2 => 2,
        3 => 2,
        4 => 2,
        5 => 2,
        6 => 3,
        7 => 3,
        8 => 3,
        9 => 3
    ];

    return $layoutCounts[$layoutNumber] ?? 0;
}

function get_location_visualization_level_three_count_weight(int $targetConeCount): float
{
    if ($targetConeCount === 1) {
        return 1.0;
    }
    if ($targetConeCount === 2 || $targetConeCount === 3) {
        return 1.5;
    }
    return 0.0;
}

function approximate_erf_php(float $x): float
{
    $sign = $x < 0 ? -1.0 : 1.0;
    $absoluteX = abs($x);
    $a1 = 0.254829592;
    $a2 = -0.284496736;
    $a3 = 1.421413741;
    $a4 = -1.453152027;
    $a5 = 1.061405429;
    $p = 0.3275911;
    $t = 1 / (1 + $p * $absoluteX);
    $y = 1 - (((((($a5 * $t + $a4) * $t) + $a3) * $t + $a2) * $t + $a1) * $t * exp(-$absoluteX * $absoluteX));
    return $sign * $y;
}

function normal_cdf_php(float $value): float
{
    return 0.5 * (1 + approximate_erf_php($value / sqrt(2.0)));
}

function haversine_distance_meters(float $latitudeA, float $longitudeA, float $latitudeB, float $longitudeB): float
{
    $earthRadiusMeters = 6371000.0;
    $toRadians = static fn(float $degrees): float => $degrees * (M_PI / 180.0);
    $lat1 = $toRadians($latitudeA);
    $lat2 = $toRadians($latitudeB);
    $deltaLat = $toRadians($latitudeB - $latitudeA);
    $deltaLon = $toRadians($longitudeB - $longitudeA);

    $sinLat = sin($deltaLat / 2.0);
    $sinLon = sin($deltaLon / 2.0);
    $chord = ($sinLat * $sinLat) + (cos($lat1) * cos($lat2) * $sinLon * $sinLon);
    $arc = 2.0 * atan2(sqrt($chord), sqrt(max(0.0, 1.0 - $chord)));
    return $earthRadiusMeters * $arc;
}

function get_location_visualization_trial_score_model(array $record): array
{
    $trialAborted = strtolower(trim((string) ($record['trial aborted'] ?? ''))) === 'yes';
    $trialTimedOut = strtolower(trim((string) ($record['trial timed out'] ?? ''))) === 'yes';
    if ($trialAborted || $trialTimedOut) {
        return [
            'observed' => null,
            'expected' => null,
            'variance' => null,
            'level' => 0
        ];
    }

    $difficultyLevel = trim((string) ($record['difficulty level'] ?? ''));
    $sentLayout = is_numeric($record['sent layout'] ?? null) ? (int) $record['sent layout'] : 0;
    $choiceOneRaw = trim((string) ($record['rx choice1'] ?? ''));
    if ($choiceOneRaw === '') {
        return [
            'observed' => null,
            'expected' => null,
            'variance' => null,
            'level' => 0
        ];
    }

    $choiceOne = is_numeric($choiceOneRaw) ? (int) $choiceOneRaw : 0;
    $sentConeCount = get_location_visualization_layout_cone_count($sentLayout);
    $chosenConeCount = get_location_visualization_layout_cone_count($choiceOne);
    $exactMatch = $sentLayout === $choiceOne;
    $countMatch = $sentConeCount > 0 && $sentConeCount === $chosenConeCount;

    if ($difficultyLevel === '1') {
        $choseOne = $choiceOneRaw === '1';
        $choseMany = $choiceOneRaw === '3';
        $observed = (($sentConeCount === 1 && $choseOne) || ($sentConeCount === 3 && $choseMany)) ? 1.0 : 0.0;
        return [
            'observed' => $observed,
            'expected' => 0.5,
            'variance' => 0.25,
            'level' => 1
        ];
    }

    if ($difficultyLevel === '2') {
        if ($sentConeCount === 1) {
            $observed = $exactMatch ? 1.0 : 0.0;
            return [
                'observed' => $observed,
                'expected' => 0.2,
                'variance' => 0.16,
                'level' => 2
            ];
        }

        $observed = $exactMatch ? 2.0 : ($countMatch ? 1.0 : 0.0);
        return [
            'observed' => $observed,
            'expected' => 1.0,
            'variance' => 0.4,
            'level' => 2
        ];
    }

    if ($difficultyLevel === '3') {
        $countWeight = get_location_visualization_level_three_count_weight($sentConeCount);
        $arrangementBonus = $exactMatch ? 1.0 : 0.0;
        $observed = $countMatch ? $countWeight + $arrangementBonus : 0.0;

        if ($sentConeCount === 1) {
            return [
                'observed' => $observed,
                'expected' => 2 / 9,
                'variance' => 32 / 81,
                'level' => 3
            ];
        }

        if ($sentConeCount === 2 || $sentConeCount === 3) {
            return [
                'observed' => $observed,
                'expected' => 7 / 9,
                'variance' => 68 / 81,
                'level' => 3
            ];
        }
    }

    return [
        'observed' => null,
        'expected' => null,
        'variance' => null,
        'level' => 0
    ];
}

function get_location_visualization_p_value(float $scoreTotal, float $chanceTotal, float $varianceTotal, int $trialCount): ?float
{
    if ($trialCount < 1 || $varianceTotal <= 0) {
        return null;
    }

    $zScore = ($scoreTotal - $chanceTotal) / sqrt($varianceTotal);
    return 1 - normal_cdf_php($zScore);
}

function get_location_visualization_color_class(int $completedTrials, ?float $pValue): string
{
    if ($completedTrials < 10 || $pValue === null) {
        return 'gray';
    }
    if ($pValue < 0.01) {
        return 'purple';
    }
    if ($pValue < 0.05) {
        return 'green';
    }
    return 'gray';
}

function build_location_visualization_payload(string $pairsDir, array $selectedPair, array $request): array
{
    $pairRecords = read_pair_trial_records_for_pair($pairsDir, $selectedPair);
    $selectedLevel = trim((string) ($request['level'] ?? 'all'));
    $includeIncomplete = !empty($request['include_incomplete']);
    $groupBy = trim((string) ($request['group_by'] ?? 'rounded')) === 'exact' ? 'exact' : 'rounded';
    $roundingDecimals = isset($request['rounding_decimals']) && is_numeric($request['rounding_decimals'])
        ? max(0, min(6, (int) $request['rounding_decimals']))
        : 3;
    $minimumTrials = isset($request['min_trials']) && is_numeric($request['min_trials'])
        ? max(1, (int) $request['min_trials'])
        : 1;
    $dateFrom = trim((string) ($request['date_from'] ?? ''));
    $dateTo = trim((string) ($request['date_to'] ?? ''));
    $dateFromTs = $dateFrom !== '' ? strtotime($dateFrom . ' 00:00:00 UTC') : false;
    $dateToTs = $dateTo !== '' ? strtotime($dateTo . ' 23:59:59 UTC') : false;

    $groups = [];
    foreach ($pairRecords as $record) {
        if ($selectedLevel !== '' && $selectedLevel !== 'all' && trim((string) ($record['difficulty level'] ?? '')) !== $selectedLevel) {
            continue;
        }

        $utcText = trim((string) ($record['utc time'] ?? ''));
        $utcTs = $utcText !== '' ? strtotime($utcText) : false;
        if ($dateFromTs !== false && ($utcTs === false || $utcTs < $dateFromTs)) {
            continue;
        }
        if ($dateToTs !== false && ($utcTs === false || $utcTs > $dateToTs)) {
            continue;
        }

        $receiverLocation = parse_location_visualization_value($record['rx location'] ?? '');
        $senderLocation = parse_location_visualization_value($record['tx location'] ?? '');
        if (!$receiverLocation || !$senderLocation) {
            continue;
        }

        if ($groupBy === 'rounded') {
            $receiverLocation['latitude'] = round_location_visualization_coordinate((float) $receiverLocation['latitude'], $roundingDecimals);
            $receiverLocation['longitude'] = round_location_visualization_coordinate((float) $receiverLocation['longitude'], $roundingDecimals);
            $senderLocation['latitude'] = round_location_visualization_coordinate((float) $senderLocation['latitude'], $roundingDecimals);
            $senderLocation['longitude'] = round_location_visualization_coordinate((float) $senderLocation['longitude'], $roundingDecimals);
        }

        $scoreModel = get_location_visualization_trial_score_model($record);
        $isCompleted = $scoreModel['observed'] !== null && $scoreModel['expected'] !== null && $scoreModel['variance'] !== null;
        if (!$includeIncomplete && !$isCompleted) {
            continue;
        }

        $connectionKey = build_location_visualization_connection_key($senderLocation, $receiverLocation);
        if (!isset($groups[$connectionKey])) {
            $groups[$connectionKey] = [
                'connection_key' => $connectionKey,
                'sender' => [
                    'lat' => (float) $senderLocation['latitude'],
                    'long' => (float) $senderLocation['longitude'],
                    'label' => 'Sender location'
                ],
                'receiver' => [
                    'lat' => (float) $receiverLocation['latitude'],
                    'long' => (float) $receiverLocation['longitude'],
                    'label' => 'Receiver location'
                ],
                'trial_count_all' => 0,
                'trial_count_completed' => 0,
                'score_total' => 0.0,
                'chance_total' => 0.0,
                'variance_total' => 0.0,
                'confidence_sum' => 0.0,
                'confidence_count' => 0,
                'time_sum' => 0.0,
                'time_count' => 0,
                'distance_sum' => 0.0,
                'distance_count' => 0,
                'levels_used' => [],
                'first_trial_utc' => '',
                'last_trial_utc' => '',
                'sample_trials' => []
            ];
        }

        $group = &$groups[$connectionKey];
        $group['trial_count_all'] += 1;
        if ($group['first_trial_utc'] === '' || ($utcText !== '' && strcmp($utcText, $group['first_trial_utc']) < 0)) {
            $group['first_trial_utc'] = $utcText;
        }
        if ($group['last_trial_utc'] === '' || ($utcText !== '' && strcmp($utcText, $group['last_trial_utc']) > 0)) {
            $group['last_trial_utc'] = $utcText;
        }

        $distanceMeters = haversine_distance_meters(
            (float) $senderLocation['latitude'],
            (float) $senderLocation['longitude'],
            (float) $receiverLocation['latitude'],
            (float) $receiverLocation['longitude']
        );
        if (is_finite($distanceMeters)) {
            $group['distance_sum'] += $distanceMeters;
            $group['distance_count'] += 1;
        }

        if ($isCompleted) {
            $group['trial_count_completed'] += 1;
            $group['score_total'] += (float) $scoreModel['observed'];
            $group['chance_total'] += (float) $scoreModel['expected'];
            $group['variance_total'] += (float) $scoreModel['variance'];
            $group['levels_used'][(string) $scoreModel['level']] = true;

            $confidenceValue = trim((string) ($record['confidence'] ?? ''));
            if ($confidenceValue !== '' && is_numeric($confidenceValue)) {
                $group['confidence_sum'] += (float) $confidenceValue;
                $group['confidence_count'] += 1;
            }

            $timeValue = trim((string) ($record['rx done rt'] ?? ''));
            if ($timeValue !== '' && is_numeric($timeValue)) {
                $group['time_sum'] += ((float) $timeValue) / 1000;
                $group['time_count'] += 1;
            }

            if (count($group['sample_trials']) < 5) {
                $group['sample_trials'][] = [
                    'round_id' => trim((string) ($record['round_id'] ?? '')),
                    'utc_time' => $utcText,
                    'level' => (int) $scoreModel['level'],
                    'score' => (float) $scoreModel['observed'],
                    'chance_score' => (float) $scoreModel['expected'],
                    'confidence' => $confidenceValue !== '' && is_numeric($confidenceValue) ? (float) $confidenceValue : null,
                    'time_seconds' => $timeValue !== '' && is_numeric($timeValue) ? round(((float) $timeValue) / 1000, 1) : null
                ];
            }
        }
        unset($group);
    }

    $connections = [];
    $summaryCompletedTrials = 0;
    $summaryFirstUtc = '';
    $summaryLastUtc = '';
    foreach ($groups as $group) {
        if (($group['trial_count_all'] ?? 0) < $minimumTrials) {
            continue;
        }

        $levelsUsed = array_map('intval', array_keys($group['levels_used']));
        sort($levelsUsed);
        $pValue = get_location_visualization_p_value(
            (float) $group['score_total'],
            (float) $group['chance_total'],
            (float) $group['variance_total'],
            (int) $group['trial_count_completed']
        );
        $completedCount = (int) $group['trial_count_completed'];
        $scoreTotal = round((float) $group['score_total'], 3);
        $chanceTotal = round((float) $group['chance_total'], 3);
        $connections[] = [
            'connection_key' => $group['connection_key'],
            'sender' => $group['sender'],
            'receiver' => $group['receiver'],
            'distance_meters_mean' => $group['distance_count'] > 0 ? round($group['distance_sum'] / $group['distance_count'], 1) : null,
            'trial_count_completed' => $completedCount,
            'trial_count_all' => (int) $group['trial_count_all'],
            'first_trial_utc' => $group['first_trial_utc'],
            'last_trial_utc' => $group['last_trial_utc'],
            'levels_used' => $levelsUsed,
            'score_total' => $scoreTotal,
            'chance_total' => $chanceTotal,
            'score_delta' => round($scoreTotal - $chanceTotal, 3),
            'p_value' => $pValue !== null ? (float) sprintf('%.6g', $pValue) : null,
            'color_class' => get_location_visualization_color_class($completedCount, $pValue),
            'average_confidence' => $group['confidence_count'] > 0 ? round($group['confidence_sum'] / $group['confidence_count'], 2) : null,
            'average_time_seconds' => $group['time_count'] > 0 ? round($group['time_sum'] / $group['time_count'], 2) : null,
            'sample_trials' => $group['sample_trials']
        ];

        $summaryCompletedTrials += $completedCount;
        if ($group['first_trial_utc'] !== '' && ($summaryFirstUtc === '' || strcmp($group['first_trial_utc'], $summaryFirstUtc) < 0)) {
            $summaryFirstUtc = $group['first_trial_utc'];
        }
        if ($group['last_trial_utc'] !== '' && ($summaryLastUtc === '' || strcmp($group['last_trial_utc'], $summaryLastUtc) > 0)) {
            $summaryLastUtc = $group['last_trial_utc'];
        }
    }

    usort($connections, static function (array $left, array $right): int {
        $trialCompare = ($right['trial_count_completed'] ?? 0) <=> ($left['trial_count_completed'] ?? 0);
        if ($trialCompare !== 0) {
            return $trialCompare;
        }
        return strcmp((string) ($right['last_trial_utc'] ?? ''), (string) ($left['last_trial_utc'] ?? ''));
    });

    return [
        'available' => count($connections) > 0,
        'pair' => [
            'pair_key' => build_pair_storage_key(
                trim((string) ($selectedPair['receiver_name'] ?? '')),
                trim((string) ($selectedPair['sender_name'] ?? '')),
                trim((string) ($selectedPair['session_code'] ?? ''))
            ),
            'receiver_id' => trim((string) ($selectedPair['receiver_name'] ?? '')),
            'sender_id' => trim((string) ($selectedPair['sender_name'] ?? '')),
            'receiver_label' => trim((string) ($selectedPair['receiver_name'] ?? '')),
            'sender_label' => trim((string) ($selectedPair['sender_name'] ?? ''))
        ],
        'filters' => [
            'level' => $selectedLevel !== '' ? $selectedLevel : 'all',
            'date_from' => $dateFrom !== '' ? $dateFrom : null,
            'date_to' => $dateTo !== '' ? $dateTo : null,
            'min_trials' => $minimumTrials,
            'include_incomplete' => $includeIncomplete,
            'group_by' => $groupBy,
            'rounding_decimals' => $roundingDecimals
        ],
        'summary' => [
            'completed_trials' => $summaryCompletedTrials,
            'connections' => count($connections),
            'first_trial_utc' => $summaryFirstUtc !== '' ? $summaryFirstUtc : null,
            'last_trial_utc' => $summaryLastUtc !== '' ? $summaryLastUtc : null
        ],
        'connections' => $connections,
        'legend' => [
            'minimum_trials_for_color' => 10,
            'gray' => 'Below chance or insufficient evidence',
            'green' => 'Above chance',
            'purple' => 'Very much above chance'
        ],
        'message' => count($connections) > 0 ? '' : 'No usable location records were found for the current receiver-sender selection.'
    ];
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
        return array_values(array_filter($records, static function (array $record): bool {
            $receiverName = trim((string) ($record['rx name'] ?? ''));
            $senderName = trim((string) ($record['tx name'] ?? ''));
            $source = trim((string) ($record['_report_source'] ?? 'real'));
            if (strcasecmp($source, 'simulation') === 0) {
                return $receiverName !== '' && $senderName !== '';
            }
            return $receiverName !== '' && $senderName !== '' && is_demo_report_pair($receiverName, $senderName);
        }));
    }

    $filtered = [];
    foreach ($records as $record) {
        $receiverName = trim((string) ($record['rx name'] ?? ''));
        $senderName = trim((string) ($record['tx name'] ?? ''));
        $source = trim((string) ($record['_report_source'] ?? 'real'));

        if (strcasecmp($source, 'simulation') === 0) {
            $filtered[] = $record;
            continue;
        }

        $pairKey = build_pair_match_key($receiverName, $senderName);

        $matchesCandidatePair = $candidatePairKeys && isset($candidatePairKeys[$pairKey]);
        $receiverMatch = normalize_person_name_for_match($receiverName);
        $senderMatch = normalize_person_name_for_match($senderName);
        $matchesAssociatedName = $associatedNameSet
            && (isset($associatedNameSet[$receiverMatch]) || isset($associatedNameSet[$senderMatch]));
        $matchesDemoPair = is_demo_report_pair($receiverName, $senderName);

        if (($candidatePairKeys || $associatedNameSet) && !$matchesCandidatePair && !$matchesAssociatedName && !$matchesDemoPair) {
            continue;
        }

        $filtered[] = $record;
    }

    return $filtered;
}

function format_trial_summary_date_label(string $utcTime, string $localDate): string
{
    $utc = trim($utcTime);
    if ($utc !== '') {
        try {
            $date = new DateTimeImmutable($utc);
            return $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i') . ' UTC';
        } catch (Exception $exception) {
            // Fall back to the stored local date if the UTC value is malformed.
        }
    }

    $local = trim($localDate);
    return $local !== '' ? $local : 'unknown';
}

function build_user_trial_summary(array $state, array $records): array
{
    $summary = [];
    $knownUsers = [];
    $usersWithTrialRows = [];

    $rememberKnownUser = static function (string $identifier) use (&$knownUsers, $state): void {
        $cleanIdentifier = trim($identifier);
        if ($cleanIdentifier === '') {
            return;
        }
        $status = get_identifier_status($state, $cleanIdentifier);
        $preferredIdentifier = trim((string) ($status['preferred_identifier'] ?? $cleanIdentifier));
        if ($preferredIdentifier === '') {
            return;
        }
        $canonicalKey = get_canonical_identifier_key($state, $preferredIdentifier);
        $summaryKey = $canonicalKey !== '' ? $canonicalKey : strtolower($preferredIdentifier);
        if ($summaryKey === '') {
            return;
        }
        $knownUsers[$summaryKey] = $preferredIdentifier;
    };

    foreach ($records as $record) {
        if (!is_array($record)) {
            continue;
        }

        $receiverRaw = trim((string) ($record['rx name'] ?? ''));
        $senderRaw = trim((string) ($record['tx name'] ?? ''));
        $localDate = trim((string) ($record['local date'] ?? ''));
        $utcTime = trim((string) ($record['utc time'] ?? ''));
        $sortKey = $utcTime !== '' ? $utcTime : $localDate;
        $dateLabel = format_trial_summary_date_label($utcTime, $localDate);

        $receiverStatus = $receiverRaw !== '' ? get_identifier_status($state, $receiverRaw) : [];
        $senderStatus = $senderRaw !== '' ? get_identifier_status($state, $senderRaw) : [];
        $receiverName = trim((string) ($receiverStatus['preferred_identifier'] ?? $receiverRaw));
        $senderName = trim((string) ($senderStatus['preferred_identifier'] ?? $senderRaw));
        $receiverCanonical = get_canonical_identifier_key($state, $receiverName);
        $senderCanonical = get_canonical_identifier_key($state, $senderName);

        if ($receiverName !== '' && $senderName !== '') {
            $receiverKey = ($receiverCanonical !== '' ? $receiverCanonical : strtolower($receiverName))
                . '|receiver|'
                . ($senderCanonical !== '' ? $senderCanonical : strtolower($senderName));
            $usersWithTrialRows[$receiverCanonical !== '' ? $receiverCanonical : strtolower($receiverName)] = true;
            $usersWithTrialRows[$senderCanonical !== '' ? $senderCanonical : strtolower($senderName)] = true;
            if (!isset($summary[$receiverKey])) {
                $summary[$receiverKey] = [
                    'user_name' => $receiverName,
                    'role' => 'receiver',
                    'partner_name' => $senderName,
                    'status' => get_user_type_for_identifier($state, $receiverName) === 'pro' ? 'PRO' : 'STD',
                    'trial_count' => 0,
                    'first_date' => $dateLabel,
                    'last_date' => $dateLabel,
                    '_first_sort_key' => $sortKey,
                    '_last_sort_key' => $sortKey
                ];
            }
            $summary[$receiverKey]['trial_count']++;
            if ($sortKey !== '' && ((string) ($summary[$receiverKey]['_first_sort_key'] ?? '') === '' || strcmp($sortKey, (string) ($summary[$receiverKey]['_first_sort_key'] ?? '')) <= 0)) {
                $summary[$receiverKey]['_first_sort_key'] = $sortKey;
                $summary[$receiverKey]['first_date'] = $dateLabel;
            }
            if ($sortKey !== '' && strcmp($sortKey, (string) ($summary[$receiverKey]['_last_sort_key'] ?? '')) >= 0) {
                $summary[$receiverKey]['_last_sort_key'] = $sortKey;
                $summary[$receiverKey]['last_date'] = $dateLabel;
            }

            $senderKey = ($senderCanonical !== '' ? $senderCanonical : strtolower($senderName))
                . '|sender|'
                . ($receiverCanonical !== '' ? $receiverCanonical : strtolower($receiverName));
            if (!isset($summary[$senderKey])) {
                $summary[$senderKey] = [
                    'user_name' => $senderName,
                    'role' => 'sender',
                    'partner_name' => $receiverName,
                    'status' => get_user_type_for_identifier($state, $senderName) === 'pro' ? 'PRO' : 'STD',
                    'trial_count' => 0,
                    'first_date' => $dateLabel,
                    'last_date' => $dateLabel,
                    '_first_sort_key' => $sortKey,
                    '_last_sort_key' => $sortKey
                ];
            }
            $summary[$senderKey]['trial_count']++;
            if ($sortKey !== '' && ((string) ($summary[$senderKey]['_first_sort_key'] ?? '') === '' || strcmp($sortKey, (string) ($summary[$senderKey]['_first_sort_key'] ?? '')) <= 0)) {
                $summary[$senderKey]['_first_sort_key'] = $sortKey;
                $summary[$senderKey]['first_date'] = $dateLabel;
            }
            if ($sortKey !== '' && strcmp($sortKey, (string) ($summary[$senderKey]['_last_sort_key'] ?? '')) >= 0) {
                $summary[$senderKey]['_last_sort_key'] = $sortKey;
                $summary[$senderKey]['last_date'] = $dateLabel;
            }
        }
    }

    $uniqueHandles = is_array($state['unique_handles'] ?? null) ? $state['unique_handles'] : [];
    foreach ($uniqueHandles as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $rememberKnownUser((string) ($entry['handle'] ?? ''));
        $rememberKnownUser((string) ($entry['owner_identifier'] ?? ''));
    }

    $userTypes = is_array($state['user_types'] ?? null) ? $state['user_types'] : [];
    foreach (array_keys($userTypes) as $identifierKey) {
        $rememberKnownUser((string) $identifierKey);
    }

    $launcherProfiles = is_array($state['launcher_profiles'] ?? null) ? $state['launcher_profiles'] : [];
    foreach (array_keys($launcherProfiles) as $identifierKey) {
        $rememberKnownUser((string) $identifierKey);
    }

    foreach ($knownUsers as $userKey => $preferredIdentifier) {
        if (isset($usersWithTrialRows[$userKey])) {
            continue;
        }
        $summary[$userKey . '|user|'] = [
            'user_name' => $preferredIdentifier,
            'role' => '',
            'partner_name' => '',
            'status' => get_user_type_for_identifier($state, $preferredIdentifier) === 'pro' ? 'PRO' : 'STD',
            'trial_count' => 0,
            'first_date' => '',
            'last_date' => '',
            '_first_sort_key' => '',
            '_last_sort_key' => ''
        ];
    }

    $rows = array_map(static function (array $row): array {
        unset($row['_first_sort_key']);
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

function is_completed_trial_record(array $record): bool
{
    $trialAborted = strtolower(trim((string) ($record['trial aborted'] ?? ''))) === 'yes';
    $trialTimedOut = strtolower(trim((string) ($record['trial timed out'] ?? ''))) === 'yes';
    $choiceOneRaw = trim((string) ($record['rx choice1'] ?? ''));
    return !$trialAborted && !$trialTimedOut && $choiceOneRaw !== '';
}

function map_pair_source_to_admin_type(string $source, string $receiverName, string $senderName): string
{
    $normalizedSource = strtolower(trim($source));
    if ($normalizedSource === 'simulation') {
        return 'Simulation';
    }
    if (is_demo_report_pair($receiverName, $senderName)) {
        return 'Demo';
    }
    return 'Human';
}

function get_pair_type_sort_order(string $type): int
{
    return match (strtolower(trim($type))) {
        'human' => 0,
        'simulation' => 1,
        'demo' => 2,
        default => 9
    };
}

function format_levels_used_for_summary(array $levelsUsed): string
{
    $levels = array_values(array_unique(array_filter(array_map(
        static function ($value): string {
            $trimmed = trim((string) $value);
            if ($trimmed === '') {
                return '';
            }
            return 'L' . preg_replace('/[^0-9.]/', '', $trimmed);
        },
        $levelsUsed
    ), static fn(string $value): bool => $value !== '' )));
    usort($levels, static function (string $left, string $right): int {
        $leftNumber = (float) preg_replace('/[^0-9.]/', '', $left);
        $rightNumber = (float) preg_replace('/[^0-9.]/', '', $right);
        if ($leftNumber === $rightNumber) {
            return strcmp($left, $right);
        }
        return $leftNumber <=> $rightNumber;
    });
    return implode(',', $levels);
}

function detect_identity_kind(array $state, string $identifier): string
{
    $cleanIdentifier = trim($identifier);
    $lookup = normalize_identifier_for_lookup($cleanIdentifier);
    if ($lookup === '') {
        return 'Unique Name';
    }
    if (filter_var($cleanIdentifier, FILTER_VALIDATE_EMAIL)) {
        return 'Email';
    }
    if (is_array($state['invitees'] ?? null) && isset($state['invitees'][$lookup]) && is_array($state['invitees'][$lookup])) {
        return 'Invitee';
    }
    return 'Unique Name';
}

function build_all_pairs_summary(array $state, array $records): array
{
    $summary = [];

    foreach ($records as $record) {
        if (!is_array($record)) {
            continue;
        }
        if (!is_completed_trial_record($record)) {
            continue;
        }

        $receiverRaw = trim((string) ($record['rx name'] ?? ''));
        $senderRaw = trim((string) ($record['tx name'] ?? ''));
        if ($receiverRaw === '' || $senderRaw === '') {
            continue;
        }
        if (
            is_internal_visitor_simulation_identifier($receiverRaw)
            || is_internal_visitor_simulation_identifier($senderRaw)
        ) {
            continue;
        }

        $receiverStatus = get_identifier_status($state, $receiverRaw);
        $senderStatus = get_identifier_status($state, $senderRaw);
        $receiverName = trim((string) ($receiverStatus['preferred_identifier'] ?? $receiverRaw));
        $senderName = trim((string) ($senderStatus['preferred_identifier'] ?? $senderRaw));
        if ($receiverName === '' || $senderName === '') {
            continue;
        }

        $source = strtolower(trim((string) ($record['_report_source'] ?? 'real'))) === 'simulation'
            ? 'simulation'
            : 'real';
        $type = map_pair_source_to_admin_type($source, $receiverName, $senderName);
        $pairKey = build_pair_match_key($receiverName, $senderName) . '|||' . strtolower($type);
        $localDate = trim((string) ($record['local date'] ?? ''));
        $utcTime = trim((string) ($record['utc time'] ?? ''));
        $sortKey = $utcTime !== '' ? $utcTime : $localDate;
        $dateLabel = format_trial_summary_date_label($utcTime, $localDate);
        $levelValue = trim((string) ($record['difficulty level'] ?? ''));

        if (!isset($summary[$pairKey])) {
            $summary[$pairKey] = [
                'receiver_name' => $receiverName,
                'sender_name' => $senderName,
                'type' => $type,
                'trial_count' => 0,
                'levels_used' => [],
                'first_date' => $dateLabel,
                'last_date' => $dateLabel,
                '_first_sort_key' => $sortKey,
                '_last_sort_key' => $sortKey,
                'selected_pair' => [
                    'receiver_name' => $receiverName,
                    'sender_name' => $senderName,
                    'source' => $source === 'simulation' ? 'simulation' : 'real'
                ]
            ];
        }

        $summary[$pairKey]['trial_count'] += 1;
        if ($levelValue !== '') {
            $summary[$pairKey]['levels_used'][$levelValue] = true;
        }
        if ($sortKey !== '' && ((string) ($summary[$pairKey]['_first_sort_key'] ?? '') === '' || strcmp($sortKey, (string) ($summary[$pairKey]['_first_sort_key'] ?? '')) <= 0)) {
            $summary[$pairKey]['_first_sort_key'] = $sortKey;
            $summary[$pairKey]['first_date'] = $dateLabel;
        }
        if ($sortKey !== '' && strcmp($sortKey, (string) ($summary[$pairKey]['_last_sort_key'] ?? '')) >= 0) {
            $summary[$pairKey]['_last_sort_key'] = $sortKey;
            $summary[$pairKey]['last_date'] = $dateLabel;
        }
    }

    $rows = [];
    foreach ($summary as $row) {
        $levelsUsed = array_keys((array) ($row['levels_used'] ?? []));
        $row['levels'] = format_levels_used_for_summary($levelsUsed);
        unset($row['levels_used'], $row['_first_sort_key']);
        $rows[] = $row;
    }

    usort($rows, static function (array $left, array $right): int {
        $typeCompare = get_pair_type_sort_order((string) ($left['type'] ?? '')) <=> get_pair_type_sort_order((string) ($right['type'] ?? ''));
        if ($typeCompare !== 0) {
            return $typeCompare;
        }
        $leftLast = (string) ($left['_last_sort_key'] ?? '');
        $rightLast = (string) ($right['_last_sort_key'] ?? '');
        if ($leftLast !== $rightLast) {
            return strcmp($rightLast, $leftLast);
        }
        $receiverCompare = strcasecmp((string) ($left['receiver_name'] ?? ''), (string) ($right['receiver_name'] ?? ''));
        if ($receiverCompare !== 0) {
            return $receiverCompare;
        }
        return strcasecmp((string) ($left['sender_name'] ?? ''), (string) ($right['sender_name'] ?? ''));
    });

    foreach ($rows as &$row) {
        unset($row['_last_sort_key']);
    }
    unset($row);

    return $rows;
}

function build_all_identities_summary(array $state, array $records): array
{
    $summary = [];

    $ensureIdentity = static function (string $identifier) use (&$summary, $state): void {
        $cleanIdentifier = trim($identifier);
        if ($cleanIdentifier === '') {
            return;
        }
        if (is_internal_visitor_simulation_identifier($cleanIdentifier)) {
            return;
        }
        $status = get_identifier_status($state, $cleanIdentifier);
        $preferredIdentifier = trim((string) ($status['preferred_identifier'] ?? $cleanIdentifier));
        if ($preferredIdentifier === '') {
            return;
        }
        $canonicalKey = get_canonical_identifier_key($state, $preferredIdentifier);
        $summaryKey = $canonicalKey !== '' ? $canonicalKey : normalize_identifier_for_lookup($preferredIdentifier);
        if ($summaryKey === '') {
            return;
        }
        if (!isset($summary[$summaryKey])) {
            $summary[$summaryKey] = [
                'identity' => $preferredIdentifier,
                'kind' => detect_identity_kind($state, $preferredIdentifier),
                'subscription' => get_user_type_for_identifier($state, $preferredIdentifier) === 'pro' ? 'PRO' : 'STD',
                'completed_trials' => 0,
                'distinct_partners' => [],
                'first_activity' => '',
                'last_activity' => '',
                '_first_sort_key' => '',
                '_last_sort_key' => ''
            ];
        }
    };

    foreach ((array) ($state['unique_handles'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $ensureIdentity((string) ($entry['handle'] ?? ''));
        $ensureIdentity((string) ($entry['owner_identifier'] ?? ''));
    }
    foreach (array_keys((array) ($state['user_types'] ?? [])) as $identifierKey) {
        $ensureIdentity((string) $identifierKey);
    }
    foreach (array_keys((array) ($state['launcher_profiles'] ?? [])) as $identifierKey) {
        $ensureIdentity((string) $identifierKey);
    }
    foreach ((array) ($state['invitees'] ?? []) as $identifierKey => $entry) {
        if (is_array($entry)) {
            $ensureIdentity((string) $identifierKey);
        }
    }

    foreach ($records as $record) {
        if (!is_array($record)) {
            continue;
        }
        if (!is_completed_trial_record($record)) {
            continue;
        }

        $receiverRaw = trim((string) ($record['rx name'] ?? ''));
        $senderRaw = trim((string) ($record['tx name'] ?? ''));
        $localDate = trim((string) ($record['local date'] ?? ''));
        $utcTime = trim((string) ($record['utc time'] ?? ''));
        $sortKey = $utcTime !== '' ? $utcTime : $localDate;
        $dateLabel = format_trial_summary_date_label($utcTime, $localDate);

        if ($receiverRaw === '' || $senderRaw === '') {
            continue;
        }
        if (
            is_internal_visitor_simulation_identifier($receiverRaw)
            || is_internal_visitor_simulation_identifier($senderRaw)
        ) {
            continue;
        }

        $receiverStatus = get_identifier_status($state, $receiverRaw);
        $senderStatus = get_identifier_status($state, $senderRaw);
        $receiverName = trim((string) ($receiverStatus['preferred_identifier'] ?? $receiverRaw));
        $senderName = trim((string) ($senderStatus['preferred_identifier'] ?? $senderRaw));
        $ensureIdentity($receiverName);
        $ensureIdentity($senderName);

        $receiverKey = get_canonical_identifier_key($state, $receiverName);
        $receiverKey = $receiverKey !== '' ? $receiverKey : normalize_identifier_for_lookup($receiverName);
        $senderKey = get_canonical_identifier_key($state, $senderName);
        $senderKey = $senderKey !== '' ? $senderKey : normalize_identifier_for_lookup($senderName);

        if ($receiverKey !== '' && isset($summary[$receiverKey])) {
            $summary[$receiverKey]['completed_trials'] += 1;
            $summary[$receiverKey]['distinct_partners'][normalize_identifier_for_lookup($senderName)] = $senderName;
            if ($sortKey !== '' && (($summary[$receiverKey]['_first_sort_key'] ?? '') === '' || strcmp($sortKey, (string) $summary[$receiverKey]['_first_sort_key']) <= 0)) {
                $summary[$receiverKey]['_first_sort_key'] = $sortKey;
                $summary[$receiverKey]['first_activity'] = $dateLabel;
            }
            if ($sortKey !== '' && strcmp($sortKey, (string) ($summary[$receiverKey]['_last_sort_key'] ?? '')) >= 0) {
                $summary[$receiverKey]['_last_sort_key'] = $sortKey;
                $summary[$receiverKey]['last_activity'] = $dateLabel;
            }
        }

        if ($senderKey !== '' && isset($summary[$senderKey])) {
            $summary[$senderKey]['completed_trials'] += 1;
            $summary[$senderKey]['distinct_partners'][normalize_identifier_for_lookup($receiverName)] = $receiverName;
            if ($sortKey !== '' && (($summary[$senderKey]['_first_sort_key'] ?? '') === '' || strcmp($sortKey, (string) $summary[$senderKey]['_first_sort_key']) <= 0)) {
                $summary[$senderKey]['_first_sort_key'] = $sortKey;
                $summary[$senderKey]['first_activity'] = $dateLabel;
            }
            if ($sortKey !== '' && strcmp($sortKey, (string) ($summary[$senderKey]['_last_sort_key'] ?? '')) >= 0) {
                $summary[$senderKey]['_last_sort_key'] = $sortKey;
                $summary[$senderKey]['last_activity'] = $dateLabel;
            }
        }
    }

    $rows = [];
    foreach ($summary as $row) {
        $row['distinct_partners'] = count((array) ($row['distinct_partners'] ?? []));
        unset($row['_first_sort_key'], $row['_last_sort_key']);
        $rows[] = $row;
    }

    usort($rows, static function (array $left, array $right): int {
        return strcasecmp((string) ($left['identity'] ?? ''), (string) ($right['identity'] ?? ''));
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

function read_all_pair_trial_records_with_source(string $pairsDir, string $source): array
{
    $records = read_all_pair_trial_records($pairsDir, $source === 'simulation');
    return array_map(static function (array $record) use ($source): array {
        $record['_report_source'] = $source;
        return $record;
    }, $records);
}

function resolve_pair_source_dir(string $source, string $pairsDir): string
{
    if ($source === 'simulation') {
        return $GLOBALS['simulationPairsDir'] ?? $pairsDir;
    }
    return $pairsDir;
}

function clear_pair_analysis_records(string $pairsDir): void
{
    $paths = glob($pairsDir . DIRECTORY_SEPARATOR . '*.analysis.json') ?: [];
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
        'partner_finished_notice' => null,
        'authorization_notice' => null,
        'session_limit_notice' => null,
        'timeout_notice' => null,
        'timeout_exit' => null,
        'level_four' => default_level_four_session_state(),
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
    if (!array_key_exists('partner_finished_notice', $session)) {
        $session['partner_finished_notice'] = null;
    }
    if (!array_key_exists('authorization_notice', $session)) {
        $session['authorization_notice'] = null;
    }
    if (!array_key_exists('session_limit_notice', $session)) {
        $session['session_limit_notice'] = null;
    }
    if (!array_key_exists('timeout_notice', $session)) {
        $session['timeout_notice'] = null;
    }
    if (!array_key_exists('timeout_exit', $session)) {
        $session['timeout_exit'] = null;
    }
    if (!is_array($session['level_four'] ?? null)) {
        $session['level_four'] = default_level_four_session_state();
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

    $directory = dirname($debugLogFile);
    if ($directory !== '' && !is_dir($directory)) {
        @mkdir($directory, 0770, true);
    }
    if (!file_exists($debugLogFile)) {
        @touch($debugLogFile);
    }
    append_capped_log($debugLogFile, $message, (int) ($GLOBALS['debugLogMaxBytes'] ?? 307200));
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
    $session['partner_finished_notice'] = null;
    $session['post_round'] = null;
    $session['round'] = null;
    $session['receiver']['ready'] = false;
    $session['receiver']['view'] = default_receiver_view();
    clear_authorization_notice($session);
    $session['session_limit_notice'] = null;
    reset_level_four_session($session);
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
    return in_array($level, ['1', '2', '3', '4', '5'], true) ? $level : '1';
}

function get_pair_participants_for_session(array $state, array $session, string $sessionCode): array
{
    $pairDifficulty = is_array($state['pair_difficulties'][$sessionCode] ?? null)
        ? $state['pair_difficulties'][$sessionCode]
        : [];
    $registry = is_array($state['session_registry'][$sessionCode] ?? null)
        ? $state['session_registry'][$sessionCode]
        : [];

    $senderName = trim((string) (
        $pairDifficulty['sender_name']
        ?? $registry['sender_name']
        ?? ($session['sender']['profile']['own_email'] ?? ($session['sender']['profile']['name'] ?? ''))
    ));
    $receiverName = trim((string) (
        $pairDifficulty['receiver_name']
        ?? $registry['receiver_name']
        ?? ($session['receiver']['profile']['own_email'] ?? ($session['receiver']['profile']['name'] ?? ''))
    ));

    return [
        'sender_name' => $senderName,
        'receiver_name' => $receiverName
    ];
}

function validate_pair_difficulty_access(array $state, string $receiverId, string $senderId, string $difficulty): array
{
    $normalizedDifficulty = normalize_difficulty_level($difficulty);
    $receiverType = get_user_type_for_identifier($state, $receiverId);
    $senderType = get_user_type_for_identifier($state, $senderId);
    $robotPair = is_robot_simulation_identifier($receiverId) || is_robot_simulation_identifier($senderId);

    if (in_array($normalizedDifficulty, ['1', '2', '3'], true)) {
        return [
            'allowed' => true,
            'message' => '',
            'difficulty_level' => $normalizedDifficulty,
            'receiver_type' => $receiverType,
            'sender_type' => $senderType
        ];
    }

    if ($normalizedDifficulty === '4') {
        $allowed = $robotPair || $receiverType === 'pro';
        return [
            'allowed' => $allowed,
            'message' => $allowed ? '' : 'Level 4 requires the receiver to be a PRO user.',
            'difficulty_level' => $normalizedDifficulty,
            'receiver_type' => $receiverType,
            'sender_type' => $senderType
        ];
    }

    if ($normalizedDifficulty === '5') {
        $allowed = $receiverType === 'pro' && $senderType === 'pro';
        return [
            'allowed' => $allowed,
            'message' => $allowed ? '' : 'Level 5 requires both participants to be PRO users.',
            'difficulty_level' => $normalizedDifficulty,
            'receiver_type' => $receiverType,
            'sender_type' => $senderType
        ];
    }

    return [
        'allowed' => false,
        'message' => 'That difficulty level is not available.',
        'difficulty_level' => $normalizedDifficulty,
        'receiver_type' => $receiverType,
        'sender_type' => $senderType
    ];
}

function get_pair_max_difficulty_level(array $state, string $receiverId, string $senderId): string
{
    if (is_robot_simulation_identifier($receiverId) || is_robot_simulation_identifier($senderId)) {
        return '4';
    }

    $receiverType = get_user_type_for_identifier($state, $receiverId);
    $senderType = get_user_type_for_identifier($state, $senderId);

    if ($receiverType === 'pro' && $senderType === 'pro') {
        return '5';
    }

    if ($receiverType === 'pro') {
        return '4';
    }

    return '3';
}

function validate_runtime_role_access(array $state, string $receiverId, string $senderId, string $difficulty, string $actingRole): array
{
    $pairValidation = validate_pair_difficulty_access($state, $receiverId, $senderId, $difficulty);
    if (!($pairValidation['allowed'] ?? false)) {
        return $pairValidation;
    }

    $normalizedDifficulty = (string) ($pairValidation['difficulty_level'] ?? normalize_difficulty_level($difficulty));
    $normalizedRole = trim((string) $actingRole);

    if (in_array($normalizedDifficulty, ['1', '2', '3'], true)) {
        return $pairValidation;
    }

    if ($normalizedDifficulty === '4' && $normalizedRole === 'receiver' && (($pairValidation['receiver_type'] ?? 'standard') !== 'pro')) {
        $pairValidation['allowed'] = false;
        $pairValidation['message'] = 'Level 4 requires a PRO receiver for this pair.';
    }

    if ($normalizedDifficulty === '5' && !in_array($normalizedRole, ['sender', 'receiver'], true)) {
        $pairValidation['allowed'] = false;
        $pairValidation['message'] = 'Level 5 requires both participants to be PRO users.';
    }

    return $pairValidation;
}

function clear_authorization_notice(array &$session): void
{
    $session['authorization_notice'] = null;
}

function apply_authorization_stop(array &$session, int $nowMs, string $message): void
{
    $session['authorization_notice'] = [
        'created_ms' => $nowMs,
        'message' => trim($message) !== '' ? trim($message) : 'This session is no longer authorized for the current difficulty. Run ended.'
    ];
    $session['post_round'] = null;
    $session['round'] = null;
    $session['receiver']['ready'] = false;
    $session['receiver']['view'] = default_receiver_view();
    $session['session_limit_notice'] = null;
    $session['timeout_notice'] = null;
    $session['timeout_exit'] = null;
    reset_level_four_session($session);
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

function build_stripe_checkout_session_fields(array $config, string $priceId, string $appUserIdentifier, string $plan): array
{
    return [
        'mode' => 'subscription',
        'success_url' => (string) $config['successUrl'],
        'cancel_url' => (string) $config['cancelUrl'],
        'client_reference_id' => $appUserIdentifier,
        'payment_method_types[0]' => 'card',
        'phone_number_collection[enabled]' => 'false',
        'line_items[0][price]' => $priceId,
        'line_items[0][quantity]' => 1,
        'metadata[app_user_identifier]' => $appUserIdentifier,
        'metadata[plan]' => $plan,
        'subscription_data[metadata][app_user_identifier]' => $appUserIdentifier,
        'subscription_data[metadata][plan]' => $plan
    ];
}

function extract_app_user_identifier_from_stripe_object(array $object): string
{
    $metadata = is_array($object['metadata'] ?? null) ? $object['metadata'] : [];
    $identifier = trim((string) ($metadata['app_user_identifier'] ?? ''));
    if ($identifier !== '') {
        return $identifier;
    }

    return trim((string) ($object['client_reference_id'] ?? ''));
}

function apply_checkout_session_completed_event(array &$state, string $subscriptionEmailLogFile, array $event, int $nowMs): array
{
    $object = is_array($event['data']['object'] ?? null) ? $event['data']['object'] : [];
    $identifier = extract_app_user_identifier_from_stripe_object($object);
    if ($identifier === '') {
        return ['updated' => false, 'message' => 'Stripe event did not include an app user identifier.'];
    }

    $subscriberEmail = extract_stripe_checkout_email($object, $identifier);
    $record = update_stripe_subscription_state_for_identifier($state, $identifier, [
        'customer_id' => trim((string) ($object['customer'] ?? '')),
        'subscription_id' => trim((string) ($object['subscription'] ?? '')),
        'status' => 'active',
        'plan' => normalize_stripe_plan((is_array($object['metadata'] ?? null) ? ($object['metadata']['plan'] ?? '') : '')),
        'checkout_session_id' => trim((string) ($object['id'] ?? '')),
        'subscriber_email' => $subscriberEmail,
        'last_event_id' => trim((string) ($event['id'] ?? ''))
    ], $nowMs);

    $notificationResult = send_stripe_checkout_notifications(
        $state,
        $subscriptionEmailLogFile,
        (string) ($record['identifier'] ?? $identifier),
        trim((string) ($object['id'] ?? '')),
        $nowMs
    );

    return [
        'updated' => true,
        'identifier' => $record['identifier'] ?? $identifier,
        'status' => $record['status'] ?? 'active',
        'subscriber_email' => $subscriberEmail,
        'notifications' => $notificationResult
    ];
}

function apply_subscription_updated_event(array &$state, array $event, int $nowMs): array
{
    $object = is_array($event['data']['object'] ?? null) ? $event['data']['object'] : [];
    $customerId = trim((string) ($object['customer'] ?? ''));
    $subscriptionId = trim((string) ($object['id'] ?? ''));
    $identifier = extract_app_user_identifier_from_stripe_object($object);
    if ($identifier === '') {
        $identifier = find_identifier_for_stripe_reference($state, $customerId, $subscriptionId);
    }
    if ($identifier === '') {
        return ['updated' => false, 'message' => 'No matching app user identifier was found for this subscription event.'];
    }

    $currentPeriodEndUtc = normalize_stripe_timestamp_to_utc($object['current_period_end'] ?? null);
    $record = update_stripe_subscription_state_for_identifier($state, $identifier, [
        'customer_id' => $customerId,
        'subscription_id' => $subscriptionId,
        'status' => trim((string) ($object['status'] ?? '')),
        'plan' => normalize_stripe_plan((is_array($object['metadata'] ?? null) ? ($object['metadata']['plan'] ?? '') : '')),
        'current_period_end_utc' => $currentPeriodEndUtc,
        'last_event_id' => trim((string) ($event['id'] ?? ''))
    ], $nowMs);

    return [
        'updated' => true,
        'identifier' => $record['identifier'] ?? $identifier,
        'status' => $record['status'] ?? ''
    ];
}

function apply_invoice_payment_succeeded_event(array &$state, string $subscriptionEmailLogFile, array $event, int $nowMs): array
{
    $object = is_array($event['data']['object'] ?? null) ? $event['data']['object'] : [];
    $billingReason = trim((string) ($object['billing_reason'] ?? ''));
    $subscriptionId = trim((string) ($object['subscription'] ?? ''));
    $customerId = trim((string) ($object['customer'] ?? ''));
    $identifier = extract_app_user_identifier_from_stripe_object($object);
    if ($identifier === '') {
        $identifier = find_identifier_for_stripe_reference($state, $customerId, $subscriptionId);
    }
    if ($identifier === '') {
        return ['updated' => false, 'message' => 'No matching app user identifier was found for this invoice event.'];
    }

    $record = update_stripe_subscription_state_for_identifier($state, $identifier, [
        'customer_id' => $customerId,
        'subscription_id' => $subscriptionId,
        'status' => 'active',
        'current_period_end_utc' => normalize_stripe_timestamp_to_utc($object['period_end'] ?? null),
        'subscriber_email' => extract_stripe_checkout_email($object, $identifier),
        'last_event_id' => trim((string) ($event['id'] ?? ''))
    ], $nowMs);

    $plan = normalize_stripe_plan((string) ($record['plan'] ?? ''));
    $invoiceId = trim((string) ($object['id'] ?? ''));
    if ($billingReason !== 'subscription_cycle' || $plan !== 'annual') {
        return [
            'updated' => true,
            'identifier' => $record['identifier'] ?? $identifier,
            'status' => $record['status'] ?? 'active',
            'message' => 'Invoice recorded without annual renewal email action.'
        ];
    }

    $alreadyThankedInvoiceId = trim((string) ($record['last_annual_thank_you_invoice_id'] ?? ''));
    if ($invoiceId !== '' && $alreadyThankedInvoiceId === $invoiceId) {
        return [
            'updated' => true,
            'identifier' => $record['identifier'] ?? $identifier,
            'status' => $record['status'] ?? 'active',
            'message' => 'Annual renewal notifications were already sent for this invoice.'
        ];
    }

    $identifierValue = (string) ($record['identifier'] ?? $identifier);
    $subscriberEmail = normalize_stripe_checkout_email($record['subscriber_email'] ?? '');
    $planLabel = format_stripe_plan_label($plan);
    $renewalDateUtc = trim((string) ($record['current_period_end_utc'] ?? ''));
    $thankYouResult = deliver_subscription_email(
        $state,
        $subscriptionEmailLogFile,
        'annual-thank-you',
        $subscriberEmail,
        $identifierValue,
        build_subscription_email_variables($identifierValue, $subscriberEmail, $planLabel, '', $renewalDateUtc),
        $nowMs
    );

    $adminResult = send_subscription_admin_notice(
        $state,
        $subscriptionEmailLogFile,
        'admin-annual-renewal',
        'ESP Gym PRO annual renewal',
        implode("\r\n", [
            'An ESP Gym PRO annual subscription renewed successfully.',
            '',
            'Identifier: ' . $identifierValue,
            'Subscriber email: ' . ($subscriberEmail !== '' ? $subscriberEmail : 'not provided'),
            'Plan: ' . $planLabel,
            'Renewal date UTC: ' . ($renewalDateUtc !== '' ? $renewalDateUtc : 'unknown'),
            'Stripe invoice: ' . ($invoiceId !== '' ? $invoiceId : 'unknown')
        ]),
        $nowMs
    );

    $record['last_annual_thank_you_invoice_id'] = $invoiceId;
    if (!empty($thankYouResult['sent'])) {
        $record['last_annual_thank_you_ms'] = $nowMs;
    }
    if (!empty($adminResult['sent'])) {
        $record['last_annual_admin_notice_ms'] = $nowMs;
    }
    $state['stripe_users'][get_user_storage_key_for_identifier($state, $identifierValue)] = $record;

    return [
        'updated' => true,
        'identifier' => $identifierValue,
        'status' => $record['status'] ?? 'active',
        'renewal_email_sent' => !empty($thankYouResult['sent']),
        'admin_sent' => !empty($adminResult['sent']),
        'message' => trim(implode(' ', array_filter([
            !empty($thankYouResult['message']) ? 'Subscriber: ' . $thankYouResult['message'] : '',
            !empty($adminResult['message']) ? 'Admin: ' . $adminResult['message'] : ''
        ]))) ?: 'Annual renewal processed.'
    ];
}

function scan_subscription_annual_reminders(
    array &$state,
    string $subscriptionEmailLogFile,
    int $nowMs,
    bool $testMode = false,
    int $leadDays = 30
): array {
    ensure_subscription_email_state($state);
    ensure_stripe_state_sections($state);

    if (!$testMode && empty($state['subscription_reminders_enabled'])) {
        return [
            'ok' => true,
            'test_mode' => false,
            'lead_days' => $leadDays,
            'checked' => 0,
            'eligible' => 0,
            'sent' => 0,
            'admin_sent' => 0,
            'skipped' => 0,
            'details' => [],
            'message' => 'Annual subscription reminders are currently disabled.'
        ];
    }

    $leadSeconds = max(1, $leadDays) * 86400;
    $summary = [
        'ok' => true,
        'test_mode' => $testMode,
        'lead_days' => $leadDays,
        'checked' => 0,
        'eligible' => 0,
        'sent' => 0,
        'admin_sent' => 0,
        'skipped' => 0,
        'details' => []
    ];

    foreach ($state['stripe_users'] as $storageKey => $record) {
        if (!is_array($record)) {
            continue;
        }
        $summary['checked']++;

        $identifier = trim((string) ($record['identifier'] ?? ''));
        $status = normalize_stripe_subscription_status($record['status'] ?? '');
        $plan = normalize_stripe_plan($record['plan'] ?? '');
        $subscriberEmail = normalize_stripe_checkout_email($record['subscriber_email'] ?? '');
        $renewalDateUtc = trim((string) ($record['current_period_end_utc'] ?? ''));
        $renewalEpoch = normalize_utc_text_to_epoch($renewalDateUtc);
        $detail = [
            'identifier' => $identifier,
            'subscriber_email' => $subscriberEmail,
            'status' => $status,
            'plan' => $plan,
            'renewal_date_utc' => $renewalDateUtc,
            'result' => 'skipped',
            'message' => ''
        ];

        if ($identifier === '' || !is_stripe_subscription_active_status($status) || $plan !== 'annual' || $subscriberEmail === '' || $renewalEpoch <= 0) {
            $detail['message'] = 'Record is not an active annual subscription with a valid email and renewal date.';
            $summary['skipped']++;
            $summary['details'][] = $detail;
            continue;
        }

        $secondsUntilRenewal = $renewalEpoch - (int) floor($nowMs / 1000);
        $alreadySentForRenewal = trim((string) ($record['last_annual_reminder_target_utc'] ?? '')) === $renewalDateUtc;
        $inWindow = $secondsUntilRenewal >= 0 && $secondsUntilRenewal <= $leadSeconds;

        if (!$testMode && !$inWindow) {
            $detail['message'] = 'Renewal date is not yet inside the annual reminder window.';
            $summary['skipped']++;
            $summary['details'][] = $detail;
            continue;
        }

        if (!$testMode && $alreadySentForRenewal) {
            $detail['message'] = 'Annual reminder was already sent for this renewal date.';
            $summary['skipped']++;
            $summary['details'][] = $detail;
            continue;
        }

        $summary['eligible']++;
        $identifierValue = $identifier;
        $planLabel = format_stripe_plan_label($plan);
        $reminderResult = deliver_subscription_email(
            $state,
            $subscriptionEmailLogFile,
            'annual-reminder',
            $subscriberEmail,
            $identifierValue,
            build_subscription_email_variables($identifierValue, $subscriberEmail, $planLabel, '', $renewalDateUtc),
            $nowMs
        );
        $adminResult = send_subscription_admin_notice(
            $state,
            $subscriptionEmailLogFile,
            $testMode ? 'admin-annual-reminder-test' : 'admin-annual-reminder',
            $testMode ? 'ESP Gym PRO annual reminder test' : 'ESP Gym PRO annual reminder',
            implode("\r\n", [
                $testMode
                    ? 'A test annual reminder email was issued.'
                    : 'An annual reminder email was issued.',
                '',
                'Identifier: ' . $identifierValue,
                'Subscriber email: ' . $subscriberEmail,
                'Renewal date UTC: ' . $renewalDateUtc,
                'Plan: ' . $planLabel
            ]),
            $nowMs
        );

        if (!empty($reminderResult['sent'])) {
            $record['last_annual_reminder_ms'] = $nowMs;
            $record['last_annual_reminder_target_utc'] = $renewalDateUtc;
            $summary['sent']++;
            $detail['result'] = 'sent';
        } else {
            $detail['result'] = 'not-sent';
        }
        if (!empty($adminResult['sent'])) {
            $record['last_annual_reminder_admin_notice_ms'] = $nowMs;
            $summary['admin_sent']++;
        }

        $detail['message'] = trim(implode(' ', array_filter([
            !empty($reminderResult['message']) ? 'Subscriber: ' . $reminderResult['message'] : '',
            !empty($adminResult['message']) ? 'Admin: ' . $adminResult['message'] : ''
        ])));
        $state['stripe_users'][$storageKey] = $record;
        $summary['details'][] = $detail;
    }

    return $summary;
}

function apply_subscription_deleted_event(array &$state, string $subscriptionEmailLogFile, array $event, int $nowMs): array
{
    $object = is_array($event['data']['object'] ?? null) ? $event['data']['object'] : [];
    $customerId = trim((string) ($object['customer'] ?? ''));
    $subscriptionId = trim((string) ($object['id'] ?? ''));
    $identifier = extract_app_user_identifier_from_stripe_object($object);
    if ($identifier === '') {
        $identifier = find_identifier_for_stripe_reference($state, $customerId, $subscriptionId);
    }
    if ($identifier === '') {
        return ['updated' => false, 'message' => 'No matching app user identifier was found for this deleted subscription.'];
    }

    $record = update_stripe_subscription_state_for_identifier($state, $identifier, [
        'customer_id' => $customerId,
        'subscription_id' => $subscriptionId,
        'status' => 'canceled',
        'plan' => normalize_stripe_plan((is_array($object['metadata'] ?? null) ? ($object['metadata']['plan'] ?? '') : '')),
        'current_period_end_utc' => normalize_stripe_timestamp_to_utc($object['current_period_end'] ?? null),
        'last_event_id' => trim((string) ($event['id'] ?? ''))
    ], $nowMs);

    $identifierValue = (string) ($record['identifier'] ?? $identifier);
    $subscriberEmail = normalize_stripe_checkout_email($record['subscriber_email'] ?? '');
    $planLabel = format_stripe_plan_label((string) ($record['plan'] ?? ''));
    $renewalDateUtc = trim((string) ($record['current_period_end_utc'] ?? ''));
    $cancellationResult = deliver_subscription_email(
        $state,
        $subscriptionEmailLogFile,
        'cancellation',
        $subscriberEmail,
        $identifierValue,
        build_subscription_email_variables($identifierValue, $subscriberEmail, $planLabel, '', $renewalDateUtc),
        $nowMs
    );
    $adminResult = send_subscription_admin_notice(
        $state,
        $subscriptionEmailLogFile,
        'admin-subscription-cancellation',
        'ESP Gym PRO subscription cancellation',
        implode("\r\n", [
            'An ESP Gym PRO subscription was cancelled.',
            '',
            'Identifier: ' . $identifierValue,
            'Subscriber email: ' . ($subscriberEmail !== '' ? $subscriberEmail : 'not provided'),
            'Plan: ' . $planLabel,
            'Current period end UTC: ' . ($renewalDateUtc !== '' ? $renewalDateUtc : 'unknown'),
            'Stripe subscription: ' . ($subscriptionId !== '' ? $subscriptionId : 'unknown')
        ]),
        $nowMs
    );

    if (!empty($cancellationResult['sent'])) {
        $record['last_cancellation_email_ms'] = $nowMs;
    }
    if (!empty($adminResult['sent'])) {
        $record['last_cancellation_admin_notice_ms'] = $nowMs;
    }
    $state['stripe_users'][get_user_storage_key_for_identifier($state, $identifierValue)] = $record;

    return [
        'updated' => true,
        'identifier' => $identifierValue,
        'status' => $record['status'] ?? 'canceled',
        'cancellation_email_sent' => !empty($cancellationResult['sent']),
        'admin_sent' => !empty($adminResult['sent']),
        'message' => trim(implode(' ', array_filter([
            !empty($cancellationResult['message']) ? 'Subscriber: ' . $cancellationResult['message'] : '',
            !empty($adminResult['message']) ? 'Admin: ' . $adminResult['message'] : ''
        ]))) ?: 'Subscription cancellation processed.'
    ];
}

$rawRequestBody = file_get_contents('php://input');
$input = json_decode($rawRequestBody ?: '{}', true);
if (!is_array($input)) {
    $input = [];
}

$action = isset($input['action'])
    ? (string) $input['action']
    : (isset($_GET['action']) ? (string) $_GET['action'] : 'heartbeat');
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
        'unique_handles' => [],
        'identifier_aliases' => [],
        'user_types' => [],
        'level_four_receiver_pools' => [],
        'push_subscriptions' => [],
        'partner_message_threads' => [],
        'partner_message_reads' => [],
        'esp_lessons' => [],
        'invitees' => [],
        'email_list' => [],
        'retired_handles' => [],
        'handle_owners' => [],
        'explore_pro_verifications' => [],
        'explore_pro_trials' => [],
        'stripe_users' => [],
        'stripe_customer_index' => [],
        'stripe_subscription_index' => [],
        'stripe_processed_events' => [],
        'launcher_visit_count' => 0,
        'debug_enabled' => false,
        'subscription_emails_enabled' => false,
        'subscription_reminders_enabled' => false,
        'easy_admin_enabled' => false,
        'learn_more_save_enabled' => false,
        'explore_pro_test_duration_seconds' => 0,
        'trial_mode_public_enabled' => false,
        'subscription_email_templates' => default_subscription_email_templates()
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
        'unique_handles' => [],
        'identifier_aliases' => [],
        'user_types' => [],
        'level_four_receiver_pools' => [],
        'push_subscriptions' => [],
        'partner_message_threads' => [],
        'partner_message_reads' => [],
        'esp_lessons' => [],
        'invitees' => [],
        'email_list' => [],
        'retired_handles' => [],
        'handle_owners' => [],
        'explore_pro_verifications' => [],
        'explore_pro_trials' => [],
        'stripe_users' => [],
        'stripe_customer_index' => [],
        'stripe_subscription_index' => [],
        'stripe_processed_events' => [],
        'launcher_visit_count' => 0,
        'debug_enabled' => false,
        'subscription_emails_enabled' => false,
        'subscription_reminders_enabled' => false,
        'easy_admin_enabled' => false,
        'learn_more_save_enabled' => false,
        'explore_pro_test_duration_seconds' => 0,
        'trial_mode_public_enabled' => false,
        'subscription_email_templates' => default_subscription_email_templates()
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
if (!is_array($state['push_subscriptions'] ?? null)) {
    $state['push_subscriptions'] = [];
}
if (!is_array($state['partner_message_threads'] ?? null)) {
    $state['partner_message_threads'] = [];
}
if (!is_array($state['partner_message_reads'] ?? null)) {
    $state['partner_message_reads'] = [];
}
if (!is_array($state['invitees'] ?? null)) {
    $state['invitees'] = [];
}
ensure_email_list_state($state);
if (!is_array($state['unique_handles'] ?? null)) {
    $state['unique_handles'] = [];
}
if (!is_array($state['identifier_aliases'] ?? null)) {
    $state['identifier_aliases'] = [];
}
if (!is_array($state['user_types'] ?? null)) {
    $state['user_types'] = [];
}
if (!is_array($state['level_four_receiver_pools'] ?? null)) {
    $state['level_four_receiver_pools'] = [];
}
if (!isset($state['launcher_visit_count']) || !is_numeric($state['launcher_visit_count'])) {
    $state['launcher_visit_count'] = 0;
}
if (!is_array($state['retired_handles'] ?? null)) {
    $state['retired_handles'] = [];
}
if (!is_array($state['handle_owners'] ?? null)) {
    $state['handle_owners'] = [];
}
ensure_explore_pro_state($state);
ensure_stripe_state_sections($state);
prune_stripe_processed_events($state, $nowMs);
if (!array_key_exists('debug_enabled', $state)) {
    $state['debug_enabled'] = false;
}
if (!array_key_exists('easy_admin_enabled', $state)) {
    $state['easy_admin_enabled'] = false;
}
if (!array_key_exists('learn_more_save_enabled', $state)) {
    $state['learn_more_save_enabled'] = false;
}
if (!array_key_exists('trial_mode_public_enabled', $state)) {
    $state['trial_mode_public_enabled'] = false;
}
ensure_subscription_email_state($state);
ensure_invitee_state($state);

$normalizedPushSubscriptions = [];
foreach ((array) ($state['push_subscriptions'] ?? []) as $entry) {
    if (!is_array($entry)) {
        continue;
    }
    $normalizedEntry = normalize_push_subscription_record($entry);
    if ($normalizedEntry['identifier'] === '' || $normalizedEntry['device_id'] === '' || $normalizedEntry['endpoint'] === '') {
        continue;
    }
    $normalizedPushSubscriptions[build_push_registration_key($normalizedEntry['device_id'], $normalizedEntry['endpoint'])] = $normalizedEntry;
}
$state['push_subscriptions'] = $normalizedPushSubscriptions;

$normalizedPartnerThreads = [];
foreach ((array) ($state['partner_message_threads'] ?? []) as $entry) {
    if (!is_array($entry)) {
        continue;
    }
    $normalizedThread = normalize_partner_message_thread($entry);
    $left = trim((string) ($normalizedThread['participants'][0] ?? ''));
    $right = trim((string) ($normalizedThread['participants'][1] ?? ''));
    if ($left === '' || $right === '') {
        continue;
    }
    $normalizedPartnerThreads[build_partner_message_thread_key($left, $right)] = $normalizedThread;
}
$state['partner_message_threads'] = $normalizedPartnerThreads;

$normalizedPartnerReads = [];
foreach ((array) ($state['partner_message_reads'] ?? []) as $entry) {
    if (!is_array($entry)) {
        continue;
    }
    $normalizedRead = normalize_partner_message_read_entry($entry);
    if ($normalizedRead['owner_identifier'] === '' || $normalizedRead['partner_identifier'] === '') {
        continue;
    }
    $normalizedPartnerReads[build_partner_message_read_key($normalizedRead['owner_identifier'], $normalizedRead['partner_identifier'])] = $normalizedRead;
}
$state['partner_message_reads'] = $normalizedPartnerReads;

$normalizedInvitees = [];
foreach ((array) ($state['invitees'] ?? []) as $inviteeKey => $entry) {
    if (!is_array($entry)) {
        continue;
    }
    $normalized = normalize_invitee_record((string) $inviteeKey, $entry);
    if ($normalized['identifier'] === '' || !is_valid_handle_identifier($normalized['identifier'])) {
        continue;
    }
    $normalizedInvitees[canonicalize_handle($normalized['identifier'])] = $normalized;
}
$state['invitees'] = $normalizedInvitees;

foreach ($state['unique_handles'] as $existingHandleKey => $entry) {
    if (!is_array($entry)) {
        unset($state['unique_handles'][$existingHandleKey]);
        continue;
    }

    $handleText = trim((string) ($entry['handle'] ?? ''));
    $canonicalHandle = canonicalize_handle((string) ($entry['canonical_handle'] ?? ($handleText !== '' ? $handleText : $existingHandleKey)));
    if ($canonicalHandle === '') {
        unset($state['unique_handles'][$existingHandleKey]);
        continue;
    }

    $ownerIdentifier = trim((string) ($entry['owner_identifier'] ?? $handleText));
    if ($ownerIdentifier === '') {
        $ownerIdentifier = $handleText !== '' ? $handleText : $canonicalHandle;
    }

    $normalizedEntry = [
        'handle' => $handleText !== '' ? $handleText : $canonicalHandle,
        'canonical_handle' => $canonicalHandle,
        'owner_identifier' => $ownerIdentifier,
        'created_ms' => isset($entry['created_ms']) && is_numeric($entry['created_ms'])
            ? (int) $entry['created_ms']
            : (isset($entry['updated_ms']) && is_numeric($entry['updated_ms']) ? (int) $entry['updated_ms'] : $nowMs),
        'updated_ms' => isset($entry['updated_ms']) && is_numeric($entry['updated_ms']) ? (int) $entry['updated_ms'] : $nowMs
    ];

    if ($canonicalHandle !== $existingHandleKey) {
        unset($state['unique_handles'][$existingHandleKey]);
    }
    $state['unique_handles'][$canonicalHandle] = $normalizedEntry;

    $ownerRecord = get_or_create_handle_owner_record($state, $ownerIdentifier, $nowMs);
    $ownerRecord['owner_identifier'] = $ownerIdentifier;
    if (trim((string) ($ownerRecord['current_handle'] ?? '')) === '') {
        $ownerRecord['current_handle'] = $normalizedEntry['handle'];
    }
    if (trim((string) ($ownerRecord['current_canonical_handle'] ?? '')) === '') {
        $ownerRecord['current_canonical_handle'] = $canonicalHandle;
    }
    if ((int) ($ownerRecord['first_claimed_ms'] ?? 0) <= 0) {
        $ownerRecord['first_claimed_ms'] = (int) $normalizedEntry['created_ms'];
    }
    if ((int) ($ownerRecord['lifetime_claim_count'] ?? 0) <= 0) {
        $ownerRecord['lifetime_claim_count'] = 1;
    }
    $ownerRecord['updated_ms'] = max((int) ($ownerRecord['updated_ms'] ?? 0), (int) $normalizedEntry['updated_ms']);
    $state['handle_owners'][get_handle_owner_key($ownerIdentifier)] = $ownerRecord;
}

$normalizedRetiredHandles = [];
foreach ($state['retired_handles'] as $retiredKey => $entry) {
    if (!is_array($entry)) {
        continue;
    }

    $handleText = trim((string) ($entry['handle'] ?? ''));
    $canonicalHandle = canonicalize_handle((string) ($entry['canonical_handle'] ?? ($handleText !== '' ? $handleText : $retiredKey)));
    if ($canonicalHandle === '') {
        continue;
    }

    $ownerIdentifier = trim((string) ($entry['owner_identifier'] ?? $handleText));
    $normalizedRetiredHandles[$canonicalHandle] = [
        'handle' => $handleText !== '' ? $handleText : $canonicalHandle,
        'canonical_handle' => $canonicalHandle,
        'owner_identifier' => $ownerIdentifier,
        'retired_ms' => isset($entry['retired_ms']) && is_numeric($entry['retired_ms']) ? (int) $entry['retired_ms'] : $nowMs
    ];

    $ownerKey = get_handle_owner_key($ownerIdentifier);
    if ($ownerKey !== '') {
        $ownerRecord = get_or_create_handle_owner_record($state, $ownerIdentifier, $nowMs);
        $retiredList = is_array($ownerRecord['retired_handles'] ?? null) ? $ownerRecord['retired_handles'] : [];
        if (!in_array($canonicalHandle, $retiredList, true)) {
            $retiredList[] = $canonicalHandle;
        }
        $ownerRecord['retired_handles'] = array_values(array_unique($retiredList));
        $state['handle_owners'][$ownerKey] = $ownerRecord;
    }
}
$state['retired_handles'] = $normalizedRetiredHandles;

prune_inactive_operational_state($state, $nowMs, $sessionRetentionMs);
prune_anonymous_visitor_simulation_records($simulationPairsDir, $nowMs, $visitorSimulationRetentionMs);

if (!array_key_exists($sessionCode, $state['sessions']) || !is_array($state['sessions'][$sessionCode])) {
    $state['sessions'][$sessionCode] = default_session_state();
}

ensure_session_shape($state['sessions'][$sessionCode]);
$session =& $state['sessions'][$sessionCode];
$debugEnabled = (bool) $state['debug_enabled'];
$profileInput = isset($input['profile']) && is_array($input['profile']) ? normalize_profile($input['profile']) : default_profile();
$secretCandidate = isset($input['secret_candidate']) ? (string) $input['secret_candidate'] : '';
$isAdmin = is_admin_profile($profileInput, $adminSecret) || is_admin_secret_candidate($secretCandidate, $adminSecret);
$easyAdminEnabled = !empty($state['easy_admin_enabled']);
$hasAdminAccess = $isAdmin || $easyAdminEnabled;
$trialRecordAppendResult = null;

$existingRegistry = is_array($state['session_registry'][$sessionCode] ?? null)
    ? $state['session_registry'][$sessionCode]
    : [];
$existingPairDifficulty = is_array($state['pair_difficulties'][$sessionCode] ?? null)
    ? $state['pair_difficulties'][$sessionCode]
    : [];
$state['session_registry'][$sessionCode] = [
    'updated_ms' => $nowMs,
    'sender_name' => $existingRegistry['sender_name'] ?? ($session['sender']['profile']['own_email'] ?? ($session['sender']['profile']['name'] ?? '')),
    'receiver_name' => $existingRegistry['receiver_name'] ?? ($session['receiver']['profile']['own_email'] ?? ($session['receiver']['profile']['name'] ?? ''))
];
$state['pair_difficulties'][$sessionCode] = [
    'updated_ms' => isset($existingPairDifficulty['updated_ms']) && is_numeric($existingPairDifficulty['updated_ms'])
        ? (int) $existingPairDifficulty['updated_ms']
        : $nowMs,
    'sender_name' => trim((string) ($existingPairDifficulty['sender_name'] ?? ($state['session_registry'][$sessionCode]['sender_name'] ?? ''))),
    'receiver_name' => trim((string) ($existingPairDifficulty['receiver_name'] ?? ($state['session_registry'][$sessionCode]['receiver_name'] ?? ''))),
    'difficulty_level' => normalize_difficulty_level($existingPairDifficulty['difficulty_level'] ?? ($existingRegistry['difficulty_level'] ?? '1'))
];
$pairParticipants = get_pair_participants_for_session($state, $session, $sessionCode);
$runtimeAuthorizationFailure = null;
$runtimeAuthorizationActions = [
    'heartbeat',
    'start_round',
    'complete_round',
    'submit_guess',
    'post_round_choice',
    'clear_post_round'
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

if (in_array($action, $runtimeAuthorizationActions, true) && in_array($role, ['sender', 'receiver'], true)) {
    $runtimeAuthorizationResult = validate_runtime_role_access(
        $state,
        $pairParticipants['receiver_name'] ?? '',
        $pairParticipants['sender_name'] ?? '',
        (string) ($state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1'),
        $role
    );

    if (!($runtimeAuthorizationResult['allowed'] ?? false)) {
        $runtimeAuthorizationFailure = $runtimeAuthorizationResult;
        apply_authorization_stop(
            $session,
            $nowMs,
            (string) ($runtimeAuthorizationFailure['message'] ?? 'This session is no longer authorized for the current difficulty. Run ended.')
        );
        append_debug_log(
            $debugLogFile,
            $debugEnabled,
            json_encode([
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => $role,
                'label' => 'authorization_stop',
                'details' => [
                    'action' => $action,
                    'difficulty_level' => $state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1',
                    'receiver_name' => $pairParticipants['receiver_name'] ?? '',
                    'sender_name' => $pairParticipants['sender_name'] ?? '',
                    'receiver_type' => $runtimeAuthorizationFailure['receiver_type'] ?? 'standard',
                    'sender_type' => $runtimeAuthorizationFailure['sender_type'] ?? 'standard',
                    'message' => $runtimeAuthorizationFailure['message'] ?? ''
                ]
            ], JSON_UNESCAPED_SLASHES)
        );
    } else {
        $runtimeAuthorizationFailure = null;
        clear_authorization_notice($session);
    }
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

$state['session_registry'][$sessionCode]['sender_name'] = $session['sender']['profile']['own_email'] ?? ($session['sender']['profile']['name'] ?? '');
$state['session_registry'][$sessionCode]['receiver_name'] = $session['receiver']['profile']['own_email'] ?? ($session['receiver']['profile']['name'] ?? '');
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

if ($action === 'set_debug_enabled' && $hasAdminAccess) {
    $state['debug_enabled'] = !empty($input['enabled']);
    $debugEnabled = (bool) $state['debug_enabled'];
    $debugMessage = json_encode([
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'set_debug_enabled',
        'details' => [
            'enabled' => $debugEnabled,
            'frontend_build_version' => isset($input['frontend_build_version']) ? (string) $input['frontend_build_version'] : ''
        ]
    ], JSON_UNESCAPED_SLASHES);
    append_debug_log($debugLogFile, $debugEnabled, $debugMessage);
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'set_debug_enabled',
        'details' => [
            'enabled' => $debugEnabled,
            'frontend_build_version' => isset($input['frontend_build_version']) ? (string) $input['frontend_build_version'] : ''
        ]
    ]);
}

if ($action === 'set_subscription_emails_enabled' && $hasAdminAccess) {
    $state['subscription_emails_enabled'] = !empty($input['enabled']);
}

if ($action === 'set_subscription_reminders_enabled' && $hasAdminAccess) {
    $state['subscription_reminders_enabled'] = !empty($input['enabled']);
}

if ($action === 'set_easy_admin_enabled' && $hasAdminAccess) {
    $state['easy_admin_enabled'] = !empty($input['enabled']);
    $easyAdminEnabled = !empty($state['easy_admin_enabled']);
    $hasAdminAccess = $isAdmin || $easyAdminEnabled;
}

if ($action === 'set_learn_more_save_enabled' && $hasAdminAccess) {
    $state['learn_more_save_enabled'] = !empty($input['enabled']);
}

if ($action === 'set_explore_pro_test_duration_seconds' && $hasAdminAccess) {
    $seconds = max(0, (int) ($input['seconds'] ?? 0));
    $state['explore_pro_test_duration_seconds'] = $seconds;
}

if ($action === 'set_trial_mode_public_enabled' && $hasAdminAccess) {
    $state['trial_mode_public_enabled'] = !empty($input['enabled']);
}

if ($action === 'record_launcher_visit') {
    $state['launcher_visit_count'] = max(0, (int) ($state['launcher_visit_count'] ?? 0)) + 1;
}

if ($action === 'save_subscription_email_template' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'secret_candidate', 'template_key', 'subject', 'body'], 'request');
        $templateKey = normalize_subscription_email_template_key($input['template_key'] ?? '');
        $subject = trim((string) ($input['subject'] ?? ''));
        $body = trim((string) ($input['body'] ?? ''));
        if ($templateKey === '') {
            throw new RuntimeException('Template key is invalid.');
        }
        if ($subject === '' || $body === '') {
            throw new RuntimeException('Template subject and body are required.');
        }
        ensure_subscription_email_state($state);
        $state['subscription_email_templates'][$templateKey]['subject'] = $subject;
        $state['subscription_email_templates'][$templateKey]['body'] = $body;
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }
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

if ($action === 'get_admin_access_mode') {
    $response = [
        'ok' => true,
        'easy_admin_enabled' => !empty($state['easy_admin_enabled']),
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

if ($action === 'get_public_trial_mode') {
    $response = [
        'ok' => true,
        'trial_mode_public_enabled' => !empty($state['trial_mode_public_enabled'])
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

if ($action === 'get_learn_more_content') {
    try {
        require_allowed_keys($input, ['action', 'content_key'], 'request');
        $contentKey = normalize_learn_more_content_key($input['content_key'] ?? '');
        $path = get_learn_more_content_path($contentKey);
        if ($contentKey === '' || $path === '') {
            throw new RuntimeException('Learn More content key is invalid.');
        }
        ensure_learn_more_content_seeded($contentKey);
        $contentRecord = read_learn_more_content_file($path);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'learn_more_content' => [
            'content_key' => $contentKey,
            'available' => !empty($contentRecord['available']),
            'content' => (string) ($contentRecord['content'] ?? ''),
            'path' => (string) ($contentRecord['path'] ?? '')
        ],
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

if ($action === 'get_questionnaire_response') {
    try {
        require_allowed_keys($input, ['action', 'questionnaire_type', 'identifier', 'receiver', 'sender'], 'request');
        $questionnaireType = normalize_questionnaire_type($input['questionnaire_type'] ?? '');
        $identifier = normalize_questionnaire_identifier_value($input['identifier'] ?? '');
        $receiver = normalize_questionnaire_identifier_value($input['receiver'] ?? '');
        $sender = normalize_questionnaire_identifier_value($input['sender'] ?? '');
        $path = build_questionnaire_response_path($questionnaireType, $identifier, $receiver, $sender);
        if ($questionnaireType === '' || $identifier === '' || $path === '') {
            throw new RuntimeException('Questionnaire request is invalid.');
        }
        $record = read_questionnaire_response_file($path);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'questionnaire_response' => [
            'questionnaire_type' => $questionnaireType,
            'identifier' => $identifier,
            'receiver' => $receiver,
            'sender' => $sender,
            'available' => !empty($record['available']),
            'response' => is_array($record['response'] ?? null) ? $record['response'] : null,
            'path' => (string) ($record['path'] ?? '')
        ],
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

if ($action === 'save_questionnaire_response') {
    try {
        require_allowed_keys($input, ['action', 'questionnaire_type', 'identifier', 'receiver', 'sender', 'response'], 'request');
        $questionnaireType = normalize_questionnaire_type($input['questionnaire_type'] ?? '');
        $identifier = normalize_questionnaire_identifier_value($input['identifier'] ?? '');
        $receiver = normalize_questionnaire_identifier_value($input['receiver'] ?? '');
        $sender = normalize_questionnaire_identifier_value($input['sender'] ?? '');
        $payload = $input['response'] ?? null;
        $path = build_questionnaire_response_path($questionnaireType, $identifier, $receiver, $sender);
        if ($questionnaireType === '' || $identifier === '' || $path === '') {
            throw new RuntimeException('Questionnaire request is invalid.');
        }
        if (!is_array($payload)) {
            throw new RuntimeException('Questionnaire response payload is invalid.');
        }
        write_questionnaire_response_file($path, $payload);
        $record = read_questionnaire_response_file($path);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'questionnaire_response' => [
            'questionnaire_type' => $questionnaireType,
            'identifier' => $identifier,
            'receiver' => $receiver,
            'sender' => $sender,
            'available' => !empty($record['available']),
            'response' => is_array($record['response'] ?? null) ? $record['response'] : null,
            'path' => (string) ($record['path'] ?? '')
        ],
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

if ($action === 'list_learning_center_lessons') {
    try {
        require_allowed_keys($input, ['action'], 'request');
        $outline = load_learning_center_outline();
        $lessonRows = [];
        foreach ((array) ($outline['rows'] ?? []) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $lessonId = normalize_learning_center_outline_id($row['id'] ?? '');
            $displayNumber = trim((string) ($row['display_number'] ?? ''));
            $title = trim((string) ($row['title'] ?? ''));
            $subcopy = trim((string) ($row['subcopy'] ?? ''));
            $type = normalize_learning_center_outline_type($row['type'] ?? '');
            if ($lessonId === '' || $displayNumber === '' || $title === '') {
                continue;
            }
            $contentKey = $type === 'lesson-page' ? 'lesson-id:' . $lessonId : '';
            $available = $type !== 'lesson-page' || is_file(get_learn_more_content_path($contentKey));
            $lessonRows[] = [
                'lesson_id' => $lessonId,
                'display_number' => $displayNumber,
                'title' => $title,
                'subcopy' => $subcopy,
                'type' => $type,
                'content_key' => $contentKey,
                'available' => $available
            ];
        }
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'learning_center_lessons' => $lessonRows,
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

if ($action === 'save_learn_more_content') {
    if (!$hasAdminAccess && empty($state['learn_more_save_enabled'])) {
        fail_request($handle, $nowMs, 'Learn More saving is currently disabled.', 403);
    }
    try {
        require_allowed_keys($input, ['action', 'secret_candidate', 'content_key', 'content'], 'request');
        $contentKey = normalize_learn_more_content_key($input['content_key'] ?? '');
        $path = get_learn_more_content_path($contentKey);
        $mirrorPath = get_learn_more_repo_content_path($contentKey);
        $content = isset($input['content']) ? (string) $input['content'] : '';
        if ($contentKey === '' || $path === '' || $mirrorPath === '') {
            throw new RuntimeException('Learn More content key is invalid.');
        }
        ensure_learn_more_content_seeded($contentKey);
        write_learn_more_content_file($path, $content, $mirrorPath);
        $contentRecord = read_learn_more_content_file($path);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'learn_more_content' => [
            'content_key' => $contentKey,
            'available' => !empty($contentRecord['available']),
            'content' => (string) ($contentRecord['content'] ?? ''),
            'path' => (string) ($contentRecord['path'] ?? '')
        ],
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

if ($action === 'delete_learn_more_content') {
    if (!$hasAdminAccess) {
        fail_request($handle, $nowMs, 'Administrative access is required.', 403);
    }
    try {
        require_allowed_keys($input, ['action', 'secret_candidate', 'content_key'], 'request');
        $contentKey = normalize_learn_more_content_key($input['content_key'] ?? '');
        $path = get_learn_more_content_path($contentKey);
        $mirrorPath = get_learn_more_repo_content_path($contentKey);
        if (!preg_match('/^lesson-\d{1,4}$|^lesson-id:[a-z0-9-]{1,80}$/', $contentKey)) {
            throw new RuntimeException('Only lesson-page content can be deleted from this control.');
        }
        if ($contentKey === '' || $path === '' || $mirrorPath === '') {
            throw new RuntimeException('Learn More content key is invalid.');
        }
        $deleted = false;
        if (is_file($path)) {
            $deleted = @unlink($path) || $deleted;
        }
        if ($mirrorPath !== '' && is_file($mirrorPath)) {
            $deleted = @unlink($mirrorPath) || $deleted;
        }
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'content_key' => $contentKey,
        'deleted' => $deleted,
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

if ($action === 'get_launcher_profile') {
    try {
        require_allowed_keys($input, ['action', 'launcher_role', 'own_email'], 'request');
        $launcherRole = validate_role_value($input['launcher_role'] ?? '');
        $ownEmail = validate_participant_identifier_string($input['own_email'] ?? '', 'own_email', true);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }
    $response = [
        'ok' => true,
        'launcher_profile' => get_launcher_profile_entry($state, $launcherRole, $ownEmail),
        'user_type' => get_user_type_for_identifier($state, $ownEmail),
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

if ($action === 'run_subscription_reminder_scan' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'secret_candidate', 'test_mode'], 'request');
        $scanResult = scan_subscription_annual_reminders(
            $state,
            $subscriptionEmailLogFile,
            $nowMs,
            !empty($input['test_mode']),
            30
        );
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'reminder_scan' => $scanResult,
        'subscription_email_log' => read_subscription_email_log($subscriptionEmailLogFile),
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

if ($action === 'get_identifier_status') {
    try {
        require_allowed_keys($input, ['action', 'identifier'], 'request');
        $identifier = validate_participant_identifier_string($input['identifier'] ?? '', 'identifier', true);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'identifier_status' => get_identifier_status($state, $identifier),
        'identifier_exists' => participant_identifier_exists($state, $pairsDir, $identifier),
        'user_type' => get_user_type_for_identifier($state, $identifier),
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

if ($action === 'send_explore_pro_verification_code') {
    try {
        require_allowed_keys($input, ['action', 'email'], 'request');
        $verification = send_explore_pro_verification_code($state, (string) ($input['email'] ?? ''), $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'verification' => $verification,
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

if ($action === 'verify_explore_pro_code') {
    try {
        require_allowed_keys($input, ['action', 'email', 'code'], 'request');
        $trialActivation = begin_explore_pro_trial_from_code(
            $state,
            $pairsDir,
            (string) ($input['email'] ?? ''),
            (string) ($input['code'] ?? ''),
            $nowMs
        );
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $identifier = (string) ($trialActivation['identifier'] ?? '');
    $response = [
        'ok' => true,
        'trial_activation' => $trialActivation,
        'temporary_identity' => [
            'identifier' => $identifier,
            'user_type' => 'pro',
            'created_ms' => (int) ($trialActivation['started_ms'] ?? $nowMs)
        ],
        'identifier_status' => $identifier !== '' ? get_identifier_status($state, $identifier) : null,
        'user_type' => $identifier !== '' ? get_user_type_for_identifier($state, $identifier) : 'standard',
        'explore_trial' => $identifier !== '' ? get_explore_pro_trial_status_for_identifier($state, $identifier, $nowMs) : null,
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

if ($action === 'create_temporary_identity') {
    try {
        require_allowed_keys($input, ['action', 'user_type'], 'request');
        $temporaryIdentity = create_temporary_identifier($state, $pairsDir, (string) ($input['user_type'] ?? 'standard'), $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $identifier = (string) ($temporaryIdentity['identifier'] ?? '');
    $response = [
        'ok' => true,
        'temporary_identity' => $temporaryIdentity,
        'identifier_status' => $identifier !== '' ? get_identifier_status($state, $identifier) : null,
        'user_type' => $identifier !== '' ? get_user_type_for_identifier($state, $identifier) : 'standard',
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

if ($action === 'claim_unique_handle') {
    try {
        require_allowed_keys($input, ['action', 'current_identifier', 'proposed_handle'], 'request');
        $currentIdentifier = validate_participant_identifier_string($input['current_identifier'] ?? '', 'current_identifier', false);
        $proposedHandle = trim((string) ($input['proposed_handle'] ?? ''));
        $claimResult = claim_unique_handle($state, $currentIdentifier, $proposedHandle, $nowMs);
        foreach (($claimResult['previous_identifiers'] ?? []) as $previousIdentifier) {
            migrate_identifier_history_in_pair_storage($pairsDir, (string) $previousIdentifier, (string) ($claimResult['handle'] ?? ''));
            migrate_identifier_in_partner_messaging_state($state, (string) $previousIdentifier, (string) ($claimResult['handle'] ?? ''));
            migrate_explore_pro_trial_identifier($state, (string) $previousIdentifier, (string) ($claimResult['handle'] ?? ''));
        }
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'unique_handle' => $claimResult,
        'identifier_status' => get_identifier_status($state, (string) ($claimResult['handle'] ?? '')),
        'user_type' => get_user_type_for_identifier($state, (string) ($claimResult['handle'] ?? '')),
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

if ($action === 'get_user_type') {
    try {
        require_allowed_keys($input, ['action', 'identifier'], 'request');
        $identifier = validate_participant_identifier_string($input['identifier'] ?? '', 'identifier', true);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $exploreTrial = get_explore_pro_trial_status_for_identifier($state, $identifier, $nowMs);
    $response = [
        'ok' => true,
        'identifier_status' => get_identifier_status($state, $identifier),
        'identifier_exists' => participant_identifier_exists($state, $pairsDir, $identifier),
        'user_type' => get_user_type_for_identifier($state, $identifier),
        'explore_trial' => $exploreTrial,
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

if ($action === 'get_esp_lesson_state') {
    try {
        require_allowed_keys($input, ['action', 'identifier', 'lesson_ids'], 'request');
        $identifier = validate_participant_identifier_string($input['identifier'] ?? '', 'identifier', true);
        $lessonIds = validate_esp_lesson_ids($input['lesson_ids'] ?? [], 'lesson_ids');
        $lessonRecord = get_esp_lesson_progress_record($state, $identifier, $lessonIds, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'identifier_status' => get_identifier_status($state, $identifier),
        'esp_lesson_state' => [
            'current_lesson_id' => (string) ($lessonRecord['current_cycle_queue'][0] ?? ''),
            'current_cycle_queue' => array_values($lessonRecord['current_cycle_queue'] ?? []),
            'dismissed_ids' => array_values($lessonRecord['dismissed_ids'] ?? []),
            'seen_in_cycle_ids' => array_values($lessonRecord['seen_in_cycle_ids'] ?? []),
            'updated_ms' => (int) ($lessonRecord['updated_ms'] ?? $nowMs)
        ],
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

if ($action === 'advance_esp_lesson_state') {
    try {
        require_allowed_keys($input, ['action', 'identifier', 'lesson_ids', 'command', 'current_lesson_id'], 'request');
        $identifier = validate_participant_identifier_string($input['identifier'] ?? '', 'identifier', true);
        $lessonIds = validate_esp_lesson_ids($input['lesson_ids'] ?? [], 'lesson_ids');
        $command = strtolower(trim((string) ($input['command'] ?? '')));
        $currentLessonId = normalize_esp_lesson_id($input['current_lesson_id'] ?? '');
        $lessonRecord = advance_esp_lesson_progress_record($state, $identifier, $lessonIds, $command, $currentLessonId, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'identifier_status' => get_identifier_status($state, $identifier),
        'esp_lesson_state' => [
            'current_lesson_id' => (string) ($lessonRecord['current_cycle_queue'][0] ?? ''),
            'current_cycle_queue' => array_values($lessonRecord['current_cycle_queue'] ?? []),
            'dismissed_ids' => array_values($lessonRecord['dismissed_ids'] ?? []),
            'seen_in_cycle_ids' => array_values($lessonRecord['seen_in_cycle_ids'] ?? []),
            'updated_ms' => (int) ($lessonRecord['updated_ms'] ?? $nowMs)
        ],
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

if ($action === 'get_push_setup') {
    try {
        require_allowed_keys($input, ['action', 'own_identifier', 'device_id'], 'request');
        $ownIdentifier = validate_participant_identifier_string($input['own_identifier'] ?? '', 'own_identifier', true);
        $deviceId = validate_device_id_value($input['device_id'] ?? '', 'device_id');
        $webPushConfig = load_webpush_config($webPushConfigFile);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $identifierStatus = get_identifier_status($state, $ownIdentifier);
    $preferredIdentifier = trim((string) ($identifierStatus['preferred_identifier'] ?? $ownIdentifier));
    $pushStatus = get_push_registration_status($state, $preferredIdentifier, $deviceId);

    $response = [
        'ok' => true,
        'web_push' => [
            'available' => !empty($webPushConfig['available']),
            'public_key' => !empty($webPushConfig['available']) ? (string) ($webPushConfig['publicKey'] ?? '') : '',
            'message' => (string) ($webPushConfig['message'] ?? '')
        ],
        'identifier_status' => $identifierStatus,
        'user_type' => get_user_type_for_identifier($state, $preferredIdentifier),
        'push_status' => $pushStatus,
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

if ($action === 'save_push_subscription') {
    try {
        require_allowed_keys($input, ['action', 'own_identifier', 'device_id', 'push_subscription', 'app_version', 'is_installed_app'], 'request');
        $ownIdentifier = validate_participant_identifier_string($input['own_identifier'] ?? '', 'own_identifier', true);
        $deviceId = validate_device_id_value($input['device_id'] ?? '', 'device_id');
        $subscription = validate_push_subscription_payload($input['push_subscription'] ?? [], 'push_subscription');
        $appVersion = substr(trim((string) ($input['app_version'] ?? '')), 0, 64);
        $isInstalledApp = !empty($input['is_installed_app']);
        $webPushConfig = load_webpush_config($webPushConfigFile);
        if (empty($webPushConfig['available'])) {
            throw new RuntimeException(trim((string) ($webPushConfig['message'] ?? 'Web Push is unavailable.')));
        }
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $identifierStatus = get_identifier_status($state, $ownIdentifier);
    $preferredIdentifier = trim((string) ($identifierStatus['preferred_identifier'] ?? $ownIdentifier));
    $storedRegistration = upsert_push_subscription_record(
        $state,
        $preferredIdentifier,
        $deviceId,
        $subscription,
        $nowMs,
        [
            'app_version' => $appVersion,
            'is_installed_app' => $isInstalledApp,
            'user_agent' => substr(trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 512)
        ]
    );

    $response = [
        'ok' => true,
        'identifier_status' => get_identifier_status($state, $preferredIdentifier),
        'push_status' => get_push_registration_status($state, $preferredIdentifier, $deviceId),
        'registration' => normalize_push_subscription_record($storedRegistration),
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

if ($action === 'disable_push_subscription') {
    try {
        require_allowed_keys($input, ['action', 'own_identifier', 'device_id'], 'request');
        $ownIdentifier = validate_participant_identifier_string($input['own_identifier'] ?? '', 'own_identifier', true);
        $deviceId = validate_device_id_value($input['device_id'] ?? '', 'device_id');
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $identifierStatus = get_identifier_status($state, $ownIdentifier);
    $preferredIdentifier = trim((string) ($identifierStatus['preferred_identifier'] ?? $ownIdentifier));
    $changed = deactivate_push_subscription_record($state, $preferredIdentifier, $deviceId, $nowMs);

    $response = [
        'ok' => true,
        'disabled' => $changed,
        'identifier_status' => get_identifier_status($state, $preferredIdentifier),
        'push_status' => get_push_registration_status($state, $preferredIdentifier, $deviceId),
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

if ($action === 'get_partner_messaging') {
    try {
        require_allowed_keys($input, ['action', 'own_identifier', 'partner_identifier', 'device_id'], 'request');
        $ownIdentifier = validate_participant_identifier_string($input['own_identifier'] ?? '', 'own_identifier', true);
        $partnerIdentifier = validate_participant_identifier_string($input['partner_identifier'] ?? '', 'partner_identifier', true);
        $deviceId = validate_device_id_value($input['device_id'] ?? '', 'device_id');
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $ownStatus = get_identifier_status($state, $ownIdentifier);
    $partnerStatus = get_identifier_status($state, $partnerIdentifier);
    $preferredOwnIdentifier = trim((string) ($ownStatus['preferred_identifier'] ?? $ownIdentifier));
    $preferredPartnerIdentifier = trim((string) ($partnerStatus['preferred_identifier'] ?? $partnerIdentifier));
    $thread = build_partner_message_thread_for_owner($state, $preferredOwnIdentifier, $preferredPartnerIdentifier);
    $lastReadMs = get_partner_message_last_read_ms($state, $preferredOwnIdentifier, $preferredPartnerIdentifier);
    $readMessageIds = get_partner_message_read_ids($state, $preferredOwnIdentifier, $preferredPartnerIdentifier);

    $response = [
        'ok' => true,
        'thread' => $thread,
        'unread_count' => get_partner_thread_unread_count_for_owner(
            $thread,
            $preferredOwnIdentifier,
            $lastReadMs,
            $readMessageIds
        ),
        'read_message_ids' => $readMessageIds,
        'inbox' => build_partner_message_inbox_summary($state, $preferredOwnIdentifier),
        'identifier_status' => $ownStatus,
        'partner_status' => $partnerStatus,
        'push_status' => get_push_registration_status($state, $preferredOwnIdentifier, $deviceId),
        'partner_push_status' => get_push_registration_status($state, $preferredPartnerIdentifier),
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

if ($action === 'get_partner_message_inbox') {
    try {
        require_allowed_keys($input, ['action', 'own_identifier', 'device_id'], 'request');
        $ownIdentifier = validate_participant_identifier_string($input['own_identifier'] ?? '', 'own_identifier', true);
        $deviceId = validate_device_id_value($input['device_id'] ?? '', 'device_id');
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $ownStatus = get_identifier_status($state, $ownIdentifier);
    $preferredOwnIdentifier = trim((string) ($ownStatus['preferred_identifier'] ?? $ownIdentifier));
    $response = [
        'ok' => true,
        'inbox' => build_partner_message_inbox_summary($state, $preferredOwnIdentifier),
        'identifier_status' => $ownStatus,
        'push_status' => get_push_registration_status($state, $preferredOwnIdentifier, $deviceId),
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

if ($action === 'mark_partner_messages_read') {
    try {
        require_allowed_keys($input, ['action', 'own_identifier', 'partner_identifier', 'message_id'], 'request');
        $ownIdentifier = validate_participant_identifier_string($input['own_identifier'] ?? '', 'own_identifier', true);
        $partnerIdentifier = validate_participant_identifier_string($input['partner_identifier'] ?? '', 'partner_identifier', true);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $ownStatus = get_identifier_status($state, $ownIdentifier);
    $partnerStatus = get_identifier_status($state, $partnerIdentifier);
    $preferredOwnIdentifier = trim((string) ($ownStatus['preferred_identifier'] ?? $ownIdentifier));
    $preferredPartnerIdentifier = trim((string) ($partnerStatus['preferred_identifier'] ?? $partnerIdentifier));
    $messageId = trim((string) ($input['message_id'] ?? ''));
    mark_partner_messages_read($state, $preferredOwnIdentifier, $preferredPartnerIdentifier, $nowMs, $messageId !== '' ? $messageId : null);
    $thread = build_partner_message_thread_for_owner($state, $preferredOwnIdentifier, $preferredPartnerIdentifier);
    $lastReadMs = get_partner_message_last_read_ms($state, $preferredOwnIdentifier, $preferredPartnerIdentifier);
    $readMessageIds = get_partner_message_read_ids($state, $preferredOwnIdentifier, $preferredPartnerIdentifier);

    $response = [
        'ok' => true,
        'thread' => $thread,
        'unread_count' => get_partner_thread_unread_count_for_owner($thread, $preferredOwnIdentifier, $lastReadMs, $readMessageIds),
        'read_message_ids' => $readMessageIds,
        'inbox' => build_partner_message_inbox_summary($state, $preferredOwnIdentifier),
        'identifier_status' => $ownStatus,
        'partner_status' => $partnerStatus,
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

if ($action === 'send_partner_message') {
    try {
        require_allowed_keys($input, ['action', 'sender_identifier', 'recipient_identifier', 'sender_role', 'recipient_role', 'message_text'], 'request');
        $senderIdentifier = validate_participant_identifier_string($input['sender_identifier'] ?? '', 'sender_identifier', true);
        $recipientIdentifier = validate_participant_identifier_string($input['recipient_identifier'] ?? '', 'recipient_identifier', true);
        $senderRole = validate_role_value($input['sender_role'] ?? '', 'sender_role');
        $recipientRole = validate_role_value($input['recipient_role'] ?? '', 'recipient_role');
        $messageText = validate_partner_message_text($input['message_text'] ?? '', 'message_text');
        $webPushConfig = load_webpush_config($webPushConfigFile);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $senderStatus = get_identifier_status($state, $senderIdentifier);
    $recipientStatus = get_identifier_status($state, $recipientIdentifier);
    $preferredSenderIdentifier = trim((string) ($senderStatus['preferred_identifier'] ?? $senderIdentifier));
    $preferredRecipientIdentifier = trim((string) ($recipientStatus['preferred_identifier'] ?? $recipientIdentifier));

    $messageRecord = append_partner_message(
        $state,
        $preferredSenderIdentifier,
        $preferredRecipientIdentifier,
        $senderRole,
        $recipientRole,
        $messageText,
        $nowMs
    );

    $notificationTitle = 'ESP GYM message';
    $notificationBody = $messageText;
    $notificationUrl = build_absolute_launcher_url([
        'open' => $recipientRole === 'remote-viewer' ? 'remote-viewer' : $recipientRole,
        'direct_open' => '1',
        'message_owner' => $preferredRecipientIdentifier,
        'message_partner' => $preferredSenderIdentifier,
        'message_focus' => '1'
    ]);

    $delivery = send_push_notification_to_identifier(
        $state,
        $webPushConfig,
        $preferredRecipientIdentifier,
        [
            'title' => $notificationTitle,
            'body' => $notificationBody,
            'url' => $notificationUrl,
            'tag' => 'esp-gym-message-' . md5($preferredSenderIdentifier . '||' . $preferredRecipientIdentifier),
            'data' => [
                'owner_identifier' => $preferredRecipientIdentifier,
                'partner_identifier' => $preferredSenderIdentifier,
                'open_role' => $recipientRole
            ]
        ],
        $nowMs
    );

    $response = [
        'ok' => true,
        'message' => $messageRecord,
        'thread' => build_partner_message_thread_for_owner($state, $preferredSenderIdentifier, $preferredRecipientIdentifier),
        'recipient_inbox' => build_partner_message_inbox_summary($state, $preferredRecipientIdentifier),
        'delivery' => $delivery,
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

if ($action === 'delete_partner_message') {
    try {
        require_allowed_keys($input, ['action', 'own_identifier', 'partner_identifier', 'message_id'], 'request');
        $ownIdentifier = validate_participant_identifier_string($input['own_identifier'] ?? '', 'own_identifier', true);
        $partnerIdentifier = validate_participant_identifier_string($input['partner_identifier'] ?? '', 'partner_identifier', true);
        $messageId = trim((string) ($input['message_id'] ?? ''));
        if ($messageId === '' || !preg_match('/^[a-f0-9]{16}$/', $messageId)) {
            throw new InvalidArgumentException('message_id is invalid.');
        }
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $ownStatus = get_identifier_status($state, $ownIdentifier);
    $partnerStatus = get_identifier_status($state, $partnerIdentifier);
    $preferredOwnIdentifier = trim((string) ($ownStatus['preferred_identifier'] ?? $ownIdentifier));
    $preferredPartnerIdentifier = trim((string) ($partnerStatus['preferred_identifier'] ?? $partnerIdentifier));
    $deleteResult = delete_partner_message($state, $preferredOwnIdentifier, $preferredPartnerIdentifier, $messageId, $nowMs);

    $response = [
        'ok' => true,
        'deleted' => !empty($deleteResult['deleted']),
        'thread' => $deleteResult['thread'],
        'inbox' => build_partner_message_inbox_summary($state, $preferredOwnIdentifier),
        'identifier_status' => $ownStatus,
        'partner_status' => $partnerStatus,
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

if ($action === 'get_stripe_public_config') {
    $stripeConfig = load_stripe_config($configDir);
    $response = [
        'ok' => true,
        'stripe' => [
            'available' => (bool) ($stripeConfig['available'] ?? false),
            'mode' => (string) ($stripeConfig['mode'] ?? 'sandbox'),
            'publishable_key' => (string) ($stripeConfig['publishableKey'] ?? ''),
            'has_monthly_price' => trim((string) ($stripeConfig['prices']['proMonthly'] ?? '')) !== '',
            'has_annual_price' => trim((string) ($stripeConfig['prices']['proAnnual'] ?? '')) !== ''
        ],
        'server_now_ms' => $nowMs
    ];
    if (!($stripeConfig['available'] ?? false)) {
        $response['stripe']['message'] = (string) ($stripeConfig['message'] ?? 'Stripe configuration is unavailable.');
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

if ($action === 'create_stripe_checkout_session') {
    try {
        require_allowed_keys($input, ['action', 'app_user_identifier', 'plan'], 'request');
        $appUserIdentifier = validate_participant_identifier_string($input['app_user_identifier'] ?? '', 'app_user_identifier', true);
        $plan = normalize_stripe_plan($input['plan'] ?? '');
        if ($plan === '') {
            throw new RuntimeException('Subscription plan is invalid.');
        }

        $stripeConfig = load_stripe_config($configDir);
        if (!($stripeConfig['available'] ?? false)) {
            throw new RuntimeException((string) ($stripeConfig['message'] ?? 'Stripe configuration is unavailable.'));
        }

        $priceId = get_stripe_price_id_for_plan($stripeConfig, $plan);
        if ($priceId === '') {
            throw new RuntimeException('Stripe price is not configured for that plan.');
        }

        $sessionResponse = stripe_api_request(
            'POST',
            '/v1/checkout/sessions',
            build_stripe_checkout_session_fields($stripeConfig, $priceId, $appUserIdentifier, $plan),
            (string) $stripeConfig['secretKey']
        );
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'checkout' => [
            'session_id' => trim((string) ($sessionResponse['id'] ?? '')),
            'url' => trim((string) ($sessionResponse['url'] ?? '')),
            'plan' => $plan,
            'app_user_identifier' => $appUserIdentifier
        ],
        'identifier_status' => get_identifier_status($state, $appUserIdentifier),
        'user_type' => get_user_type_for_identifier($state, $appUserIdentifier),
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

if ($action === 'stripe_webhook') {
    $stripeConfig = load_stripe_config($configDir);
    if (!($stripeConfig['available'] ?? false)) {
        fail_request($handle, $nowMs, (string) ($stripeConfig['message'] ?? 'Stripe configuration is unavailable.'), 500);
    }

    $signatureHeader = isset($_SERVER['HTTP_STRIPE_SIGNATURE']) ? (string) $_SERVER['HTTP_STRIPE_SIGNATURE'] : '';
    if (!verify_stripe_webhook_signature((string) ($rawRequestBody ?? ''), $signatureHeader, (string) ($stripeConfig['webhookSecret'] ?? ''))) {
        fail_request($handle, $nowMs, 'Stripe webhook signature verification failed.', 400);
    }

    $event = json_decode((string) ($rawRequestBody ?? ''), true);
    if (!is_array($event)) {
        fail_request($handle, $nowMs, 'Stripe webhook payload was invalid JSON.', 400);
    }

    $eventId = trim((string) ($event['id'] ?? ''));
    $eventType = trim((string) ($event['type'] ?? ''));
    if (has_processed_stripe_event($state, $eventId)) {
        $response = [
            'ok' => true,
            'received' => true,
            'duplicate' => true,
            'event_id' => $eventId,
            'event_type' => $eventType,
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

    try {
        $eventResult = ['updated' => false, 'message' => 'Unhandled Stripe event type.'];
        if ($eventType === 'checkout.session.completed') {
            $eventResult = apply_checkout_session_completed_event($state, $subscriptionEmailLogFile, $event, $nowMs);
        } elseif ($eventType === 'invoice.payment_succeeded') {
            $eventResult = apply_invoice_payment_succeeded_event($state, $subscriptionEmailLogFile, $event, $nowMs);
        } elseif ($eventType === 'customer.subscription.updated') {
            $eventResult = apply_subscription_updated_event($state, $event, $nowMs);
        } elseif ($eventType === 'customer.subscription.deleted') {
            $eventResult = apply_subscription_deleted_event($state, $subscriptionEmailLogFile, $event, $nowMs);
        }

        record_processed_stripe_event($state, $eventId, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'received' => true,
        'event_id' => $eventId,
        'event_type' => $eventType,
        'result' => $eventResult,
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

if ($action === 'cron_subscription_reminders') {
    if (!is_localhost_request()) {
        fail_request($handle, $nowMs, 'This reminder endpoint is available only to localhost requests.', 403);
    }

    try {
        $scanResult = scan_subscription_annual_reminders($state, $subscriptionEmailLogFile, $nowMs, false, 30);
        $cronCounts = build_cron_status_counts($state);
        $cronEmailResult = send_cron_status_email($state, $subscriptionEmailLogFile, $cronCounts, $scanResult, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'cron' => true,
        'cron_counts' => $cronCounts,
        'cron_email' => $cronEmailResult,
        'reminder_scan' => $scanResult,
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

if ($action === 'set_user_type' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'user_handle', 'user_identifier', 'user_type', 'secret_candidate'], 'request');
        $userIdentifier = trim((string) ($input['user_identifier'] ?? ($input['user_handle'] ?? '')));
        $userType = normalize_user_type($input['user_type'] ?? 'standard');
        $validatedIdentifier = validate_participant_identifier_string($userIdentifier, 'user_identifier', true);
        if (!participant_identifier_exists($state, $pairsDir, $validatedIdentifier)) {
            throw new RuntimeException('That user identifier does not exist.');
        }
        $assignment = assign_user_type_for_identifier($state, $validatedIdentifier, $userType, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'user_assignment' => $assignment,
        'identifier_status' => get_identifier_status($state, $validatedIdentifier),
        'identifier_exists' => true,
        'user_type' => get_user_type_for_identifier($state, $validatedIdentifier),
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

if ($action === 'list_invitees' && $hasAdminAccess) {
    $response = [
        'ok' => true,
        'invitees' => list_invitees($state),
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

if ($action === 'save_email_list_signup') {
    try {
        require_allowed_keys($input, ['action', 'email', 'type', 'name'], 'request');
        $email = trim((string) ($input['email'] ?? ''));
        $type = trim((string) ($input['type'] ?? 'updates'));
        $name = trim((string) ($input['name'] ?? ''));
        $emailRecord = save_email_list_record($state, $email, $type, $name, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'email_record' => $emailRecord,
        'message' => 'Email address saved successfully.',
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

if ($action === 'list_email_list' && $hasAdminAccess) {
    $records = list_email_list_records($state);
    $response = [
        'ok' => true,
        'email_list' => $records,
        'email_list_meta' => [
            'report_date' => gmdate('Y-m-d H:i') . ' UTC',
            'total_records' => count($records)
        ],
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

if ($action === 'save_invitee' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'identifier', 'full_name', 'email', 'private_note', 'secret_candidate'], 'request');
        $identifier = trim((string) ($input['identifier'] ?? ''));
        $fullName = trim((string) ($input['full_name'] ?? ''));
        $email = trim((string) ($input['email'] ?? ''));
        $privateNote = trim((string) ($input['private_note'] ?? ''));
        $invitee = save_invitee_record($state, $identifier, $fullName, $email, $privateNote, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'invitee' => $invitee,
        'invitees' => list_invitees($state),
        'message' => 'Invitee saved successfully.',
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

if ($action === 'delete_invitee' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'identifier', 'secret_candidate'], 'request');
        $identifier = trim((string) ($input['identifier'] ?? ''));
        $deletedInvitee = delete_invitee_record($state, $pairsDir, $identifier);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'deleted_invitee' => $deletedInvitee,
        'invitees' => list_invitees($state),
        'message' => 'Invitee deleted successfully.',
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

if ($action === 'get_handle_admin_summary' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'handle', 'secret_candidate'], 'request');
        $handleValue = trim((string) ($input['handle'] ?? ''));
        $summary = get_handle_admin_summary($state, $handleValue);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'handle_summary' => $summary,
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

if ($action === 'admin_update_handle' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'previous_handle', 'new_handle', 'secret_candidate'], 'request');
        $previousHandle = trim((string) ($input['previous_handle'] ?? ''));
        $newHandle = trim((string) ($input['new_handle'] ?? ''));
        $updateResult = admin_update_unique_handle($state, $pairsDir, $previousHandle, $newHandle, $nowMs);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $response = [
        'ok' => true,
        'handle_update' => $updateResult,
        'identifier_status' => get_identifier_status($state, (string) ($updateResult['new_handle'] ?? '')),
        'user_type' => get_user_type_for_identifier($state, (string) ($updateResult['new_handle'] ?? '')),
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
    try {
        require_allowed_keys($input, ['action', 'launcher_role', 'own_email', 'launcher_profile'], 'request');
        $launcherRole = validate_role_value($input['launcher_role'] ?? '');
        $ownEmail = validate_participant_identifier_string($input['own_email'] ?? '', 'own_email', true);
        $launcherProfile = validate_launcher_profile_payload($input['launcher_profile'] ?? []);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }
    $storedProfile = set_launcher_profile_entry($state, $launcherRole, $ownEmail, $launcherProfile, $nowMs);
    $response = [
        'ok' => true,
        'launcher_profile' => $storedProfile,
        'user_type' => get_user_type_for_identifier($state, $ownEmail),
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
        require_allowed_keys($input, ['action', 'message', 'metadata'], 'request');
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
        if (array_key_exists('sender_email', $metadata)) {
            $metadata['sender_email'] = validate_email_identifier_string($metadata['sender_email'], 'metadata.sender_email', true);
        }
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

if ($action === 'add_image_pair' && $hasAdminAccess) {
    try {
        require_allowed_keys($input, ['action', 'secret_candidate', 'image_a', 'image_b'], 'request');
        $imageA = isset($input['image_a']) && is_array($input['image_a']) ? $input['image_a'] : [];
        $imageB = isset($input['image_b']) && is_array($input['image_b']) ? $input['image_b'] : [];

        if ($imageA === [] || $imageB === []) {
            throw new RuntimeException('Two image files are required.');
        }

        $storedA = store_uploaded_image_pair_file($publicImagePairsDir, $imageA);
        $storedB = store_uploaded_image_pair_file($publicImagePairsDir, $imageB);

        $manifest = load_image_pairs_manifest($imagePairsManifestFile);
        $nextNumericId = count((array) ($manifest['pairs'] ?? [])) + 1;
        $nextPairId = sprintf('pair-%04d', $nextNumericId);
        while (in_array($nextPairId, array_map(static fn (array $pair): string => (string) ($pair['id'] ?? ''), (array) ($manifest['pairs'] ?? [])), true)) {
            $nextNumericId += 1;
            $nextPairId = sprintf('pair-%04d', $nextNumericId);
        }

        $manifest['pairs'][] = [
            'id' => $nextPairId,
            'images' => [$storedA, $storedB]
        ];
        save_image_pairs_manifest($imagePairsManifestFile, $manifest);

        $response = [
            'ok' => true,
            'image_pair' => [
                'id' => $nextPairId,
                'images' => [$storedA, $storedB],
                'choice_a' => get_public_image_pair_url($storedA),
                'choice_b' => get_public_image_pair_url($storedB)
            ],
            'image_pair_count' => count((array) ($manifest['pairs'] ?? [])),
            'server_now_ms' => $nowMs
        ];
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
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

if ($action === 'clear_debug_log' && $hasAdminAccess) {
    file_put_contents($debugLogFile, '');
    file_put_contents($safetyLogFile, '');
}

if ($action === 'fresh_start' && $hasAdminAccess) {
    $state['sessions'] = [];
    $state['session_registry'] = [];
    $state['pair_difficulties'] = [];
    $state['launcher_profiles'] = [];
    $state['unique_handles'] = [];
    $state['identifier_aliases'] = [];
    $state['user_types'] = [];
    $state['level_four_receiver_pools'] = [];
    $state['invitees'] = [];
    $state['retired_handles'] = [];
    $state['handle_owners'] = [];
    $state['explore_pro_verifications'] = [];
    $state['explore_pro_trials'] = [];
    $state['stripe_users'] = [];
    $state['stripe_customer_index'] = [];
    $state['stripe_subscription_index'] = [];
    $state['stripe_processed_events'] = [];
    $state['push_subscriptions'] = [];
    $state['partner_message_threads'] = [];
    $state['partner_message_reads'] = [];
    $state['esp_lessons'] = [];
    $state['launcher_visit_count'] = 0;
    $state['visitor_trial_count'] = 0;
    $state['debug_enabled'] = false;
    $state['subscription_emails_enabled'] = false;
    $state['subscription_reminders_enabled'] = false;
    $state['easy_admin_enabled'] = false;
    $state['learn_more_save_enabled'] = false;
    $state['explore_pro_test_duration_seconds'] = 0;
    $state['trial_mode_public_enabled'] = false;
    ensure_email_list_state($state);
    $state['subscription_email_templates'] = default_subscription_email_templates();
    clear_pair_trial_records($pairsDir);
    clear_pair_trial_records($simulationPairsDir);
    clear_pair_analysis_records($pairsDir);
    clear_pair_analysis_records($simulationPairsDir);
    ensure_demo_pair_records($pairsDir, true);
    file_put_contents($subscriptionEmailLogFile, '');
}

if ($action === 'get_pair_difficulty' || $action === 'set_pair_difficulty') {
    $providedSenderName = isset($input['sender_name'])
        ? trim((string) $input['sender_name'])
        : '';
    $providedReceiverName = isset($input['receiver_name'])
        ? trim((string) $input['receiver_name'])
        : '';
    if ($providedSenderName !== '') {
        $state['pair_difficulties'][$sessionCode]['sender_name'] = $providedSenderName;
        $state['session_registry'][$sessionCode]['sender_name'] = $providedSenderName;
    }
    if ($providedReceiverName !== '') {
        $state['pair_difficulties'][$sessionCode]['receiver_name'] = $providedReceiverName;
        $state['session_registry'][$sessionCode]['receiver_name'] = $providedReceiverName;
    }
    $pairParticipants = get_pair_participants_for_session($state, $session, $sessionCode);
    $requestedDifficultyLevel = normalize_difficulty_level(
        $action === 'set_pair_difficulty'
            ? ($input['difficulty_level'] ?? '1')
            : ($state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1')
    );
    if ($action === 'set_pair_difficulty') {
        $pairDifficultyAccess = validate_pair_difficulty_access(
            $state,
            $pairParticipants['receiver_name'] ?? '',
            $pairParticipants['sender_name'] ?? '',
            $requestedDifficultyLevel
        );
        if (!($pairDifficultyAccess['allowed'] ?? false)) {
            append_debug_log(
                $debugLogFile,
                $debugEnabled,
                json_encode([
                    'time_ms' => $nowMs,
                    'session_code' => $sessionCode,
                    'role' => $role,
                    'label' => 'pair_difficulty_rejected',
                    'details' => [
                        'requested_level' => $requestedDifficultyLevel,
                        'receiver_name' => $pairParticipants['receiver_name'] ?? '',
                        'sender_name' => $pairParticipants['sender_name'] ?? '',
                        'receiver_type' => $pairDifficultyAccess['receiver_type'] ?? 'standard',
                        'sender_type' => $pairDifficultyAccess['sender_type'] ?? 'standard',
                        'message' => $pairDifficultyAccess['message'] ?? ''
                    ]
                ], JSON_UNESCAPED_SLASHES)
            );
            fail_request($handle, $nowMs, (string) ($pairDifficultyAccess['message'] ?? 'That difficulty level is not available.'), 400);
        }
        clear_authorization_notice($session);
    }
    $state['pair_difficulties'][$sessionCode]['difficulty_level'] = $requestedDifficultyLevel;
    $state['pair_difficulties'][$sessionCode]['updated_ms'] = $nowMs;
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'pair_difficulty_request',
        'details' => [
            'action' => $action,
            'difficulty_level' => $state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1',
            'frontend_build_version' => isset($input['frontend_build_version']) ? (string) $input['frontend_build_version'] : '',
            'trace_context' => isset($input['trace_context']) && is_array($input['trace_context']) ? $input['trace_context'] : []
        ]
    ]);
    append_debug_log(
        $debugLogFile,
        $debugEnabled,
        json_encode([
            'time_ms' => $nowMs,
            'session_code' => $sessionCode,
            'role' => $role,
            'label' => 'pair_difficulty_request',
            'details' => [
                'action' => $action,
                'difficulty_level' => $state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1',
                'frontend_build_version' => isset($input['frontend_build_version']) ? (string) $input['frontend_build_version'] : '',
                'trace_context' => isset($input['trace_context']) && is_array($input['trace_context']) ? $input['trace_context'] : []
            ]
        ], JSON_UNESCAPED_SLASHES)
    );
}

$pairDifficultyResponseMeta = null;
if (($action === 'get_pair_difficulty' || $action === 'set_pair_difficulty') && isset($pairParticipants) && is_array($pairParticipants)) {
    $receiverNameForDifficulty = trim((string) ($pairParticipants['receiver_name'] ?? ''));
    $senderNameForDifficulty = trim((string) ($pairParticipants['sender_name'] ?? ''));
    $pairDifficultyResponseMeta = [
        'receiver_type' => $receiverNameForDifficulty !== '' ? get_user_type_for_identifier($state, $receiverNameForDifficulty) : 'standard',
        'sender_type' => $senderNameForDifficulty !== '' ? get_user_type_for_identifier($state, $senderNameForDifficulty) : 'standard',
        'max_allowed_difficulty_level' => ($receiverNameForDifficulty !== '' && $senderNameForDifficulty !== '')
            ? get_pair_max_difficulty_level($state, $receiverNameForDifficulty, $senderNameForDifficulty)
            : '3'
    ];
}

if ($roleConflict === null && $action === 'append_trial_record') {
    $trialRecord = isset($input['trial_record']) && is_array($input['trial_record'])
        ? $input['trial_record']
        : [];
    $simulationMode = trim((string) ($input['simulation_mode'] ?? ''));
    $trialRecordAppendResult = append_pair_trial_record($pairsDir, $trialRecord, $sessionCode, $simulationMode);
    if (
        ($trialRecordAppendResult['appended'] ?? false) &&
        is_anonymous_visitor_simulation_trial_record($trialRecord)
    ) {
        $state['visitor_trial_count'] = max(0, (int) ($state['visitor_trial_count'] ?? 0)) + 1;
    }
}

if ($roleConflict === null && $runtimeAuthorizationFailure === null && $action === 'start_round' && $role === 'sender') {
    $requestedStartMs = isset($input['start_server_ms']) && is_numeric($input['start_server_ms'])
        ? (int) round((float) $input['start_server_ms'])
        : $nowMs;
    $difficultyLevel = normalize_difficulty_level($state['pair_difficulties'][$sessionCode]['difficulty_level'] ?? '1');
    $session['session_limit_notice'] = null;
    $roundState = [
        'id' => bin2hex(random_bytes(8)),
        'start_server_ms' => $requestedStartMs,
        'beep_end_server_ms' => $requestedStartMs + 8150,
        'created_server_ms' => $nowMs,
        'last_activity_ms' => $nowMs,
        'sender_client_id' => $clientId,
        'stimulus_kind' => 'cones',
        'layout_number' => null,
        'arrangement_code' => null,
        'image_pair_id' => null,
        'image_choice_a' => null,
        'image_choice_b' => null,
        'image_sent_index' => null,
        'image_sent' => null,
        'completed_server_ms' => null,
        'guess_layout_number' => null,
        'guess_arrangement_code' => null,
        'second_guess_layout_number' => null,
        'second_guess_arrangement_code' => null,
        'guess_confidence' => null,
        'done_reaction_ms' => null,
        'guess_submitted_ms' => null
    ];

    if ($difficultyLevel === '4') {
        $levelFourPairs = get_level_four_image_pairs($imagePairsManifestFile);
        $pairParticipants = get_pair_participants_for_session($state, $session, $sessionCode);
        $receiverIdentifierForLevelFour = trim((string) ($pairParticipants['receiver_name'] ?? ''));
        $selectedImagePair = $receiverIdentifierForLevelFour !== ''
            ? pick_level_four_image_pair_for_receiver($state, $receiverIdentifierForLevelFour, $levelFourPairs, $nowMs)
            : pick_level_four_image_pair_for_session($session, $levelFourPairs, $nowMs);

        if ($selectedImagePair === null) {
            $session['round'] = null;
            $session['post_round'] = null;
            $session['timeout_notice'] = null;
            $session['receiver']['ready'] = false;
            $session['receiver']['view'] = default_receiver_view();
            $session['session_limit_notice'] = [
                'created_ms' => $nowMs,
                'message' => count($levelFourPairs) > 0
                    ? 'This receiver has now seen all available Level 4 image pairs. Press here to end the session.'
                    : 'No Level 4 image pairs are available right now. Press here to end the session.',
                'total_pairs' => count($levelFourPairs)
            ];
        } else {
            $roundState['stimulus_kind'] = 'image_pair';
            $roundState['image_pair_id'] = $selectedImagePair['id'];
            $roundState['image_choice_a'] = $selectedImagePair['image_choice_a'];
            $roundState['image_choice_b'] = $selectedImagePair['image_choice_b'];
            $roundState['image_sent_index'] = $selectedImagePair['image_sent_index'];
            $roundState['image_sent'] = $selectedImagePair['image_sent'];
            $session['round'] = $roundState;
            $session['post_round'] = null;
            $session['timeout_notice'] = null;
            $session['receiver']['ready'] = false;
            $session['receiver']['view'] = default_receiver_view();
        }
    } else {
        $session['round'] = $roundState;
        $session['post_round'] = null;
        $session['timeout_notice'] = null;
        $session['receiver']['ready'] = false;
        $session['receiver']['view'] = default_receiver_view();
    }
}

if ($roleConflict === null && $runtimeAuthorizationFailure === null && $action === 'post_round_choice' && is_array($session['round'] ?? null)) {
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

if ($roleConflict === null && $runtimeAuthorizationFailure === null && $action === 'clear_post_round') {
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
        clear_authorization_notice($session);
        $session['session_limit_notice'] = null;
        if ($mode === 'end') {
            $partnerRole = $role === 'sender' ? 'receiver' : 'sender';
            $finishingRoleLabel = $role === 'sender' ? 'sender' : 'receiver';
            $session['partner_finished_notice'] = [
                'created_ms' => $nowMs,
                'target_role' => $partnerRole,
                'by_role' => $role,
                'message' => "The {$finishingRoleLabel} has had enough. Press here to return."
            ];
            reset_level_four_session($session);
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

if ($roleConflict === null && $action === 'clear_partner_finished_notice') {
    $notice = $session['partner_finished_notice'] ?? null;
    if (is_array($notice)) {
        $targetRole = isset($notice['target_role']) ? (string) $notice['target_role'] : '';
        if ($targetRole === '' || $targetRole === $role) {
            $session['partner_finished_notice'] = null;
        }
    } else {
        $session['partner_finished_notice'] = null;
    }
}

if ($roleConflict === null && $action === 'abort_to_home') {
    $abortReason = isset($input['abort_reason']) ? (string) $input['abort_reason'] : '';
    apply_abort_to_home($session, $nowMs, $role, $sessionCode, $debugLogFile, $safetyLogFile, $safetyLogMaxBytes, $debugEnabled, $abortReason);
}

if ($roleConflict === null && $action === 'clear_abort_notice') {
    $session['abort_notice'] = null;
}

if ($roleConflict === null && $action === 'clear_entry_notices_on_boot') {
    append_forced_trace($safetyLogFile, $safetyLogMaxBytes, [
        'time_ms' => $nowMs,
        'session_code' => $sessionCode,
        'role' => $role,
        'label' => 'clear_entry_notices_on_boot_called',
        'details' => [
            'timeout_notice_present' => is_array($session['timeout_notice'] ?? null),
            'timeout_exit_present' => is_array($session['timeout_exit'] ?? null),
            'abort_notice_present' => is_array($session['abort_notice'] ?? null),
            'session_limit_notice_present' => is_array($session['session_limit_notice'] ?? null),
            'round_present' => is_array($session['round'] ?? null),
            'frontend_build_version' => isset($input['frontend_build_version']) ? (string) $input['frontend_build_version'] : ''
        ]
    ]);
    $session['timeout_notice'] = null;
    $session['timeout_exit'] = null;
    $session['abort_notice'] = null;
    $session['partner_finished_notice'] = null;
    $session['session_limit_notice'] = null;
}

if ($roleConflict === null && $runtimeAuthorizationFailure === null && $action === 'complete_round' && $role === 'sender' && is_array($session['round'] ?? null)) {
    if (($session['round']['sender_client_id'] ?? '') === $clientId && (($session['round']['stimulus_kind'] ?? 'cones') === 'image_pair')) {
        $session['round']['completed_server_ms'] = $nowMs;
        $session['round']['last_activity_ms'] = $nowMs;
        $session['stats']['last_layout_number'] = null;
        $session['stats']['last_completed_ms'] = $nowMs;
        append_debug_log(
            $debugLogFile,
            $debugEnabled,
            json_encode([
                'time_ms' => $nowMs,
                'session_code' => $sessionCode,
                'role' => 'sender',
                'label' => 'complete_round_level_four',
                'details' => [
                    'round_id' => $session['round']['id'] ?? '',
                    'image_pair_id' => $session['round']['image_pair_id'] ?? '',
                    'image_sent_index' => $session['round']['image_sent_index'] ?? null,
                    'image_sent' => $session['round']['image_sent'] ?? ''
                ]
            ], JSON_UNESCAPED_SLASHES)
        );
    } elseif (($session['round']['sender_client_id'] ?? '') === $clientId && isset($input['layout_number']) && is_numeric($input['layout_number'])) {
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

if ($roleConflict === null && $runtimeAuthorizationFailure === null && $action === 'submit_guess' && $role === 'receiver' && is_array($session['round'] ?? null)) {
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
        if (($session['round']['stimulus_kind'] ?? 'cones') === 'image_pair') {
            $actualLayoutNumber = isset($session['round']['image_sent_index']) && is_numeric($session['round']['image_sent_index'])
                ? (int) $session['round']['image_sent_index']
                : null;
        }
        $session['stats']['last_guess_correct'] =
            $actualLayoutNumber !== null &&
            (
                ($difficultyLevel === '1' && (
                    ($actualLayoutNumber === 1 && $guessLayoutNumber === 1) ||
                    (in_array($actualLayoutNumber, [6, 7, 8, 9], true) && $guessLayoutNumber === 3)
                )) ||
                ($difficultyLevel === '4' && $guessLayoutNumber === $actualLayoutNumber) ||
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
                    'actual_arrangement_code' => $session['round']['arrangement_code'] ?? null,
                    'stimulus_kind' => $session['round']['stimulus_kind'] ?? 'cones',
                    'image_pair_id' => $session['round']['image_pair_id'] ?? '',
                    'image_sent_index' => $session['round']['image_sent_index'] ?? null,
                    'image_sent' => $session['round']['image_sent'] ?? ''
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
    'is_admin' => $hasAdminAccess,
    'debug_enabled' => $debugEnabled,
    'subscription_emails_enabled' => !empty($state['subscription_emails_enabled']),
    'subscription_reminders_enabled' => !empty($state['subscription_reminders_enabled']),
    'easy_admin_enabled' => !empty($state['easy_admin_enabled']),
    'learn_more_save_enabled' => !empty($state['learn_more_save_enabled']),
    'explore_pro_test_duration_seconds' => max(0, (int) ($state['explore_pro_test_duration_seconds'] ?? 0)),
    'trial_mode_public_enabled' => !empty($state['trial_mode_public_enabled']),
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
        'partner_finished_notice' => $session['partner_finished_notice'],
        'authorization_notice' => $session['authorization_notice'],
        'session_limit_notice' => $session['session_limit_notice'],
        'timeout_notice' => $session['timeout_notice'],
        'timeout_exit' => $session['timeout_exit'],
        'round' => $session['round']
    ]
];

if (is_array($pairDifficultyResponseMeta)) {
    $response['pair_difficulty_meta'] = $pairDifficultyResponseMeta;
}

if (is_array($trialRecordAppendResult)) {
    $response['trial_record_append'] = $trialRecordAppendResult;
}

if ($hasAdminAccess) {
    $response['storage'] = get_storage_status($stateDir);
    $response['debug_log'] = get_debug_log_status($debugLogFile);
    $response['safety_log'] = get_debug_log_status($safetyLogFile);
    $response['subscription_email_log'] = read_subscription_email_log($subscriptionEmailLogFile);
    $response['subscription_email_templates'] = $state['subscription_email_templates'] ?? default_subscription_email_templates();
}

if ($action === 'analyze_disk_usage' && $hasAdminAccess) {
    $response['disk_usage_analysis'] = get_disk_usage_analysis();
}

if ($action === 'list_all_users' && $hasAdminAccess) {
    $response['user_trial_summary'] = build_user_trial_summary($state, read_all_pair_trial_records($pairsDir));
    $response['user_trial_summary_meta'] = [
        'report_date' => gmdate('Y-m-d H:i') . ' UTC',
        'total_users' => count($response['user_trial_summary'])
    ];
}

if ($action === 'list_all_pairs' && $hasAdminAccess) {
    $allRecords = array_merge(
        read_all_pair_trial_records_with_source($pairsDir, 'real'),
        read_all_pair_trial_records_with_source($simulationPairsDir, 'simulation')
    );
    $response['pair_summary'] = build_all_pairs_summary($state, $allRecords);
    $countsByType = ['Human' => 0, 'Simulation' => 0, 'Demo' => 0];
    foreach ($response['pair_summary'] as $row) {
        $type = (string) ($row['type'] ?? '');
        if (isset($countsByType[$type])) {
            $countsByType[$type] += 1;
        }
    }
    $response['pair_summary_meta'] = [
        'report_date' => gmdate('Y-m-d H:i') . ' UTC',
        'total_pairs' => count($response['pair_summary']),
        'human_pairs' => $countsByType['Human'],
        'simulation_pairs' => $countsByType['Simulation'],
        'demo_pairs' => $countsByType['Demo']
    ];
}

if ($action === 'list_all_identities' && $hasAdminAccess) {
    $allRecords = array_merge(
        read_all_pair_trial_records_with_source($pairsDir, 'real'),
        read_all_pair_trial_records_with_source($simulationPairsDir, 'simulation')
    );
    $response['identity_summary'] = build_all_identities_summary($state, $allRecords);
    $proCount = 0;
    $stdCount = 0;
    foreach ($response['identity_summary'] as $row) {
        if (strcasecmp((string) ($row['subscription'] ?? ''), 'PRO') === 0) {
            $proCount += 1;
        } else {
            $stdCount += 1;
        }
    }
    $response['identity_summary_meta'] = [
        'report_date' => gmdate('Y-m-d H:i') . ' UTC',
        'total_identities' => count($response['identity_summary']),
        'pro_count' => $proCount,
        'std_count' => $stdCount
    ];
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
    $allRecords = array_merge(
        read_all_pair_trial_records_with_source($pairsDir, 'real'),
        read_all_pair_trial_records_with_source($simulationPairsDir, 'simulation')
    );
    $candidatePairs = isset($input['candidate_pairs']) && is_array($input['candidate_pairs'])
        ? $input['candidate_pairs']
        : [];
    $associatedNames = isset($input['associated_names']) && is_array($input['associated_names'])
        ? $input['associated_names']
        : [];
    $includeAll = $hasAdminAccess && !empty($input['include_all']);
    $filteredRecords = filter_pair_trial_records($allRecords, $candidatePairs, $associatedNames, $includeAll);

    $message = '';
    if (!$allRecords) {
        $message = 'No trial records were found.';
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
    try {
        require_allowed_keys($input, ['action', 'selected_pair', 'secret_candidate'], 'request');
        $selectedPair = validate_selected_pair_payload($input['selected_pair'] ?? []);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }
    $selectedPairsDir = resolve_pair_source_dir((string) ($selectedPair['source'] ?? 'real'), $pairsDir);
    $pairRecords = read_pair_trial_records_for_pair($selectedPairsDir, $selectedPair);
    $pairSource = trim((string) ($selectedPair['source'] ?? '')) === 'simulation' ? 'simulation' : 'real';
    $pairRecords = array_map(static function (array $record) use ($pairSource): array {
        $record['_report_source'] = $pairSource;
        return $record;
    }, $pairRecords);
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
            ? resolve_pair_trial_csv_path($selectedPairsDir, $selectedReceiver, $selectedSender, trim((string) ($selectedPair['session_code'] ?? '')))
            : $selectedPairsDir,
        'records' => $pairRecords,
        'message' => count($pairRecords) > 0
            ? ''
            : 'No trial records found for the current receiver-sender selection.'
    ];
}

if ($action === 'get_location_visualization') {
    try {
        require_allowed_keys(
            $input,
            ['action', 'selected_pair', 'secret_candidate', 'level', 'date_from', 'date_to', 'min_trials', 'include_incomplete', 'group_by', 'rounding_decimals'],
            'request'
        );
        $selectedPair = validate_selected_pair_payload($input['selected_pair'] ?? []);
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $selectedPairsDir = resolve_pair_source_dir((string) ($selectedPair['source'] ?? 'real'), $pairsDir);
    $response['location_visualization'] = build_location_visualization_payload($selectedPairsDir, $selectedPair, $input);
}

if ($action === 'save_pair_analysis') {
    try {
        require_allowed_keys($input, ['action', 'selected_pair', 'analysis'], 'request');
        $selectedPair = validate_selected_pair_payload($input['selected_pair'] ?? []);
        $analysis = validate_analysis_payload($input['analysis'] ?? []);
        if (($analysis['pair']['receiver_name'] ?? '') !== $selectedPair['receiver_name']
            || ($analysis['pair']['sender_name'] ?? '') !== $selectedPair['sender_name']
            || ($analysis['pair']['session_code'] ?? '') !== $selectedPair['session_code']) {
            throw new RuntimeException('analysis.pair must match selected_pair.');
        }
    } catch (Throwable $exception) {
        fail_request($handle, $nowMs, $exception->getMessage(), 400);
    }

    $selectedPairsDir = resolve_pair_source_dir((string) ($selectedPair['source'] ?? 'real'), $pairsDir);
    $response['pair_analysis'] = save_pair_analysis_record($selectedPairsDir, $selectedPair, $analysis);
}

echo json_encode($response);
