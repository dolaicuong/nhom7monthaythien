<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_auth();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $search = trim($_GET['search'] ?? '');
        $sql = 'SELECT * FROM KHACHHANG';
        if ($search !== '') {
            $sql .= ' WHERE HoTenKhachHang LIKE :search OR DienThoai LIKE :search OR MaKhachHang LIKE :search';
        }
        $sql .= ' ORDER BY HoTenKhachHang ASC';
        $stmt = $conn->prepare($sql);
        $stmt->execute($search !== '' ? ['search' => "%$search%"] : []);
        json_success($stmt->fetchAll());
        break;

    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = trim($body['MaKhachHang'] ?? '');
        $name = trim($body['HoTenKhachHang'] ?? '');
        if ($id === '' || $name === '') json_error('Ma khach hang va ho ten khong duoc de trong.');

        $check = $conn->prepare('SELECT 1 FROM KHACHHANG WHERE MaKhachHang = ?');
        $check->execute([$id]);
        if ($check->fetchColumn()) json_error('Ma khach hang da ton tai.');

        $stmt = $conn->prepare('INSERT INTO KHACHHANG (MaKhachHang, HoTenKhachHang, DiaChi, DienThoai, Email, SoTienNo) VALUES (?, ?, ?, ?, ?, 0)');
        $stmt->execute([$id, $name, trim($body['DiaChi'] ?? ''), trim($body['DienThoai'] ?? ''), trim($body['Email'] ?? '')]);
        json_success(['MaKhachHang' => $id], 'Them khach hang thanh cong.');
        break;

    case 'PUT':
        $id = trim($_GET['id'] ?? '');
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim($body['HoTenKhachHang'] ?? '');
        if ($id === '') json_error('Thieu ma khach hang.');
        if ($name === '') json_error('Ho ten khong duoc de trong.');

        $check = $conn->prepare('SELECT 1 FROM KHACHHANG WHERE MaKhachHang = ?');
        $check->execute([$id]);
        if (!$check->fetchColumn()) json_error('Khong tim thay khach hang.', 404);

        $stmt = $conn->prepare('UPDATE KHACHHANG SET HoTenKhachHang = ?, DiaChi = ?, DienThoai = ?, Email = ? WHERE MaKhachHang = ?');
        $stmt->execute([$name, trim($body['DiaChi'] ?? ''), trim($body['DienThoai'] ?? ''), trim($body['Email'] ?? ''), $id]);
        json_success([], 'Cap nhat khach hang thanh cong.');
        break;

    case 'DELETE':
        $id = trim($_GET['id'] ?? '');
        if ($id === '') json_error('Thieu ma khach hang.');
        $check = $conn->prepare('SELECT COUNT(*) FROM PHIEUHOADON WHERE MaKhachHang = ?');
        $check->execute([$id]);
        if ((int)$check->fetchColumn() > 0) json_error('Khong the xoa khach hang da co hoa don.');

        $stmt = $conn->prepare('DELETE FROM KHACHHANG WHERE MaKhachHang = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) json_error('Khong tim thay khach hang.', 404);
        json_success([], 'Xoa khach hang thanh cong.');
        break;

    default:
        json_error('Phuong thuc khong hop le.', 405);
}
