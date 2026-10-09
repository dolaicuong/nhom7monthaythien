<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_auth();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $sql = "SELECT hd.MaPhieuHoaDon, hd.NgayLapHoaDon, hd.MaKhachHang,
                       kh.HoTenKhachHang,
                       GROUP_CONCAT(s.TenSach SEPARATOR ', ') AS DanhSachSach,
                       SUM(ct.SoLuongBan) AS TongSoLuong
                FROM PHIEUHOADON hd
                LEFT JOIN KHACHHANG kh ON kh.MaKhachHang = hd.MaKhachHang
                LEFT JOIN CHITIETPHIEUHOADON ct ON ct.MaPhieuHoaDon = hd.MaPhieuHoaDon
                LEFT JOIN SACH s ON s.MaSach = ct.MaSach
                GROUP BY hd.MaPhieuHoaDon, hd.NgayLapHoaDon, hd.MaKhachHang, kh.HoTenKhachHang
                ORDER BY hd.NgayLapHoaDon DESC";
        json_success($conn->query($sql)->fetchAll());
        break;

    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $maKH = trim($body['MaKhachHang'] ?? '');
        $maSach = trim($body['MaSach'] ?? '');
        $soLuong = (int)($body['SoLuong'] ?? 0);
        if ($maKH === '' || $maSach === '' || $soLuong <= 0) json_error('Vui long chon khach hang, sach va so luong hop le.');

        $rules = $conn->query('SELECT * FROM THAMSO LIMIT 1')->fetch();
        if (!$rules) json_error('Chua co tham so ban hang.');

        $conn->beginTransaction();
        try {
            $customer = $conn->prepare('SELECT SoTienNo FROM KHACHHANG WHERE MaKhachHang = ? FOR UPDATE');
            $customer->execute([$maKH]);
            $customerData = $customer->fetch();
            if (!$customerData) throw new DomainException('Khach hang khong ton tai.');

            $book = $conn->prepare('SELECT SoLuongTon, DonGia FROM SACH WHERE MaSach = ? FOR UPDATE');
            $book->execute([$maSach]);
            $bookData = $book->fetch();
            if (!$bookData) throw new DomainException('Sach khong ton tai.');

            if ((float)$customerData['SoTienNo'] > (float)$rules['SoTienNoToiDa']) {
                throw new DomainException('Khach hang da vuot qua gioi han no. Vui long thu no truoc.');
            }
            $remaining = (int)$bookData['SoLuongTon'] - $soLuong;
            if ($soLuong > (int)$bookData['SoLuongTon']) throw new DomainException('So luong ban vuot qua ton kho.');
            if ($remaining < (int)$rules['SoLuongTonSauToiThieu']) throw new DomainException('Ton kho sau khi ban thap hon muc toi thieu.');

            $priceFactor = (float)$rules['DonGiaBanYeuCau'];
            $unitPrice = (float)$bookData['DonGia'] * $priceFactor;
            $total = $unitPrice * $soLuong;

            $invoice = $conn->prepare('INSERT INTO PHIEUHOADON (NgayLapHoaDon, MaKhachHang) VALUES (NOW(), ?)');
            $invoice->execute([$maKH]);
            $invoiceId = $conn->lastInsertId();

            $detail = $conn->prepare('INSERT INTO CHITIETPHIEUHOADON (MaPhieuHoaDon, MaSach, SoLuongBan) VALUES (?, ?, ?)');
            $detail->execute([$invoiceId, $maSach, $soLuong]);
            $conn->prepare('UPDATE SACH SET SoLuongTon = SoLuongTon - ? WHERE MaSach = ?')->execute([$soLuong, $maSach]);
            $conn->prepare('UPDATE KHACHHANG SET SoTienNo = SoTienNo + ? WHERE MaKhachHang = ?')->execute([$total, $maKH]);

            $conn->commit();
            json_success(['MaPhieuHoaDon' => $invoiceId, 'GiaBan' => $unitPrice, 'TongTien' => $total], 'Lap hoa don thanh cong.');
        } catch (DomainException $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            json_error($e->getMessage());
        } catch (Throwable $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            json_error('Khong the lap hoa don do loi he thong.', 500);
        }
        break;

    default:
        json_error('Phuong thuc khong hop le.', 405);
}
