/* ==========================================================================
   Smoke test ديال صفحة الهبوط (DOM + سلوك)
   التشغيل:  NODE_PATH=<node_modules فيه jsdom> node tools/smoke-test.mjs
   --------------------------------------------------------------------------
   كيتحقق من: الأداء بلا أخطاء، الآراء، اختيار الباقة، الفاليداسيون،
   إظهار/تخفاء الأقسام المشروطة، والنصوص الأساسية.
   ========================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.SITE_ROOT ? resolve(process.env.SITE_ROOT) : resolve(here, '..');

let failures = 0;
const ok = (label) => console.log(`  ✓ ${label}`);
const check = (label, condition) => {
  if (condition) ok(label);
  else { failures++; console.error(`  ✗ ${label}`); }
};

const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const errors = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  url: 'http://localhost:8080/',
  virtualConsole: new (await import('jsdom')).VirtualConsole().on('jsdomError', (e) => errors.push(e.message)),
});
const { window } = dom;
const { document } = window;

/* IntersectionObserver ماشي موجود فـ jsdom */
window.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; }
  observe(el) { this.cb([{ target: el, isIntersecting: true, boundingClientRect: { bottom: 0, top: 0 } }]); }
  unobserve() {}
  disconnect() {}
};
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = () => {};
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}

/* نستنّاو السكريبت يتحمّل */
await new Promise((r) => window.addEventListener('load', r, { once: true }));
await new Promise((r) => setTimeout(r, 60));

console.log('\n1) الأداء');
check('الصفحة تحمّلت بلا أخطاء JS', errors.length === 0);
if (errors.length) console.error(errors.join('\n'));

console.log('\n2) البنية والمحتوى');
const sections = ['hero', 'recognize', 'education', 'product', 'why', 'reviews', 'risk', 'offer', 'notice', 'order', 'closing', 'faq'];
sections.forEach((id) => check(`القسم #${id} كاين`, Boolean(document.getElementById(id))));
check('المستند RTL وبالعربية', document.documentElement.getAttribute('dir') === 'rtl' && document.documentElement.getAttribute('lang') === 'ar');
check('الخط محمّل محلياً (بلا شبكة)', html.includes('assets/fonts/cairo-arabic-wght-normal.woff2'));
check('شريط الإشعار فيه نص التوصيل', document.querySelector('.noticebar p').textContent.includes('الدفع عند الاستلام والتوصيل مجاني لجميع مدن المغرب'));
check('العنوان الرئيسي (H1) صحيح', document.getElementById('hero-title').textContent.includes('النفخة والغازات'));

const imgs = Array.from(document.querySelectorAll('img'));
check('كل الصور عندها alt', imgs.every((img) => img.getAttribute('alt')));
check('الصور lifestyle كاينة', imgs.filter((i) => i.src.includes('assets/img/')).length >= 4);

console.log('\n3) الأقسام المشروطة (الافتراضي = صادق)');
check('قسم الكمية المحدودة مخفي (ماشي scarcity وهمية)', document.querySelector('[data-stock="limited"]').hidden === true);
check('الرسالة العملية (تأكيد هاتفي) ظاهرة', document.querySelector('[data-stock="operational"]').hidden === false);
check('جملة المعاينة قبل الدفع مخفية افتراضياً', document.querySelector('[data-optional="inspection"]').hidden === true);

console.log('\n4) الآراء');
const reviewCards = document.querySelectorAll('#reviewsList .review');
check('3 كارتات آراء بلا بيانات مصنوعة', reviewCards.length === 3 && document.querySelectorAll('#reviewsList .review--empty').length === 3);
check('ما كاينش نجوم ولا "شراء متأكد" بلا تأكيد', document.querySelectorAll('#reviewsList .stars, #reviewsList .verified').length === 0);

console.log('\n5) الباقات');
const radios = document.querySelectorAll('input[name="pack"]');
check('3 باقات فالاستمارة', radios.length === 3);
const prices = Array.from(document.querySelectorAll('.pack .price strong')).map((el) => el.textContent.trim());
check('الأثمنة 147 / 219 / 299', JSON.stringify(prices) === JSON.stringify(['147', '219', '299']));
document.querySelector('[data-select-pack="2"]').click();
check('اختيار الباقة 2 كيحدّث الراديو', document.querySelector('input[name="pack"]:checked').value === '2');
check('اختيار الباقة 2 كيحدّث ثمن الـ CTA الثابت', document.getElementById('stickyPrice').textContent.trim() === '219 درهم');
check('الملخص كيتحدّث', document.getElementById('orderSummary').textContent.includes('219'));
check('الكارت المختار مبيّن (data-selected)', document.querySelector('[data-pack-card="2"]').dataset.selected === 'true'
  && document.querySelector('[data-pack-card="1"]').dataset.selected === 'false');
