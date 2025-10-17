<?php
require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

$in   = read_json();
$name = trim($in['name'] ?? '');
$pass = $in['password'] ?? '';

if ($name === '' || $pass === '') {
  respond(400, ['ok'=>false, 'error'=>'Fehlende Felder']);
}

$stmt = $pdo->prepare('SELECT id, name, massnahme, gruppe, rolle, passwort_hash FROM teilnehmer WHERE name=? ORDER BY id DESC');
$stmt->execute([$name]);
$rows = $stmt->fetchAll();
if (!$rows) {
  respond(401, ['ok'=>false,'error'=>'Anmeldedaten falsch']);
}

$matched = null;
foreach ($rows as $row) {
  if (password_verify($pass, $row['passwort_hash'])) {
    $matched = $row;
    break;
  }
}
if (!$matched) {
  respond(401, ['ok'=>false,'error'=>'Anmeldedaten falsch']);
}

respond(200, ['ok'=>true, 'user'=>[
  'id'        => (int)$matched['id'],
  'name'      => $matched['name'],
  'massnahme' => $matched['massnahme'],
  'gruppe'    => $matched['gruppe'],
  'rolle'     => $matched['rolle'],
]]);
