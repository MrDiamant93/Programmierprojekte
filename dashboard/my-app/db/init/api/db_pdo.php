<?php
// Raw PDO bootstrap without content-type header (for SSE)
$DB_HOST = getenv('DB_HOST') ?: 'db';
$DB_NAME = getenv('DB_NAME') ?: 'ITM_Dashboard';
$DB_USER = getenv('DB_USER') ?: 'ITM_Admin';
$DB_PASS = getenv('DB_PASS') ?: '';

try {
  $pdo = new PDO(
    "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
    $DB_USER,
    $DB_PASS,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
  );
} catch (PDOException $e) {
  http_response_code(500);
  echo "event: error\n";
  echo "data: " . json_encode(['ok' => false, 'error' => 'DB-Verbindung fehlgeschlagen', 'detail' => $e->getMessage()]) . "\n\n";
  flush();
  exit;
}
