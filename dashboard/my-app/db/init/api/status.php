<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(405, ['ok'=>false, 'error'=>'Nur POST erlaubt']);
}

$data = read_json();
$id = isset($data['teilnehmer_id']) ? (int)$data['teilnehmer_id'] : 0;
$status = isset($data['status']) ? (string)$data['status'] : '';

$allowed = ['present','travel','absent','late','sick'];
if ($id <= 0 || !in_array($status, $allowed, true)) {
  respond(400, ['ok'=>false, 'error'=>'Ungültige Eingabe']);
}

try {
  $stmt = $pdo->prepare('INSERT INTO events (type, data) VALUES (?, ?)');
  $stmt->execute(['status-changed', json_encode(['teilnehmer_id' => $id, 'status' => $status], JSON_UNESCAPED_UNICODE)]);
} catch (Exception $ex) {
  // Not fatal for client
}

respond(200, ['ok'=>true]);
