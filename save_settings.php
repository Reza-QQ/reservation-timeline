<?php
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['app_name'], $data['start_time'], $data['end_time'])) {
  http_response_code(400);
  echo "اطلاعات ناقص است.";
  exit;
}

file_put_contents('settings.json', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo "OK";