<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Phuong thuc khong hop le.', 405);
$rules = $conn->query('SELECT * FROM THAMSO LIMIT 1')->fetch();
if (!$rules) json_error('Chua co cau hinh ban hang.', 404);
json_success($rules);
