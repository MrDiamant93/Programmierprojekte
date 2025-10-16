<?php
require __DIR__ . '/bootstrap.php';
respond(200, [
  'ok' => true,
  'service' => 'api',
  'time' => date('c')
]);
