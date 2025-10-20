<?php
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['name'])) {
  http_response_code(400);
  echo "نام میز دریافت نشد.";
  exit;
}

$tableFile = 'table.json';
$tables = file_exists($tableFile) ? json_decode(file_get_contents($tableFile), true) : [];

$newId = count($tables) > 0 ? max(array_column($tables, 'id')) + 1 : 1;
$tables[] = [ 'id' => $newId, 'name' => $data['name'] ];

file_put_contents($tableFile, json_encode($tables, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo "OK";