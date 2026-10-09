const API_BASE = '../api';

async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        const data = await response.json();
        if (!response.ok && data.success) return { success: false, message: 'Yêu cầu không thành công.' };
        return data;
    } catch (error) {
        console.error('API error:', error);
        return { success: false, message: 'Không thể kết nối API. Hãy kiểm tra PHP và MySQL đang chạy.' };
    }
}

const api = {
    getKhachHang: (search = '') => apiFetch(`/khachhang.php${search ? '?search=' + encodeURIComponent(search) : ''}`),
    addKhachHang: (data) => apiFetch('/khachhang.php', { method: 'POST', body: JSON.stringify(data) }),
    updateKhachHang: (id, data) => apiFetch('/khachhang.php?id=' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(data) }),
    deleteKhachHang: (id) => apiFetch('/khachhang.php?id=' + encodeURIComponent(id), { method: 'DELETE' }),
    getHoaDon: () => apiFetch('/hoadon.php'),
    addHoaDon: (data) => apiFetch('/hoadon.php', { method: 'POST', body: JSON.stringify(data) }),
    getPhieuThu: () => apiFetch('/phieuthu.php'),
    addPhieuThu: (data) => apiFetch('/phieuthu.php', { method: 'POST', body: JSON.stringify(data) }),
    getCauHinh: () => apiFetch('/cauhinh.php'),
    getSach: (search = '') => apiFetch(`/sach.php${search ? '?search=' + encodeURIComponent(search) : ''}`)
};
