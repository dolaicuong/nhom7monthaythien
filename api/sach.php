<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('API sach cua module nay chi ho tro GET.', 405);

$search = trim($_GET['search'] ?? '');
$sql = 'SELECT MaSach, TenSach, TheLoai, TacGia, SoLuongTon, DonGia FROM SACH';
if ($search !== '') {
    $sql .= ' WHERE TenSach LIKE :search OR TacGia LIKE :search OR TheLoai LIKE :search';
}
$sql .= ' ORDER BY TenSach ASC';

$stmt = $conn->prepare($sql);
$stmt->execute($search !== '' ? ['search' => "%$search%"] : []);
json_success($stmt->fetchAll());
