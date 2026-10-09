async function renderKhachHang() {
    setPageTitle('Khách hàng');
    setContent(`
        <header class="page-heading">
            <div><p class="eyebrow">Danh bạ khách hàng</p><h1>Khách hàng</h1></div>
            <button class="btn btn-primary" onclick="showAddKhachHangModal()">+ Thêm khách hàng</button>
        </header>
        <div class="toolbar">
            <input class="search-field" id="inpSearchKH" type="search" placeholder="Tìm tên, mã hoặc số điện thoại" onkeydown="if(event.key==='Enter') loadKhachHang()" />
            <button class="btn btn-primary" onclick="loadKhachHang()">Tìm kiếm</button>
            <button class="btn btn-quiet" onclick="document.getElementById('inpSearchKH').value='';loadKhachHang()">Xóa lọc</button>
        </div>
        <section class="panel"><div class="table-wrap"><table>
            <thead><tr><th>Mã khách</th><th>Khách hàng</th><th>Liên hệ</th><th>Địa chỉ</th><th>Công nợ</th><th>Thao tác</th></tr></thead>
            <tbody id="tblKHBody"><tr><td colspan="6" class="empty-state">Đang tải dữ liệu...</td></tr></tbody>
        </table></div></section>
    `);
    window.KHDataMap = {};
    await loadKhachHang();
}

async function loadKhachHang() {
    const body = document.getElementById('tblKHBody');
    if (!body) return;
    const search = document.getElementById('inpSearchKH')?.value || '';
    const response = await api.getKhachHang(search);
    if (!response?.success) {
        body.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(response?.message || 'Không tải được dữ liệu.')}</td></tr>`;
        return;
    }
    if (!response.data.length) {
        body.innerHTML = '<tr><td colspan="6" class="empty-state">Không tìm thấy khách hàng.</td></tr>';
        return;
    }
    window.KHDataMap = Object.fromEntries(response.data.map((item) => [item.MaKhachHang, item]));
    body.innerHTML = response.data.map((item) => `
        <tr>
            <td><span class="pill">${escapeHtml(item.MaKhachHang)}</span></td>
            <td class="primary-cell">${escapeHtml(item.HoTenKhachHang)}</td>
            <td>${escapeHtml(item.DienThoai || 'Chưa có số')}<span class="sub-cell">${escapeHtml(item.Email || '')}</span></td>
            <td>${escapeHtml(item.DiaChi || '—')}</td>
            <td><span class="pill ${Number(item.SoTienNo) > 0 ? 'debt' : 'clear'}">${money(item.SoTienNo)}</span></td>
            <td><div class="actions">
                <button class="btn btn-quiet btn-small" onclick="showEditKhachHangModal('${escapeHtml(item.MaKhachHang)}')">Sửa</button>
                <button class="btn btn-danger btn-small" onclick="deleteKhachHang('${escapeHtml(item.MaKhachHang)}')">Xóa</button>
            </div></td>
        </tr>`).join('');
}

function customerForm(customer = {}) {
    const editing = Boolean(customer.MaKhachHang);
    return `
        <form id="frmKH" onsubmit="event.preventDefault();submitKhachHang('${editing ? 'edit' : 'add'}','${escapeHtml(customer.MaKhachHang || '')}')">
            <div id="frmKHErr" class="alert error" hidden></div>
            <div class="form-group"><label for="khMa">Mã khách hàng</label><input id="khMa" required ${editing ? 'disabled' : ''} value="${escapeHtml(customer.MaKhachHang || '')}" placeholder="VD: KH001" /></div>
            <div class="form-group"><label for="khTen">Họ tên</label><input id="khTen" required value="${escapeHtml(customer.HoTenKhachHang || '')}" /></div>
            <div class="form-row">
                <div class="form-group"><label for="khDT">Điện thoại</label><input id="khDT" value="${escapeHtml(customer.DienThoai || '')}" /></div>
                <div class="form-group"><label for="khMail">Email</label><input id="khMail" type="email" value="${escapeHtml(customer.Email || '')}" /></div>
            </div>
            <div class="form-group"><label for="khDiaChi">Địa chỉ</label><input id="khDiaChi" value="${escapeHtml(customer.DiaChi || '')}" /></div>
        </form>`;
}

function showAddKhachHangModal() {
    showModal('Thêm khách hàng', customerForm(), '<button class="btn btn-quiet" onclick="closeModal()">Hủy</button><button class="btn btn-primary" onclick="document.getElementById(\'frmKH\').requestSubmit()">Lưu khách hàng</button>');
}

function showEditKhachHangModal(id) {
    const customer = window.KHDataMap[id];
    if (!customer) return;
    showModal('Cập nhật khách hàng', customerForm(customer), '<button class="btn btn-quiet" onclick="closeModal()">Hủy</button><button class="btn btn-primary" onclick="document.getElementById(\'frmKH\').requestSubmit()">Lưu thay đổi</button>');
}

async function submitKhachHang(mode, id) {
    const error = document.getElementById('frmKHErr');
    const data = {
        MaKhachHang: document.getElementById('khMa').value.trim() || id,
        HoTenKhachHang: document.getElementById('khTen').value.trim(),
        DienThoai: document.getElementById('khDT').value.trim(),
        Email: document.getElementById('khMail').value.trim(),
        DiaChi: document.getElementById('khDiaChi').value.trim()
    };
    if (!data.MaKhachHang || !data.HoTenKhachHang) {
        error.hidden = false;
        error.textContent = 'Hãy nhập mã khách hàng và họ tên.';
        return;
    }
    const response = mode === 'add' ? await api.addKhachHang(data) : await api.updateKhachHang(id, data);
    if (!response.success) {
        error.hidden = false;
        error.textContent = response.message;
        return;
    }
    closeModal();
    await loadKhachHang();
}

async function deleteKhachHang(id) {
    if (!confirm(`Xóa khách hàng ${id}? Khách đã có hóa đơn sẽ không thể xóa.`)) return;
    const response = await api.deleteKhachHang(id);
    if (!response.success) {
        alert(response.message);
        return;
    }
    await loadKhachHang();
}
