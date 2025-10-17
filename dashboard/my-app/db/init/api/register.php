<?php
require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

$in        = read_json();
$name      = trim($in['name']      ?? '');
$massnahme = trim($in['massnahme'] ?? '');
$gruppe    = trim($in['gruppe']    ?? '');
$rolle     = trim($in['rolle']     ?? '');
$pass      = $in['password']       ?? '';

if ($name === '' || $massnahme === '' || $gruppe === '' || $pass === '') {
  respond(400, ['ok'=>false, 'error'=>'Fehlende Felder']);
}

$ALLOWED_ROLES = ['Teilnehmer','Azubi','Fachbereichsleiter'];
if ($rolle === '' || !in_array($rolle, $ALLOWED_ROLES, true)) {
  $rolle = 'Teilnehmer';
}

$stmt = $pdo->prepare('SELECT 1 FROM teilnehmer WHERE name=? AND massnahme=? AND gruppe=? AND rolle=?');
$stmt->execute([$name, $massnahme, $gruppe, $rolle]);
if ($stmt->fetch()) {
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
