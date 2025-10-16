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

$stmt = $pdo->prepare('SELECT id, passwort_hash FROM teilnehmer WHERE name=? AND massnahme=? AND rolle=?');
$stmt->execute([$name, $massnahme, $rolle]);
$row = $stmt->fetch();

if (!$row || !password_verify($pass, $row['passwort_hash'])) {
  respond(401, ['ok'=>false,'error'=>'Anmeldedaten falsch']);
}

respond(200, ['ok'=>true, 'user'=>[
  'id'        => (int)$row['id'],
  'name'      => $name,
  'massnahme' => $massnahme,
  'rolle'     => $rolle
]]);
