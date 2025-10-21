<?php
// SSE endpoint: streams events from 'events' table
declare(strict_types=1);

// Important: do not include bootstrap.php because it sets JSON headers
require __DIR__ . '/db_pdo.php';

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');

// Disable buffering
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', '0');
while (ob_get_level() > 0) { ob_end_flush(); }
ob_implicit_flush(1);
set_time_limit(0);

// Helper to send SSE frame
function sse_send($event, $data = null, $id = null) {
  if ($id !== null) echo "id: {$id}\n";
  if ($event) echo "event: {$event}\n";
  if ($data !== null) {
    $lines = explode("\n", is_string($data) ? $data : json_encode($data));
    foreach ($lines as $line) {
      echo "data: {$line}\n";
    }
  } else {
    echo "data: \n";
  }
  echo "\n";
  @flush();
}

// Determine starting last_id
$lastId = 0;
if (isset($_SERVER['HTTP_LAST_EVENT_ID']) && is_numeric($_SERVER['HTTP_LAST_EVENT_ID'])) {
  $lastId = (int)$_SERVER['HTTP_LAST_EVENT_ID'];
} elseif (isset($_GET['since']) && is_numeric($_GET['since'])) {
  $lastId = (int)$_GET['since'];
} else {
  // New client: start at current max id to avoid backlog
  $stmt = $pdo->query('SELECT MAX(id) AS maxid FROM events');
  $row = $stmt->fetch();
  $lastId = (int)($row['maxid'] ?? 0);
}

// Initial hello
sse_send('hello', ['ok' => true, 'since' => $lastId]);

$start = time();
$timeout = 60 * 30; // keep connection ~30 minutes max (client will reconnect)

// Main loop
while (true) {
  // Timeout reconnect
  if ((time() - $start) > $timeout) {
    sse_send('bye', ['reason' => 'timeout']);
    break;
  }

  // Fetch new events
  $stmt = $pdo->prepare('SELECT id, type, data, created_at FROM events WHERE id > ? ORDER BY id ASC LIMIT 100');
  $stmt->execute([$lastId]);
  $rows = $stmt->fetchAll();

  if ($rows && count($rows) > 0) {
    foreach ($rows as $row) {
      $id = (int)$row['id'];
      $type = $row['type'];
      $data = $row['data'];
      $payload = $data ? json_decode($data, true) : null;
      sse_send($type, $payload ?? ['id' => $id], $id);
      $lastId = $id;
    }
  } else {
    // heartbeat every 15s
    if ((time() - $start) % 15 === 0) {
      echo ": keep-alive\n\n";
      @flush();
    }
    usleep(250000); // 250ms
  }
}
