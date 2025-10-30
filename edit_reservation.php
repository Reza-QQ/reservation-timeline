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

// خواندن تنظیمات برنامه
$settingsFile = 'settings.json';
$settings = file_exists($settingsFile)
  ? json_decode(file_get_contents($settingsFile), true)
  : null;

if (!$settings || !isset($settings['start_time'], $settings['end_time'])) {
  http_response_code(500);
  echo "تنظیمات برنامه یافت نشد.";
  exit;
}

// بررسی بازه زمانی رزرو با بازه مجاز برنامه
if ($data['start_time'] < $settings['start_time'] || $data['end_time'] > $settings['end_time']) {
  http_response_code(400);
  echo "بازه زمانی خارج از ساعت کاری است.";
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

// بررسی تداخل زمانی با سایر رزروها (به جز رزرو در حال ویرایش)
foreach ($reservations as $index => $res) {
  // نادیده گرفتن رزرو در حال ویرایش
  if ($index == $foundIndex) {
    continue;
  }

  // فقط برای همان میز و همان تاریخ
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

// به‌روزرسانی رزرو
$reservations[$foundIndex]['customer'] = $data['customer'];
$reservations[$foundIndex]['start_time'] = $data['start_time'];
$reservations[$foundIndex]['end_time'] = $data['end_time'];

// ذخیره در فایل
file_put_contents($resFile, json_encode($reservations, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// پاسخ موفقیت
echo "رزرو با موفقیت ویرایش شد.";
