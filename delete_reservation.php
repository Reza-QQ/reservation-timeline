<?php
// دریافت داده‌های ارسال‌شده از کلاینت
$data = json_decode(file_get_contents("php://input"), true);

// بررسی کامل بودن داده‌ها
if (
  !$data ||
  !isset($data['table_id'], $data['date'], $data['old_start_time'], $data['customer'], $data['start_time'], $data['end_time'])
) {
  http_response_code(400);
  echo "اطلاعات ناقص است.";
  exit;
}

// مسیر فایل رزروها
$resFile = 'reservations.json';

// بررسی وجود فایل
if (!file_exists($resFile)) {
  http_response_code(404);
  echo "فایل رزروها یافت نشد.";
  exit;
}

// خواندن رزروهای موجود
$reservations = json_decode(file_get_contents($resFile), true);

// یافتن رزرو مورد نظر برای ویرایش
$found = false;
$foundIndex = -1;

foreach ($reservations as $index => $res) {
  if (
    $res['table_id'] == $data['table_id'] &&
    $res['date'] == $data['date'] &&
    $res['start_time'] == $data['old_start_time']
  ) {
    $found = true;
    $foundIndex = $index;
    break;
  }
}

if (!$found) {
  http_response_code(404);
  echo "رزرو مورد نظر یافت نشد.";
  exit;
}
// حذف رزرو مورد نظر
array_splice($reservations, $foundIndex, 1);
file_put_contents($resFile, json_encode($reservations));

// ذخیره در فایل
file_put_contents($resFile, json_encode($reservations, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// پاسخ موفقیت
echo "رزرو با موفقیت حذف شد.";  
?>