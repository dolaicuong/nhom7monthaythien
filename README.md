# Project nguoi thu 3: Khach hang va giao dich

Project nay phu trach quan ly khach hang, lap hoa don ban sach va thu no.

## Chuc nang
- Tim kiem, them, sua, xoa khach hang
- Lap hoa don cho mot khach hang va mot dau sach
- Kiem tra gioi han no va ton kho theo THAMSO
- Tu dong tru ton kho va cong no sau khi lap hoa don
- Lap phieu thu, khong cho thu vuot no theo quy dinh
- Xem lich su hoa don va phieu thu

## Cai dat
1. Import `database/schema.sql` vao MySQL.
2. Sua thong tin ket noi trong `api/config/database.php` neu can.
3. Dat thu muc trong `htdocs` neu dung XAMPP.
4. Mo `http://localhost/Quanlymuontrasach_Nguoi3_CustomersSales/`.

## Khi ghep voi module nguoi thu 2
Module nay dung chung cac bang `SACH` va `THAMSO`. Trong database chung, chi dung mot bo schema tong hop; khong import schema rieng cua tung project vao database da co ma chua doi chieu cac cot `THAMSO`.

## API
- `GET/POST/PUT/DELETE api/khachhang.php`
- `GET/POST api/hoadon.php`
- `GET/POST api/phieuthu.php`
- `GET api/cauhinh.php`

Project mau chua bat dang nhap de co the chay doc lap khi demo. Can bao ve API truoc khi dua len moi truong that.
