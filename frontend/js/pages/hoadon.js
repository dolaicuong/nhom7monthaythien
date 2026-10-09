async function renderHoaDon() {
    setPageTitle('Hóa đơn');
    showLoading(true);
    const [rulesRes, customersRes, booksRes, invoicesRes] = await Promise.all([
        api.getCauHinh(), api.getKhachHang(), api.getSach(), api.getHoaDon()
    ]);
    showLoading(false);
    const rules = rulesRes?.data || {};
    const customers = customersRes?.data || [];
    const books = booksRes?.data || [];
    const invoices = invoicesRes?.data || [];
    const customerOptions = customers.map((item) => `<option value="${escapeHtml(item.MaKhachHang)}">${escapeHtml(item.HoTenKhachHang)} · nợ ${money(item.SoTienNo)}</option>`).join('');
    const bookOptions = books.map((item) => `<option value="${escapeHtml(item.MaSach)}">${escapeHtml(item.TenSach)} · tồn ${item.SoLuongTon} · giá ${money(Number(item.DonGia) * Number(rules.DonGiaBanYeuCau || 1))}</option>`).join('');
    const rows = invoices.length ? invoices.map((item) => `
        <tr><td><span class="pill">HD${escapeHtml(item.MaPhieuHoaDon)}</span></td><td>${escapeHtml(item.NgayLapHoaDon)}</td><td class="primary-cell">${escapeHtml(item.HoTenKhachHang)}</td><td>${escapeHtml(item.DanhSachSach || '—')}</td><td>${Number(item.TongSoLuong) || 0}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">Chưa có hóa đơn.</td></tr>';

    setContent(`
        <header class="page-heading"><div><p class="eyebrow">Bán hàng</p><h1>Lập hóa đơn</h1></div><p class="heading-note">Giao dịch sẽ cập nhật tồn kho sách và công nợ khách hàng trong cùng một lần lưu.</p></header>
        <div class="workspace-grid">
            <section class="panel section-panel">
                <h2 class="section-title">Hóa đơn mới</h2>
                <div id="msgHoaDon" class="alert" hidden></div>
                <form id="frmHoaDon" onsubmit="event.preventDefault();submitHoaDon()">
                    <div class="form-group"><label for="hdKhachHang">Khách hàng</label><select id="hdKhachHang" required><option value="">Chọn khách hàng</option>${customerOptions}</select></div>
                    <div class="form-group"><label for="hdSach">Sách bán</label><select id="hdSach" required><option value="">Chọn sách</option>${bookOptions}</select></div>
                    <div class="form-group"><label for="hdSoLuong">Số lượng</label><input type="number" id="hdSoLuong" min="1" value="1" required /></div>
                    <button class="btn btn-primary" type="submit">Xác nhận hóa đơn</button>
                </form>
            </section>
            <aside class="panel section-panel"><h2 class="section-title">Quy định bán hàng</h2>
                <ul class="rule-list">
                    <li><span>Nợ tối đa</span><strong>${money(rules.SoTienNoToiDa)}</strong></li>
                    <li><span>Tồn tối thiểu sau bán</span><strong>${Number(rules.SoLuongTonSauToiThieu) || 0} cuốn</strong></li>
                    <li><span>Hệ số giá bán</span><strong>${Number(rules.DonGiaBanYeuCau) || 0} × giá nhập</strong></li>
                </ul>
            </aside>
        </div>
        <section class="panel"><div class="table-wrap"><table>
            <thead><tr><th>Mã hóa đơn</th><th>Ngày lập</th><th>Khách hàng</th><th>Sách</th><th>Tổng số lượng</th></tr></thead>
            <tbody>${rows}</tbody>
        </table></div></section>
    `);
}

async function submitHoaDon() {
    const message = document.getElementById('msgHoaDon');
    const data = {
        MaKhachHang: document.getElementById('hdKhachHang').value,
        MaSach: document.getElementById('hdSach').value,
        SoLuong: Number(document.getElementById('hdSoLuong').value)
    };
    showLoading(true);
    const response = await api.addHoaDon(data);
    showLoading(false);
    message.hidden = false;
    message.className = `alert ${response.success ? 'success' : 'error'}`;
    message.textContent = response.success
        ? `${response.message} Tổng tiền: ${money(response.data?.TongTien)}.`
        : response.message;
    if (response.success) {
        document.getElementById('frmHoaDon').reset();
        setTimeout(() => renderHoaDon(), 1100);
    }
}
