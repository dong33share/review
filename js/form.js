const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwCJjhNAsK1HL0ENyNedzNpIWTP_oPjezKs-s-wD0igr6Ke74gdax0bAUkME3TB34g/exec';

let CONFIG      = { BASE_PRICE: 169000 };
let appliedCode = null;

// ── Init: skeleton → fetch → render giá thật ──
document.addEventListener('DOMContentLoaded', async () => {
  const priceEl = document.querySelector('#price-original p');
  if (priceEl) priceEl.classList.add('price-skeleton');

  try {
    const res  = await fetch(APPS_SCRIPT_URL);
    const data = await res.json();
    if (data.config?.BASE_PRICE) CONFIG = data.config;
  } catch (_) {}

  if (priceEl) priceEl.classList.remove('price-skeleton');
  renderBasePrice();
});

function renderBasePrice() {
  const f = fmt(CONFIG.BASE_PRICE);
  const q = (sel) => document.querySelector(sel);
  if (q('#price-original p'))   q('#price-original p').textContent  = f;
  if (q('#price-discounted p')) q('#price-discounted p').textContent = f;
  const discEl = document.getElementById('discount-amount');
  if (discEl) discEl.textContent = '-' + f;
}

// ── Toggle mã hỗ trợ ──
function toggleCodeSection() {
  const section = document.getElementById('code-section');
  const chevron = document.getElementById('chevron-code');
  const isOpen  = !section.classList.contains('hidden');
  if (isOpen) {
    section.classList.add('hidden');
    section.classList.remove('open');
    chevron.style.transform = 'rotate(0deg)';
  } else {
    section.classList.remove('hidden');
    section.classList.add('open');
    chevron.style.transform = 'rotate(180deg)';
  }
}

// ── Xử lý khi gõ/xoá trong ô mã ──
function onCodeInput(el) {
  el.value = el.value.toUpperCase();
  if (!el.value.trim()) clearCode();
}

function clearCode() {
  appliedCode = null;
  document.getElementById('code-applied').classList.add('hidden');
  document.getElementById('code-error').classList.add('hidden');
  resetPrice();
}

// ── Áp dụng mã — gọi API ──
async function applyCode() {
  const raw     = document.getElementById('inp-code').value.trim().toUpperCase();
  const applied = document.getElementById('code-applied');
  const error   = document.getElementById('code-error');
  const display = document.getElementById('code-display');
  const btn     = document.querySelector('[onclick="applyCode()"]');

  applied.classList.add('hidden');
  error.classList.add('hidden');
  if (!raw) return;

  btn.textContent = '...';
  btn.disabled    = true;

  try {
    const res   = await fetch(`${APPS_SCRIPT_URL}?code=${encodeURIComponent(raw)}`);
    const data  = await res.json();
    const promo = data.promo;

    if (!promo?.valid || promo.finalPrice == null || isNaN(promo.finalPrice)) {
      error.classList.remove('hidden');
      appliedCode = null;
      resetPrice();
    } else {
      appliedCode = promo;
      display.textContent = promo.label;
      applied.classList.remove('hidden');
      applyDiscount(promo);
    }
  } catch (_) {
    error.classList.remove('hidden');
  } finally {
    btn.textContent = 'Áp dụng';
    btn.disabled    = false;
  }
}

// ── Render giá sau khi có mã — xử lý cả free lẫn partial ──
function applyDiscount(promo) {
  const { finalPrice, isFree } = promo;
  const discountAmount = CONFIG.BASE_PRICE - finalPrice;

  // Luôn ẩn price-original, hiện price-discounted khi có mã
  document.getElementById('price-original').classList.add('hidden');
  document.getElementById('price-discounted').classList.remove('hidden');
  document.getElementById('discount-row').classList.remove('hidden');

  // Hàng gạch ngang = giá gốc
  document.querySelector('#price-discounted p:first-child').textContent = fmt(CONFIG.BASE_PRICE);
  // Hàng giá sau giảm
  document.querySelector('#price-discounted p:last-child').textContent  = fmt(finalPrice);

  // Số tiền giảm
  const discEl = document.getElementById('discount-amount');
  if (discEl) discEl.textContent = '-' + fmt(discountAmount);

  // Thanh toán hôm nay
  const payEl = document.getElementById('pay-today');
  if (payEl) payEl.textContent = fmt(finalPrice);

  // Badge "Miễn phí 100%" — chỉ hiện khi free
  const badgeEl = document.getElementById('free-badge');
  if (badgeEl) badgeEl.classList.toggle('hidden', !isFree);
}

// ── Reset về giá gốc ──
function resetPrice() {
  document.getElementById('price-original').classList.remove('hidden');
  document.getElementById('price-discounted').classList.add('hidden');
  document.getElementById('discount-row').classList.add('hidden');
  renderBasePrice();
}

function fmt(n) {
  const num = Number(n);
  if (isNaN(num)) return '–';
  return num.toLocaleString('vi-VN') + 'đ';
}

// ── Submit form ──
async function submitForm() {
  const name  = document.getElementById('inp-name').value.trim();
  const phone = document.getElementById('inp-phone').value.trim();

  if (!name)  { shake(document.getElementById('inp-name'));  return; }
  if (!phone || !/^0\d{9}$/.test(phone.replace(/\s/g, ''))) {
    shake(document.getElementById('inp-phone')); return;
  }

  const finalPrice = appliedCode ? appliedCode.finalPrice : CONFIG.BASE_PRICE;
  const bookingId  = 'BK' + Math.floor(Date.now() / 1000);

  // Save to sessionStorage immediately — survives even if POST response is blocked by CORS
  sessionStorage.setItem('booking_name',  name);
  sessionStorage.setItem('booking_phone', phone);
  sessionStorage.setItem('booking_code',  appliedCode?.label || '');
  sessionStorage.setItem('booking_price', String(finalPrice));
  sessionStorage.setItem('booking_id',    bookingId);

  // Loading state
  const btn = document.querySelector('[onclick="submitForm()"]');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
    Đang xử lý...`;

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body:   JSON.stringify({
        action:     'save_booking',
        name,
        phone,
        code:       appliedCode?.label || '',
        amount:     finalPrice,
        booking_id: bookingId,
      }),
    });
  } catch (_) {
    // Sheet save failed — booking_id already in sessionStorage, guest continues normally
  } finally {
    btn.disabled  = false;
    btn.innerHTML = originalHTML;
  }

  window.location.href = finalPrice === 0 ? 'success.html' : 'payment.html';
}

function shake(el) {
  el.classList.add('border-red-400', 'ring-2', 'ring-red-300');
  setTimeout(() => el.classList.remove('border-red-400', 'ring-2', 'ring-red-300'), 1500);
}
