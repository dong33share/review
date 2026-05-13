const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwCJjhNAsK1HL0ENyNedzNpIWTP_oPjezKs-s-wD0igr6Ke74gdax0bAUkME3TB34g/exec';
const BANK_CODE       = 'ACB';
const BANK_ACCOUNT    = '118996909';

document.addEventListener('DOMContentLoaded', () => {
  const price     = parseInt(sessionStorage.getItem('booking_price') || '169000', 10);
  const bookingId = sessionStorage.getItem('booking_id') || '';

  // Hiển thị số tiền
  document.getElementById('pay-amount').textContent   = fmt(price);
  document.getElementById('pay-subtotal').textContent = fmt(price);

  // Tạo QR thật từ SePay VietQR
  if (bookingId && price > 0) {
    const qrUrl = `https://qr.sepay.vn/img?bank=${BANK_CODE}&acc=${BANK_ACCOUNT}&template=compact&amount=${price}&des=${bookingId}`;
    const qrImg = document.getElementById('qr-image');
    qrImg.onload = () => {
      qrImg.style.display = '';
      document.getElementById('qr-fallback').style.display = 'none';
    };
    qrImg.src = qrUrl;
  }

  // Scanline animation
  const qrWrap = document.querySelector('.relative .w-52');
  if (qrWrap) {
    const line = document.createElement('div');
    line.className = 'qr-scanline';
    qrWrap.appendChild(line);
  }

  startCountdown(10 * 60);
  if (bookingId) startPolling(bookingId);
});

// ── Countdown ────────────────────────────────────
function startCountdown(seconds) {
  const el = document.getElementById('countdown');
  let remaining = seconds;

  const tick = () => {
    if (remaining <= 0) {
      el.textContent = '00:00';
      el.classList.replace('text-orange', 'text-red-500');
      return;
    }
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    if (remaining <= 60) el.classList.add('countdown-urgent');
    remaining--;
    setTimeout(tick, 1000);
  };
  tick();
}

// ── Polling — kiểm tra thanh toán ───────────────
function startPolling(bookingId) {
  let attempts = 0;
  const MAX    = 200; // ~10 phút ở 3s/lần

  const poll = async () => {
    if (attempts >= MAX) return;
    attempts++;
    try {
      const res  = await fetch(`${APPS_SCRIPT_URL}?check_booking=${bookingId}`);
      const data = await res.json();
      if (data.status === 'paid') {
        window.location.href = 'success.html';
        return;
      }
    } catch (_) {}
    setTimeout(poll, 3000);
  };

  setTimeout(poll, 3000);
}

function fmt(n) {
  return Number(n).toLocaleString('vi-VN') + 'đ';
}
