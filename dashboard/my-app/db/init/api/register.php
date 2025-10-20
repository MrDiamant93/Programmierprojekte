<?php
declare(strict_types=1);

require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

$in        = read_json();
$name      = trim($in['name']       ?? '');
$massnahme = trim($in['massnahme']  ?? '');
$rolle     = trim($in['rolle']      ?? '');
$gruppe    = trim($in['gruppe']     ?? '');
$pass      = (string)($in['password'] ?? '');

if ($name === '' || $massnahme === '' || $rolle === '' || $pass === '') {
  respond(400, ['ok'=>false, 'error'=>'Fehlende Felder']);
}

$allowed = ['Teilnehmer','Azubi','Fachbereichsleiter'];
if (!in_array($rolle, $allowed, true)) {
  respond(400, ['ok'=>false, 'error'=>'Ungültige Rolle']);
}

// Duplicate verhindern (gleicher Name + Maßnahme + Rolle)
$stmt = $pdo->prepare('SELECT 1 FROM teilnehmer WHERE name = ? AND massnahme = ? AND rolle = ? LIMIT 1');
$stmt->execute([$name, $massnahme, $rolle]);
if ($stmt->fetch()) {
  respond(409, ['ok'=>false, 'error'=>'Eintrag existiert bereits']);
}

$hash = password_hash($pass, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO teilnehmer (name, massnahme, gruppe, rolle, passwort_hash)
                       VALUES (?,?,?,?,?)');
$stmt->execute([$name, $massnahme, $gruppe, $rolle, $hash]);

respond(201, ['ok'=>true, 'user'=>[
  'id'        => (int)$pdo->lastInsertId(),
  'name'      => $name,
  'massnahme' => $massnahme,
  'gruppe'    => $gruppe,
  'rolle'     => $rolle,
]]);
