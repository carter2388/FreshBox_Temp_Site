// ===== Footer year =====
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());

// ===== Smooth scroll to form =====
const ctaTop = document.getElementById('ctaTop');
const ctaHero = document.getElementById('ctaHero');
const schedule = document.getElementById('schedule');

function scrollToForm() { schedule?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
ctaTop?.addEventListener('click', scrollToForm);
ctaHero?.addEventListener('click', scrollToForm);

// ===== Success modal helpers =====
const modal = document.getElementById('successModal');
const modalClose = modal?.querySelector('.modal-close');
const modalOk = modal?.querySelector('.modal-ok');
const modalBackdrop = modal?.querySelector('.modal-backdrop');
const modalContent = modal?.querySelector('.modal-content');

function openModal() {
    if (!modal) return;
    modal.classList.add('open');
    modalContent?.focus(); // accessibility
}
function closeModal() { modal?.classList.remove('open'); }
modalClose?.addEventListener('click', closeModal);
modalOk?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== Pickup time min (≥ 24h, rounded to 15min) =====
function setPickupMin() {
    const el = document.getElementById('pickupTime');
    if (!el) return;
    const t = new Date();
    t.setMinutes(t.getMinutes() + 24 * 60);
    const r = t.getMinutes() % 15;
    if (r !== 0) t.setMinutes(t.getMinutes() + (15 - r));
    const pad = n => String(n).padStart(2, '0');
    el.min = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
document.addEventListener('DOMContentLoaded', setPickupMin);

// ===== Basic validation only =====
const form = document.getElementById('pickupForm');
const msg = document.getElementById('formMsg');

function showMsg(text, type = 'error') {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = type === 'success' ? 'green' : 'red';
}
function digitCount(s) { return (s.match(/\d/g) || []).length; }

// ZIP autolimit (digits only, max 5)
const zipEl = document.getElementById('zipcode');
function sanitizeZip() {
    if (!zipEl) return;
    const digitsOnly = (zipEl.value.match(/\d/g) || []).join('').slice(0, 5);
    if (zipEl.value !== digitsOnly) {
        zipEl.value = digitsOnly;
        zipEl.setSelectionRange(digitsOnly.length, digitsOnly.length);
    }
}
zipEl?.addEventListener('input', sanitizeZip);
zipEl?.addEventListener('paste', () => requestAnimationFrame(sanitizeZip));

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // honeypot
    const hp = form.querySelector('input[name="_gotcha"]');
    if (hp && hp.value) return;

    const email = form.elements.namedItem('email');
    const phone = form.elements.namedItem('phone');
    const state = form.elements.namedItem('state');
    const city = form.elements.namedItem('city');
    const when = form.elements.namedItem('pickup_time');
    const zip = form.elements.namedItem('zipcode');

    // Email (browser pattern)
    if (!email.value || (email.validity && !email.validity.valid)) {
        showMsg('Enter a valid email.');
        return;
    }

    // Phone 10–15 digits
    const digits = digitCount(phone.value);
    if (digits < 10 || digits > 15) {
        showMsg('Phone must have 10–15 digits.');
        return;
    }

    // State (DC/MD/VA only)
    if (!['DC', 'MD', 'VA'].includes(state.value)) {
        showMsg('Please choose D.C., MD, or VA.');
        return;
    }

    // City required (basic)
    if (!city.value.trim()) {
        showMsg('Please enter your city.');
        return;
    }

    // ZIP 5 digits
    if (!/^[0-9]{5}$/.test(zip.value)) {
        showMsg('ZIP must be 5 digits.');
        return;
    }

    // Pickup time ≥ min
    const minAttr = when.getAttribute('min');
    if (minAttr) {
        const chosen = new Date(when.value);
        const min = new Date(minAttr);
        if (!(when.value) || chosen < min) {
            showMsg('Pickup must be at least 24h from now.');
            return;
        }
    }

    // Submit to Formspree
    showMsg('Submitting…', 'success');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const resp = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
        });
        if (resp.ok) {
            form.reset();
            setPickupMin();
            openModal();                 // <— show success modal
            showMsg('Thanks! We received your request.', 'success');
        } else {
            showMsg('Something went wrong.');
        }
    } catch {
        showMsg('Network error. Try again.');
    } finally {
        btn.disabled = false;
    }
});
