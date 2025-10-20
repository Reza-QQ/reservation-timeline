<?php
// دریافت داده‌های ارسال‌شده از کلاینت
$data = json_decode(file_get_contents("php://input"), true);

// بررسی کامل بودن داده‌ها
if (
  !$data ||
  !isset($data['table_id'], $data['date'], $data['customer'], $data['start_time'], $data['end_time'])
) {
  http_response_code(400);
  echo "اطلاعات ناقص است.";
  exit;
}

// مسیر فایل رزروها
$resFile = 'reservations.json';

// خواندن رزروهای موجود
$reservations = file_exists($resFile)
  ? json_decode(file_get_contents($resFile), true)
  : [];

// بررسی تداخل زمانی فقط برای همان میز و همان تاریخ
foreach ($reservations as $res) {
  if ($res['table_id'] == $data['table_id'] && $res['date'] == $data['date']) {
    // بررسی هم‌پوشانی بازه زمانی
    if (
      ($data['start_time'] < $res['end_time']) &&
      ($data['end_time'] > $res['start_time'])
    ) {
      http_response_code(409);
      echo "تداخل زمانی با رزرو دیگر وجود دارد.";
      exit;
    }
  }
}

// افزودن رزرو جدید
$reservations[] = $data;

// ذخیره در فایل
file_put_contents($resFile, json_encode($reservations, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// پاسخ موفقیت
echo "رزرو با موفقیت ثبت شد.";