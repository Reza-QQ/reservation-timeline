<?php
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['id'])) {
  http_response_code(400);
  echo "شناسه میز دریافت نشد.";
  exit;
}

$tableFile = 'table.json';
$resFile = 'reservations.json';

// بررسی وجود فایل میزها
if (!file_exists($tableFile)) {
  http_response_code(404);
  echo "فایل میزها یافت نشد.";
  exit;
}

// حذف میز از فایل table.json
$tables = json_decode(file_get_contents($tableFile), true);
$found = false;

$tables = array_filter($tables, function ($table) use ($data, &$found) {
  if ($table['id'] == $data['id']) {
    $found = true;
    return false; // حذف شود
  }
  return true;
});

if (!$found) {
  http_response_code(404);
  echo "میز مورد نظر یافت نشد.";
  exit;
}

file_put_contents($tableFile, json_encode(array_values($tables), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// حذف رزروهای مربوط به میز از فایل reservations.json
if (file_exists($resFile)) {
  $reservations = json_decode(file_get_contents($resFile), true);

  $reservations = array_filter($reservations, function ($res) use ($data) {
    return $res['table_id'] != $data['id']; // فقط رزروهای غیرمرتبط باقی بمانند
  });

  file_put_contents($resFile, json_encode(array_values($reservations), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

echo "میز و رزروهای مرتبط با موفقیت حذف شدند.";