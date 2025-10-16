<?php
require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  respond(405, ['ok'=>false, 'error'=>'Nur GET erlaubt']);
}

$stmt = $pdo->query('SELECT id, name, massnahme, rolle FROM teilnehmer ORDER BY rolle, name');
$rows = $stmt->fetchAll();

respond(200, ['ok'=>true, 'count'=>count($rows), 'items'=>$rows]);
