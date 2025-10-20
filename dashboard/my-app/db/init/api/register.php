<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');           // niemals HTML-Fehler ausgeben
ini_set('log_errors', '1');               // in Container-Logs schreiben
error_reporting(E_ALL);

// Warnings/Notices -> Exceptions und IMMER JSON antworten
set_error_handler(function($sev, $msg, $file, $line){
  throw new ErrorException($msg, 0, $sev, $file, $line);
});
set_exception_handler(function(Throwable $e){
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>"Serverfehler: ".$e->getMessage()], JSON_UNESCAPED_UNICODE);
  exit;
});

require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw ?? '', true) ?? [];

$name      = trim((string)($data['name'] ?? ''));
$massnahme = trim((string)($data['massnahme'] ?? ''));
$rolle     = trim((string)($data['rolle'] ?? ''));
$password  = (string)($data['password'] ?? '');
$gruppe    = trim((string)($data['gruppe'] ?? '')); // leer ok

if ($name === '' || $massnahme === '' || $rolle === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>'Fehlende Felder'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (!in_array($rolle, $ALLOWED_ROLES, true)) {
  respond(400, ['ok'=>false, 'error'=>'Ungültige Rolle']);
}

// Duplikat verhindern – UNIQUE(name, massnahme, rolle)
$stmt = $pdo->prepare('SELECT id FROM teilnehmer WHERE name = ? AND massnahme = ? AND rolle = ? LIMIT 1');
$stmt->execute([$name, $massnahme, $rolle]);
$exists = $stmt->fetch();
if ($exists) {
  respond(409, ['ok'=>false, 'error'=>'Eintrag existiert bereits']);
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO teilnehmer (name, massnahme, gruppe, rolle, passwort_hash) VALUES (?,?,?,?,?)');
$stmt->execute([$name, $massnahme, $gruppe, $rolle, $hash]);

respond(201, ['ok'=>true, 'user'=>[
  'id'        => (int)$pdo->lastInsertId(),
  'name'      => $name,
  'massnahme' => $massnahme,
  'gruppe'    => $gruppe,
  'rolle'     => $rolle
]]);
