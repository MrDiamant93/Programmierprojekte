<?php
// Basic JSON + CORS bootstrap for the API
header('Content-Type: application/json; charset=utf-8');

// In production, set a specific origin instead of "*"
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// Niemals HTML-Fehler ausgeben; alles loggen
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Warnings/Notices -> Exceptions
set_error_handler(function($sev, $msg, $file, $line){
  throw new ErrorException($msg, 0, $sev, $file, $line);
});

// Ungefangene Exceptions -> sauberes JSON
set_exception_handler(function(Throwable $e){
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>'Serverfehler: '.$e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
});

function read_json() {
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function respond($status, $payload) {
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
