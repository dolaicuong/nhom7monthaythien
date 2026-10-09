<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_auth();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $sql = "SELECT pt.MaPhieuThu, pt.NgayThuTien, pt.SoTienThu, pt.MaKhachHang,
                       kh.HoTenKhachHang, kh.SoTienNo
                FROM PHIEUTHUTIEN pt
                JOIN KHACHHANG kh ON kh.MaKhachHang = pt.MaKhachHang
                ORDER BY pt.NgayThuTien DESC";
        json_success($conn->query($sql)->fetchAll());
        break;

    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $maKH = trim($body['MaKhachHang'] ?? '');
        $soTien = (float)($body['SoTienThu'] ?? 0);
        if ($maKH === '' || $soTien <= 0) json_error('Chon khach hang va nhap so tien thu lon hon 0.');

        $rule = $conn->query('SELECT QuyDinh FROM THAMSO LIMIT 1')->fetch();
        $conn->beginTransaction();
        try {
            $customer = $conn->prepare('SELECT SoTienNo FROM KHACHHANG WHERE MaKhachHang = ? FOR UPDATE');
            $customer->execute([$maKH]);
            $customerData = $customer->fetch();
            if (!$customerData) throw new DomainException('Khach hang khong ton tai.');

            $debt = (float)$customerData['SoTienNo'];
            if ((int)($rule['QuyDinh'] ?? 1) === 1 && $soTien > $debt) {
                throw new DomainException('So tien thu khong duoc vuot qua no hien tai (' . number_format($debt, 0, ',', '.') . ' VND).');
            }

            $stmt = $conn->prepare('INSERT INTO PHIEUTHUTIEN (MaKhachHang, NgayThuTien, SoTienThu) VALUES (?, NOW(), ?)');
            $stmt->execute([$maKH, $soTien]);
            $receiptId = $conn->lastInsertId();
            $conn->prepare('UPDATE KHACHHANG SET SoTienNo = SoTienNo - ? WHERE MaKhachHang = ?')->execute([$soTien, $maKH]);
            $conn->commit();

            json_success(['MaPhieuThu' => $receiptId, 'NoConLai' => $debt - $soTien], 'Lap phieu thu thanh cong.');
        } catch (DomainException $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            json_error($e->getMessage());
        } catch (Throwable $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            json_error('Khong the lap phieu thu do loi he thong.', 500);
        }
        break;

    default:
        json_error('Phuong thuc khong hop le.', 405);
}
