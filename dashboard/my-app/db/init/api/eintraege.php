<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
require __DIR__.'/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper: parse int
function to_int($v) {
  if (is_null($v)) return null;
  if (is_numeric($v)) return (int)$v;
  return (int)preg_replace('/\D+/', '', (string)$v);
}

if ($method === 'GET') {
  $teilnehmerId = isset($_GET['teilnehmer_id']) ? to_int($_GET['teilnehmer_id']) : null;
  if ($teilnehmerId) {
    $stmt = $pdo->prepare('SELECT id, teilnehmer_id, typ, start, ende, titel, beschreibung, created_at
                           FROM eintraege
                           WHERE teilnehmer_id = ?
                           ORDER BY start DESC');
    $stmt->execute([$teilnehmerId]);
    $rows = $stmt->fetchAll();
  } else {
    $stmt = $pdo->query('SELECT id, teilnehmer_id, typ, start, ende, titel, beschreibung, created_at
                         FROM eintraege
                         ORDER BY start DESC');
    $rows = $stmt->fetchAll();
  }
  respond(200, ['ok'=>true, 'items'=>$rows]);
}

if ($method === 'POST') {
  $in = read_json();
  $teilnehmer_id = to_int($in['teilnehmer_id'] ?? null);
  $typ = strtolower(trim($in['typ'] ?? ''));
  $start = trim($in['start'] ?? '');
  $ende  = trim($in['ende'] ?? '');
  $titel = trim($in['titel'] ?? '');
  $beschreibung = trim($in['beschreibung'] ?? '');

  if (!$teilnehmer_id || ($typ !== 'urlaub' && $typ !== 'termin') || $start === '') {
    respond(400, ['ok'=>false, 'error'=>'Ungültige Eingabe']);
  }

  // Basic datetime validation (expects 'YYYY-MM-DD HH:MM' or 'YYYY-MM-DD')
  // Normalize: if only date is given, set 00:00:00
  if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $start)) $start .= ' 00:00:00';
  if ($ende !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $ende)) $ende .= ' 23:59:59';

  // Insert
  $stmt = $pdo->prepare('INSERT INTO eintraege (teilnehmer_id, typ, start, ende, titel, beschreibung)
                         VALUES (?,?,?,?,?,?)');
  $stmt->execute([$teilnehmer_id, $typ, $start, ($ende !== '' ? $ende : null), $titel, $beschreibung]);

  respond(201, ['ok'=>true, 'id'=>(int)$pdo->lastInsertId()]);
}

if ($method === 'DELETE') {
  // Simple delete by id
  $id = isset($_GET['id']) ? to_int($_GET['id']) : null;
  if (!$id) respond(400, ['ok'=>false, 'error'=>'id fehlt']);
  $stmt = $pdo->prepare('DELETE FROM eintraege WHERE id = ?');
  $stmt->execute([$id]);
  respond(200, ['ok'=>true]);
}

respond(405, ['ok'=>false, 'error'=>'Methode nicht erlaubt']);
