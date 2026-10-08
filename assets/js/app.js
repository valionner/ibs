/* ==========================================================================
   IBS landing page — behaviour
   كل المعطيات اللي خاصها تأكيد من البراند كاينة فـ CONFIG تحت.
   ========================================================================== */
'use strict';

const CONFIG = {
  /* الاسم الرسمي ديال المنتج، مكتوب كيفما هو على العلبة. */
  brandName: 'IBS+ DETOX COLON',

  /* صورة المنتج الرسمية. حط الملف ف assets/img/product.png (نفس العلبة، نفس اللوگو).
     كتقدر أيضاً تحمّلها مباشرة من الصفحة (زر «حمّل صورة المنتج») باش تعاين. */
  productImage: 'assets/img/product.png',

  /* رابط API ديال الطلبات (POST JSON). إلا خاوي، كنعرضو غير رسالة تأكيد محلية. */
  orderEndpoint: '',

  /* ⚠️ خلّيها false إلا كانت الكمية محدودة بجد. */
  stockLimited: false,

  /* ⚠️ خلّيها true غير إلا كان الموصّل كيخلي الزبون يشوف المنتوج قبل ما يخلص. */
  inspectionBeforePayment: false,

  /* ⚠️ خلّيها false إلا ما عندكش أساس حقيقي لـ «الأكثر اختياراً» / «أفضل قيمة». */
  showPackRibbons: true,

  /* ⚠️ الآراء: غير آراء حقيقية من الزبناء. إلا خليتيها خاوية كيتبان بلاصة فارغة صادقة.
     مثال:
     reviews: [
       { name: 'أمينة', city: 'كازا', rating: 5, verified: true,
         text: 'الرأي كيفما توصل من الزبونة، بلا ما نبدلوه.' },
     ] */
  reviews: [],

  /* المدة الحقيقية ديال التوصيل — كتبان فملخص الطلب إلا كانت معمّرة. */
  deliveryTime: '',
};

const PACKS = {
  '1': { name: '1 علبة', total: 147 },
  '2': { name: '2 علب', total: 219 },
  '3': { name: '3 علب', total: 299 },
};

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* --------------------------------------------------------------------------
   1. Brand facts (name / product image)
   -------------------------------------------------------------------------- */
function applyBrandFacts() {
  if (CONFIG.brandName) {
    const latin = /[A-Za-z]/.test(CONFIG.brandName);
    $$('[data-brand-name]').forEach((el) => {
      el.textContent = CONFIG.brandName;
      el.classList.remove('token');
      el.removeAttribute('title');
      /* الحروف اللاتينية كتخلّي الاتجاه ينعزل باش الكلمة ما تتقلبش */
      if (latin) el.setAttribute('dir', 'auto');
    });
    document.title = `واش النفخة والغازات كتأثر على نهارك؟ | ${CONFIG.brandName} — الدفع عند الاستلام`;
  }
  if (CONFIG.productImage) setProductImage(CONFIG.productImage, { quiet: true });
}

function setProductImage(src, { quiet = false } = {}) {
  $$('[data-stage]').forEach((stage) => {
    const img = $('[data-product-image]', stage);
    const slot = $('[data-product-slot]', stage);
    const media = $('.stage__media', stage);
    if (!img || !slot) return;

    /* كنستنّاو التحميل قبل ما نبيّنو الصورة باش ما يبانش أيقونة مكسورة */
    const show = () => {
      img.hidden = false;
      slot.hidden = true;
      if (media) media.dataset.hasImage = 'true';
    };
    const fail = () => {
      img.hidden = true;
      slot.hidden = false;
      if (media) delete media.dataset.hasImage;
      if (!quiet) toast('ما تسنّاش تحميل الصورة — تأكد من المسار');
    };

    img.onload = show;
    img.onerror = fail;
    img.src = src;
    if (img.complete && img.naturalWidth > 0) show();   /* صورة كاينة فالكاش */
  });
}

function initProductUploads() {
  $$('[data-product-upload]').forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setProductImage(url);
      toast('تحطّت صورة المنتج فالصفحة');
    });
  });
}

/* --------------------------------------------------------------------------
   2. Reviews (brand-supplied only)
   -------------------------------------------------------------------------- */
