async function renderPhieuThu() {
    setPageTitle('Phiếu thu');
    showLoading(true);
    const [customersRes, receiptsRes] = await Promise.all([api.getKhachHang(), api.getPhieuThu()]);
    showLoading(false);
    const customers = customersRes?.data || [];
    const receipts = receiptsRes?.data || [];
    const owing = customers.filter((item) => Number(item.SoTienNo) > 0);
    const options = owing.map((item) => `<option value="${escapeHtml(item.MaKhachHang)}" data-debt="${Number(item.SoTienNo)}">${escapeHtml(item.HoTenKhachHang)} · nợ ${money(item.SoTienNo)}</option>`).join('');
    const rows = receipts.length ? receipts.map((item) => `
        <tr><td><span class="pill">PT${escapeHtml(item.MaPhieuThu)}</span></td><td>${escapeHtml(item.NgayThuTien)}</td><td class="primary-cell">${escapeHtml(item.HoTenKhachHang)}</td><td><span class="pill clear">+${money(item.SoTienThu)}</span></td><td>${money(item.SoTienNo)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">Chưa có phiếu thu.</td></tr>';

    setContent(`
        <header class="page-heading"><div><p class="eyebrow">Công nợ</p><h1>Phiếu thu tiền</h1></div><p class="heading-note">Ghi nhận khoản thanh toán và giảm nợ khách hàng ngay sau khi xác nhận.</p></header>
        <div class="workspace-grid">
            <section class="panel section-panel">
                <h2 class="section-title">Ghi nhận thanh toán</h2>
                <div id="msgPhieuThu" class="alert" hidden></div>
                <form id="frmPhieuThu" onsubmit="event.preventDefault();submitPhieuThu()">
                    <div class="form-group"><label for="ptKhachHang">Khách hàng đang nợ</label><select id="ptKhachHang" required onchange="updateDebtLimit()"><option value="">${owing.length ? 'Chọn khách hàng' : 'Không có khách hàng đang nợ'}</option>${options}</select></div>
                    <div class="form-group"><label for="ptSoTien">Số tiền thu (VND)</label><input type="number" id="ptSoTien" min="1" step="1" required placeholder="Nhập số tiền" /><button class="btn btn-quiet btn-small" style="margin-top:8px" type="button" onclick="fillFullDebt()">Thu toàn bộ nợ</button></div>
                    <button class="btn btn-primary" type="submit" ${owing.length ? '' : 'disabled'}>Xác nhận thu tiền</button>
                </form>
            </section>
            <aside class="panel section-panel"><h2 class="section-title">Quy trình thu nợ</h2>
                <ul class="rule-list"><li><span>Giới hạn khoản thu</span><strong>Không vượt quá số nợ</strong></li><li><span>Cập nhật công nợ</span><strong>Tự động sau khi lưu</strong></li></ul>
            </aside>
        </div>
        <section class="panel"><div class="table-wrap"><table>
            <thead><tr><th>Mã phiếu</th><th>Ngày thu</th><th>Khách hàng</th><th>Số tiền thu</th><th>Nợ hiện tại</th></tr></thead>
            <tbody>${rows}</tbody>
        </table></div></section>
    `);
}

function updateDebtLimit() {
    const select = document.getElementById('ptKhachHang');
    const debt = Number(select.selectedOptions[0]?.dataset.debt || 0);
    const amount = document.getElementById('ptSoTien');
    amount.max = debt || '';
}

function fillFullDebt() {
    const select = document.getElementById('ptKhachHang');
    document.getElementById('ptSoTien').value = select.selectedOptions[0]?.dataset.debt || '';
}

async function submitPhieuThu() {
    const message = document.getElementById('msgPhieuThu');
    const data = {
        MaKhachHang: document.getElementById('ptKhachHang').value,
        SoTienThu: Number(document.getElementById('ptSoTien').value)
    };
    showLoading(true);
    const response = await api.addPhieuThu(data);
    showLoading(false);
    message.hidden = false;
    message.className = `alert ${response.success ? 'success' : 'error'}`;
    message.textContent = response.success
        ? `${response.message} Nợ còn lại: ${money(response.data?.NoConLai)}.`
        : response.message;
    if (response.success) setTimeout(() => renderPhieuThu(), 1000);
}