check('العنوان ديال البراند فالهيرو كاين', document.querySelector('.hero__brand [data-brand-name]') !== null);

console.log('\n6) الفاليداسيون');
const form = document.getElementById('orderForm');
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((r) => setTimeout(r, 20));
check('الطلب ما تسيفطش بلا معلومات', form.hidden === false && document.getElementById('successCard').hidden === true);
check('الاسم مبيّن غالط', document.querySelector('[data-field="name"]').dataset.invalid === 'true');

document.getElementById('fullName').value = 'يوسف بناني';
document.getElementById('phone').value = '0612345678';
document.getElementById('city').value = 'الدار البيضاء';
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((r) => setTimeout(r, 900));
check('الطلب تسيفط وتبان رسالة التأكيد', form.hidden === true && document.getElementById('successCard').hidden === false);
check('ملخص الطلب فيه الباقة والمدينة', document.getElementById('successSummary').textContent.includes('الدار البيضاء'));
document.getElementById('newOrderBtn').click();
check('زر «نزيد طلب آخر» كيرجّع الاستمارة', form.hidden === false && document.getElementById('successCard').hidden === true);

console.log('\n7) التحقق العام من النصوص');
/* كنحيدو البلوكات ديال «الصدق» حيت كتذكر بصيغة النفي العبارات اللي كنرفضوها */
const honestyNodes = Array.from(document.querySelectorAll('[data-honesty]'));
const honestyText = honestyNodes.map((n) => n.textContent).join(' ');
honestyNodes.forEach((n) => n.remove());

const visibleText = document.body.textContent;
/* مسموح: الاسم الرسمي ديال المنتج (مكتوب بالحروف اللاتينية على العلبة)، الجملة
   المقتبسة من الملصق (30 Capsules)، والمسار التقني ديال الملف فبلاصة الصورة. */
const ALLOWED_LATIN = new Set(['IBS', 'DETOX', 'COLON', 'Capsules', 'assets', 'img', 'product', 'png']);
const englishWords = [...new Set((visibleText.match(/[A-Za-z]{3,}/g) || []))]
  .filter((w) => !ALLOWED_LATIN.has(w));
check('ما كايناش نصوص إنجليزية دخيلة (غير الاسم الرسمي والمسار)', englishWords.length === 0);
if (englishWords.length) console.error('   →', englishWords.join(', '));
const banned = [
  '100% علاج طبيعي', 'بدون أعراض جانبية', 'علاج نهائي', 'مضمون 100',
  'lorem', 'Lorem', 'آخر قطعة', 'باقي 3 فقط', 'العرض ينتهي', 'شفاء تام', 'مضمون',
];
banned.forEach((phrase) => check(`ما كايناش عبارة محظورة: «${phrase}»`, !visibleText.includes(phrase)));
check('كاين تنبيه أن المنتج ماشي دواء', visibleText.includes('مكمل غذائي') && visibleText.includes('ماشي بديل'));
check('كاين النفي ديال العبارات الممنوعة فبلوك الصدق', honestyText.includes('100% علاج طبيعي'));

console.log('\n8) اسم المنتج والصورة');
const brand = document.querySelector('.hero__brand [data-brand-name]');
check('الاسم الرسمي تحطّ فالصفحة', brand.textContent === 'IBS+ DETOX COLON');
check('الاسم معزول ثنائياً (dir=auto) باش IBS+ ما تتقلبش', brand.getAttribute('dir') === 'auto');
check('صورة المنتج مربوطة بالمسار الرسمي', html.includes('assets/img/product.png'));
check('بلاصة الصورة كتبان ملي الملف ما كاينش', Array.from(document.querySelectorAll('[data-product-slot]')).every((s2) => s2.hidden === false));

console.log(`\n${failures === 0 ? '✅ كلشي صحيح' : `❌ ${failures} فشل`}\n`);
window.close();
process.exit(failures === 0 ? 0 : 1);