const STAR = '<svg aria-hidden="true"><use href="#i-star"></use></svg>';

function renderReviews() {
  const list = $('#reviewsList');
  if (!list) return;

  if (!CONFIG.reviews.length) {
    /* Empty state — بلاصات صادقة بلا آراء مصنوعة */
    list.innerHTML = [1, 2, 3].map((i) => `
      <article class="card review review--empty">
        <div class="review__head">
          <span class="avatar" aria-hidden="true"><svg width="18" height="18"><use href="#i-quote"></use></svg></span>
          <span class="review__who">
            <span class="review__name">بلاصة رأي حقيقي 0${i}</span>
            <span class="review__meta">كتزاد من عند البراند</span>
          </span>
        </div>
        <div class="skeleton" aria-hidden="true">
          <span class="skeleton__line"></span>
          <span class="skeleton__line skeleton__line--short"></span>
        </div>
        <span class="review__slot"><svg aria-hidden="true"><use href="#i-shield"></use></svg> بلاصة محفوظة لرأي زبون عندو شراء متأكد</span>
      </article>`).join('');
    return;
  }

  list.innerHTML = CONFIG.reviews.map((r) => {
    const initial = (r.name || '').trim().charAt(0) || '؟';
    const stars = Number(r.rating) > 0
      ? `<span class="stars" aria-label="التقييم ${r.rating} من 5">${STAR.repeat(Math.min(5, Math.max(1, Math.round(r.rating))))}</span>`
      : '';
    const verified = r.verified
      ? '<span class="verified"><svg aria-hidden="true"><use href="#i-check-circle"></use></svg> شراء متأكد</span>'
      : '';
    return `
      <article class="card review">
        <div class="review__head">
          <span class="avatar" aria-hidden="true">${escapeHtml(initial)}</span>
          <span class="review__who">
            <span class="review__name">${escapeHtml(r.name || 'زبون')}</span>
            <span class="review__meta">${escapeHtml(r.city || 'المغرب')}</span>
          </span>
          <span style="margin-inline-start:auto;display:grid;gap:6px;justify-items:end">
            ${stars}${verified}
          </span>
        </div>
        <p class="review__body">${escapeHtml(r.text || '')}</p>
      </article>`;
  }).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* --------------------------------------------------------------------------
   3. Optional sections (scarcity / inspection / ribbons)
   -------------------------------------------------------------------------- */
function applyOptionalSections() {
  const limited = $('[data-stock="limited"]');
  const operational = $('[data-stock="operational"]');
  if (limited) limited.hidden = !CONFIG.stockLimited;
  if (operational) operational.hidden = !!CONFIG.stockLimited;

  const inspection = $('[data-optional="inspection"]');
  if (inspection) inspection.hidden = !CONFIG.inspectionBeforePayment;

  if (!CONFIG.showPackRibbons) $$('[data-pack-ribbon]').forEach((el) => el.remove());
}

/* --------------------------------------------------------------------------
   4. Package selection
   -------------------------------------------------------------------------- */
function currentPack() {
  const checked = $('input[name="pack"]:checked');
  return checked ? checked.value : '1';
}

function setPack(value, { scroll = false, announce = false } = {}) {
  const radio = $(`input[name="pack"][value="${value}"]`);
  if (radio) radio.checked = true;
  syncPackUI();
  if (announce) toast(`اختريتي: ${PACKS[value].name} — ${PACKS[value].total} درهم`);
  if (scroll) scrollToOrder();
}

function syncPackUI() {
  const value = currentPack();
  const pack = PACKS[value];
  $$('[data-pack-card]').forEach((card) => {
    card.dataset.selected = String(card.dataset.packCard === value);
  });

  const price = $('#stickyPrice');
  if (price) price.textContent = `${pack.total} درهم`;

  const summary = $('#orderSummary');
  if (summary) {
    const city = $('#city') ? $('#city').value : '';
    const parts = [`الباقة: ${pack.name}`, `المجموع: ${pack.total} درهم`, 'الدفع عند الاستلام'];
    if (city) parts.push(`المدينة: ${city}`);
    if (CONFIG.deliveryTime) parts.push(CONFIG.deliveryTime);
    summary.textContent = parts.join(' · ');
    summary.classList.add('is-visible');
  }
}

/* الارتفاع الحقيقي ديال العناصر الملزوقة (شريط الإشعار + الهيدر) */
function stickyChromeHeight() {
  const bar = $('.noticebar');
  const appbar = $('#appbar');
  const barH = bar ? bar.offsetHeight : 0;
  const appbarH = appbar && appbar.dataset.collapsed !== 'true' ? appbar.offsetHeight : 0;
  return barH + appbarH;
}

function scrollToOrder() {
  const order = $('#order');
  if (!order) return;
  const top = order.getBoundingClientRect().top + window.scrollY - stickyChromeHeight() - 12;
  window.scrollTo({ top, behavior: prefersReduced() ? 'auto' : 'smooth' });
  const form = $('#orderForm');
  if (form) {
    form.style.transition = 'box-shadow .3s ease';
    form.style.boxShadow = '0 0 0 4px rgba(27,125,87,.18), 0 30px 60px -30px rgba(0,0,0,.55)';
    setTimeout(() => { form.style.boxShadow = ''; }, 1100);
  }
}

/* --------------------------------------------------------------------------
   5. Sticky UI (notice-adjacent app bar + bottom CTA)
   -------------------------------------------------------------------------- */
function initStickyUI() {
  const bar = $('#appbar');
  const cta = $('#stickyCta');
  const hero = $('#hero');
  const order = $('#order');

  /* Fallback للبيئات القديمة: بلا مراقب، كنخليو الواجهة مقروءة بلا تغييرات */
  if (!('IntersectionObserver' in window)) {
    if (bar) bar.dataset.collapsed = 'false';
    if (cta) { cta.classList.add('is-visible'); cta.setAttribute('aria-hidden', 'false'); }
    return;
  }

  if (hero) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      const past = entry.boundingClientRect.bottom < 170;
      if (bar) bar.dataset.collapsed = String(!past);
      if (cta) {
        cta.classList.toggle('is-visible', past);
        cta.setAttribute('aria-hidden', String(!past));
      }
    }, { threshold: 0, rootMargin: '0px 0px -180px 0px' });
    heroObserver.observe(hero);
  }

  if (order) {
    const orderObserver = new IntersectionObserver(([entry]) => {
      if (!cta) return;
      const hide = entry.isIntersecting;
      cta.classList.toggle('is-visible', !hide && window.scrollY > 600);
      cta.setAttribute('aria-hidden', String(hide));
    }, { threshold: 0.12 });
    orderObserver.observe(order);
  }
}

