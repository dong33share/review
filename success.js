// ── Populate from sessionStorage ──
document.addEventListener('DOMContentLoaded', () => {
  const name  = sessionStorage.getItem('booking_name')  || 'Nguyễn Văn An';
  const phone = sessionStorage.getItem('booking_phone') || '0901 234 567';

  document.getElementById('msg-name').textContent  = name;
  document.getElementById('msg-phone').textContent = phone;
});

// ── Copy message to clipboard ──
function copyMessage() {
  const name  = sessionStorage.getItem('booking_name')  || 'Nguyễn Văn An';
  const phone = sessionStorage.getItem('booking_phone') || '0901 234 567';

  const text = `Chào Trạm Bảo Hiểm,

Tôi vừa đăng ký rà soát hợp đồng BHNT trên website.

Thông tin của tôi:
Họ Tên: ${name}
Số điện thoại: ${phone}

Mong được xác nhận lịch rà soát. Cảm ơn.`;

  navigator.clipboard.writeText(text)
    .then(showCopyToast)
    .catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopyToast();
    });
}

function showCopyToast() {
  const toast = document.getElementById('copy-toast');
  toast.classList.remove('hidden');
  toast.classList.add('flex');
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
  }, 3000);
}
