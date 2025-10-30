<?php
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['name'])) {
  http_response_code(400);
  echo "نام میز دریافت نشد.";
  exit;
}

$tableFile = 'table.json';

// بررسی وجود و صحت json
$tables = [];
if (file_exists($tableFile)) {
  $json = file_get_contents($tableFile);
  $tables = json_decode($json, true);
  if (!is_array($tables)) {
    $tables = [];
  }
}

$newId = count($tables) > 0 ? max(array_map('intval', array_column($tables, 'id'))) + 1 : 1;
$tables[] = [ 'id' => (string)$newId, 'name' => $data['name'] ];

$result = file_put_contents($tableFile, json_encode($tables, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
if ($result === false) {
  http_response_code(500);
  echo 'خطا در ذخیره فایل table.json';
  exit;
}
echo "OK";