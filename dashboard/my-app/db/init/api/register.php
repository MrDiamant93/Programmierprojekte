<?php
require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

$in = read_json();
$name      = trim($in['name']      ?? '');
$massnahme = trim($in['massnahme'] ?? '');
$rolle     = trim($in['rolle']     ?? '');
$pass      = $in['password']       ?? '';

if ($name === '' || $massnahme === '' || $pass === '') {
  respond(400, ['ok'=>false, 'error'=>'Fehlende Felder']);
}

$ALLOWED_ROLES = ['Teilnehmer','Azubi','Fachbereichsleiter'];
if ($rolle === '' || !in_array($rolle, $ALLOWED_ROLES, true)) {
  respond(400, ['ok'=>false, 'error'=>'Ungültige Rolle']);
}

if (strlen($pass) < 6) {
  respond(400, ['ok'=>false, 'error'=>'Passwort zu kurz (min. 6 Zeichen)']);
}

$stmt = $pdo->prepare('SELECT id FROM teilnehmer WHERE name=? AND massnahme=? AND rolle=?');
$stmt->execute([$name, $massnahme, $rolle]);
if ($stmt->fetch()) {
  respond(409, ['ok'=>false, 'error'=>'Eintrag existiert bereits']);
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO teilnehmer (name, massnahme, rolle, passwort_hash) VALUES (?,?,?,?)');
$stmt->execute([$name, $massnahme, $rolle, $hash]);

respond(201, ['ok'=>true, 'user'=>[
  'id'        => (int)$pdo->lastInsertId(),
  'name'      => $name,
  'massnahme' => $massnahme,
  'rolle'     => $rolle
]]);