/* كيقيس الطول الحقيقي ديال شريط الإشعار باش العناصر الـ sticky ما يتداخلو */
function syncStickyOffset() {
  const bar = $('.noticebar');
  if (!bar) return;
  document.documentElement.style.setProperty('--noticebar-h', `${Math.round(bar.offsetHeight)}px`);
}

function prefersReduced() {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* --------------------------------------------------------------------------
   6. Reveal on scroll
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = $$('.reveal');
  const root = document.documentElement;

  /* بلا JS ولا بلا IntersectionObserver: كلشي كيبقى ظاهر */
  if (!items.length || prefersReduced() || !('IntersectionObserver' in window)) return;

  root.classList.add('has-reveal');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  items.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 55}ms`;
    io.observe(el);
  });

  /* شبكة أمان: أي عنصر داخل الشاشة ولا قريب منها كيتفتح بالقوة.
     ضرورية حيت التمرير السريع (flick) كيقفز فوق عناصر ما كتتقاطعش مع المراقب. */
  const sweep = () => {
    items.forEach((el) => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 120 && r.bottom > -120) el.classList.add('is-in');
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { sweep(); ticking = false; });
  };

  [1200, 2800].forEach((ms) => setTimeout(sweep, ms));
  window.addEventListener('load', sweep, { once: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   7. Toast
   -------------------------------------------------------------------------- */
let toastTimer;
function toast(message) {
  const el = $('#toast');
  const msg = $('#toastMsg');
  if (!el || !msg) return;
  msg.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
}

/* --------------------------------------------------------------------------
   8. Order form
   -------------------------------------------------------------------------- */
const PHONE_RE = /^(?:\+212|0)\s?[567]\d{8}$/;

function normalizePhone(raw) {
  return String(raw).replace(/[\s\-()._]/g, '');
}

function initForm() {
  const form = $('#orderForm');
  if (!form) return;

  const phone = $('#phone');
  if (phone) {
    phone.addEventListener('input', () => { phone.value = phone.value.replace(/[^\d+\s]/g, ''); });
  }

  const city = $('#city');
  if (city) city.addEventListener('change', () => {
    setFieldState('city', true);
    syncPackUI();
  });

  $$('input[name="pack"]').forEach((radio) => {
    radio.addEventListener('change', () => syncPackUI());
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitOrder(form);
  });

  const newOrder = $('#newOrderBtn');
  if (newOrder) newOrder.addEventListener('click', () => {
    $('#successCard').hidden = true;
    form.hidden = false;
    form.reset();
    setPack('1');
    form.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
  });
}

function setFieldState(field, valid) {
  const wrapper = $(`[data-field="${field}"]`);
  if (!wrapper) return;
  wrapper.dataset.invalid = String(!valid);
}

function validate(form) {
  const name = $('#fullName').value.trim();
  const phone = normalizePhone($('#phone').value);
  const city = $('#city').value;

  const nameOk = name.length >= 3 && /[^\d\s]/.test(name);
  const phoneOk = PHONE_RE.test(phone);
  const cityOk = Boolean(city);

  setFieldState('name', nameOk);
  setFieldState('phone', phoneOk);
  setFieldState('city', cityOk);

  const firstInvalid = !nameOk ? '#fullName' : (!phoneOk ? '#phone' : (!cityOk ? '#city' : null));
  if (firstInvalid) {
    const el = $(firstInvalid);
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
    toast('عافاك كمّل المعلومات الناقصة');
    return null;
  }

  const pack = currentPack();
  return {
    name,
    phone,
    city,
    pack,
    packLabel: PACKS[pack].name,
    total: PACKS[pack].total,
    submittedAt: new Date().toISOString(),
  };
}

async function submitOrder(form) {
  const data = validate(form);
  if (!data) return;

  const btn = $('#submitBtn');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'كنأكدو الطلب…';

  const endpoint = form.dataset.endpoint || CONFIG.orderEndpoint;

  try {
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('request-failed');
    } else {
      /* ما كاينش endpoint — وضع العرض التجريبي */
      await new Promise((resolve) => setTimeout(resolve, 650));
      console.info('[order] payload ديال العرض:', data);
    }

    $('#successSummary').textContent =
      `${data.packLabel} — ${data.total} درهم · ${data.city} · هاتف: ${maskPhone(data.phone)}`;
    form.hidden = true;
    $('#successCard').hidden = false;
    $('#successCard').scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
    toast('توصلنا بالطلب ديالك');
  } catch (err) {
    toast('وقع مشكل صغير — عاود جرّب');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function maskPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '••••••';
  return `${digits.slice(0, 3)}••••${digits.slice(-2)}`;
}

/* --------------------------------------------------------------------------
   9. Misc wiring
   -------------------------------------------------------------------------- */
function initMisc() {
  $$('[data-select-pack]').forEach((btn) => {
    btn.addEventListener('click', () => setPack(btn.dataset.selectPack, { scroll: true, announce: true }));
  });

  $$('[data-scroll]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      const target = $(href);
      if (!target) return;
      event.preventDefault();
      if (href === '#order') {
        scrollToOrder();
      } else {
        target.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  $$('[data-policy]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      toast('هاد الرابط كيتعمّر بصفحة السياسة الرسمية ديال البراند');
    });
  });

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ملخّص الطلب كتبان غير ملي كيبدا المستعمل يعمّر */
  ['#fullName', '#phone'].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener('focus', () => syncPackUI(), { once: true });
  });
}

/* --------------------------------------------------------------------------
   10. Boot
   -------------------------------------------------------------------------- */
function init() {
  applyBrandFacts();
  initProductUploads();
  renderReviews();
  applyOptionalSections();
  initStickyUI();
  initReveal();
  initForm();
  initMisc();
  syncPackUI();
  syncStickyOffset();
  window.addEventListener('resize', syncStickyOffset, { passive: true });
  window.addEventListener('load', syncStickyOffset, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
