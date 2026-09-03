/* =========================================================
   Nexus — app.js
   - يقرأ works.json ويستخرج فقط: cover (cavar) + name
   - يولّد بطاقات الأعمال على الصفحة الرئيسية
   - صفحات SEO ديناميكية: ?work=<slug> → صفحة "نزّل التطبيق"
   - عند دخول أي عمل: الشعار + زر التنزيل + مميزات التطبيق
========================================================= */
(function () {
  'use strict';

  /* ---------- أدوات مساعدة ---------- */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const slugify = (str) =>
    String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  /* تطبيع أي شكل شائع لملف works.json */
  function normalizeWorks(data) {
    let arr = [];
    if (Array.isArray(data)) arr = data;
    else if (data && Array.isArray(data.works)) arr = data.works;
    else if (data && Array.isArray(data.data)) arr = data.data;
    else if (data && Array.isArray(data.list)) arr = data.list;
    else if (data && typeof data === 'object') arr = Object.values(data);
    return arr
      .map((w) => {
        if (!w || typeof w !== 'object') return null;
        const cover =
          w.cavar || w.cover || w.image || w.img || w.poster || w.thumbnail || w.photo || '';
        const name = w.name || w.title || w.Name || w.Title || '';
        if (!name) return null;
        return { name: String(name), cover: String(cover), slug: slugify(name) };
      })
      .filter(Boolean);
  }

  /* ---------- أيقونات SVG ---------- */
  const ICONS = {
    download: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.9c.5 0 .9.4.9.9v8.5l2.9-2.9a.9.9 0 1 1 1.3 1.3l-4.4 4.4a.9.9 0 0 1-1.3 0l-4.4-4.4a.9.9 0 1 1 1.3-1.3l2.9 2.9V3.8c0-.5.4-.9.9-.9ZM4.5 16.2c0-.5.4-.9.9-.9h13.2c.5 0 .9.4.9.9v2.4c0 1.3-1.1 2.4-2.4 2.4H6.9a2.4 2.4 0 0 1-2.4-2.4v-2.4Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19.3 5.9a1 1 0 0 1 1.4 1.4l-9.6 9.6a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 1 1 1.4-1.4l3.9 3.8 8.9-8.8Z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M13 2 4.7 13.2c-.4.5 0 1.3.7 1.3H11l-1 7.3c-.1.8.9 1.2 1.4.6l8.3-11.2c.4-.5 0-1.3-.7-1.3H13l1-7.2c.1-.8-.9-1.3-1-.7Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M11.2 16.9c.5-.3 1.1-.3 1.7 0l5.1 2.6c.1 0 .1-.1.1-.1V5.3c0-.8-.7-1.5-1.5-1.5H7.4c-.8 0-1.5.7-1.5 1.5v14.1c0 .1.1.2.1.1l5.2-2.6Z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M20.4 15.6A8.8 8.8 0 0 1 8.4 3.6a.9.9 0 0 0-1.3-1A10.6 10.6 0 1 0 22.4 16.9a.9.9 0 0 0-1.9-1.3Z"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 18.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM12 13c-2 0-3.9.7-5.4 2a.9.9 0 1 0 1.2 1.3 8.9 8.9 0 0 1 8.4 0 .9.9 0 1 0 1.2-1.3A8.6 8.6 0 0 0 12 13Zm0-4.7c-3.2 0-6.2 1.2-8.5 3.3a.9.9 0 0 0 1.2 1.3A11.6 11.6 0 0 1 12 10c3.1 0 6.1 1.1 8.3 2.9a.9.9 0 1 0 1.2-1.3A13.4 13.4 0 0 0 12 8.3Z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M9.4 6.4a.9.9 0 0 1 1.3 1.3L6.4 12l4.3 4.3a.9.9 0 1 1-1.3 1.3l-5-5a.9.9 0 0 1 0-1.3l5-5Z"/></svg>',
  };

  const APP_FEATURES = [
    { icon: 'bolt',  text: 'تحديثات فورية لأحدث الفصول' },
    { icon: 'moon',  text: 'وضع القراءة الليلي المريح' },
    { icon: 'book',  text: 'مكتبة شخصية ومفضلات' },
    { icon: 'wifi',  text: 'تحميل وقراءة بدون إنترنت' },
    { icon: 'check', text: 'بدون إعلانات مزعجة' },
  ];

  /* =========================================================
     1) صفحة عمل واحد (?work=slug) — صفحة التنزيل للـ SEO
  ========================================================= */
  function renderWorkPage(work) {
    document.title = `${work.name} — اقرأ على تطبيق Nexus | حمّل التطبيق`;
    setMeta('description', `اقرأ ${work.name} مترجمة بالكامل على تطبيق Nexus. حمّل التطبيق مجاناً واستمتع بأحدث الفصول فور صدورها بجودة فائقة.`);
    setMeta('og:title', `${work.name} — Nexus`);
    setMeta('og:description', `حمّل تطبيق Nexus واقرأ ${work.name} بجودة فائقة وبدون إعلانات.`);

    /* JSON-LD للعمل — يقوي SEO جوجل */
    injectJSONLD({
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: work.name,
      image: work.cover || undefined,
      inLanguage: 'ar',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    });

    document.body.innerHTML = `
      <div class="aurora"></div>
      <div class="grid-overlay"></div>
      <main class="work-page">
        <a class="work-back" href="./">${ICONS.back} العودة للرئيسية</a>
        ${work.cover ? `<img class="work-cover" src="${escAttr(work.cover)}" alt="${escAttr(work.name)}" loading="eager" />`
                     : `<div class="work-logo">${logoSVG(44)}</div>`}
        <h1 class="work-name">${escHtml(work.name)}</h1>
        <div class="work-logo">${logoSVG(36)}</div>
        <p class="work-msg">للاستمتاع بقراءة <b>${escHtml(work.name)}</b> بجودة فائقة وبدون إعلانات،<br>يرجى تنزيل تطبيق <b>Nexus</b> — مجاناً ومتاح على جميع الأجهزة.</p>
        <button class="btn btn-primary btn-lg" data-download>
          ${ICONS.download} تنزيل تطبيق Nexus
        </button>
        <div class="work-feats">
          ${APP_FEATURES.map(f => `<div class="work-feat">${ICONS[f.icon]} ${f.text}</div>`).join('')}
        </div>
      </main>`;
    bindDownloadModal();
  }

  /* =========================================================
     2) الصفحة الرئيسية — البطاقات من works.json
  ========================================================= */
  function renderHomePage(works) {
    const featured = works.slice(0, 8);
    const grid = $('#worksGrid');
    const gridAll = $('#worksGridAll');
    if (!grid) return;

    grid.innerHTML = featured.map(cardHTML).join('');
    gridAll.innerHTML = works.slice(8).map(cardHTML).join('');

    /* البحث */
    const input = $('#searchInput');
    if (input) {
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        const pool = q ? works : works.slice(8);
        const filtered = q ? pool.filter(w => w.name.toLowerCase().includes(q)) : pool;
        grid.innerHTML = filtered.slice(0, 8).map(cardHTML).join('');
        gridAll.innerHTML = q ? filtered.slice(8).map(cardHTML).join('') : works.slice(8).map(cardHTML).join('');
      });
    }

    /* ItemList JSON-LD — يقوي SEO صفحة المكتبة */
    injectJSONLD({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: works.slice(0, 20).map((w, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'Book', name: w.name, image: w.cover || undefined, url: `${location.origin}${location.pathname}?work=${w.slug}` },
      })),
    });
  }

  function cardHTML(w) {
    return `
      <a class="card" href="?work=${encodeURIComponent(w.slug)}" title="${escAttr(w.name)}">
        <div class="card-cover">
          ${w.cover ? `<img src="${escAttr(w.cover)}" alt="${escAttr(w.name)}" loading="lazy" />` : ''}
        </div>
        <div class="card-name">${escHtml(w.name)}</div>
      </a>`;
  }

  /* =========================================================
     3) مودال التنزيل
  ========================================================= */
  function bindDownloadModal() {
    const modal = $('#downloadModal');
    if (!modal) return;
    $$('[data-download]').forEach(b => b.addEventListener('click', () => modal.classList.add('open')));
    $('#modalClose').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
    $$('.store-btn').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const store = a.dataset.store;
      const url = store === 'ios'
        ? 'https://apps.apple.com/app/nexus'
        : 'https://play.google.com/store/apps/details?id=com.nexus.app';
      window.open(url, '_blank', 'noopener');
    }));
  }

  /* =========================================================
     4) عدّادات الهيرو
  ========================================================= */
  function animateCounters() {
    $$('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const dur = 1600, t0 = performance.now();
      const fmt = n => n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'K' : n;
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  /* ---------- أدوات SEO ---------- */
  function setMeta(prop, content) {
    let tag = document.querySelector(`meta[name="${prop}"], meta[property="${prop}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      if (prop.startsWith('og:')) tag.setAttribute('property', prop); else tag.setAttribute('name', prop);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }
  function injectJSONLD(obj) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }
  function logoSVG(size) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v18l6-4 6 4V3l-6 4-6-4z"/></svg>`;
  }
  function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function escAttr(s) { return escHtml(s); }

  /* =========================================================
     التشغيل الرئيسي
  ========================================================= */
  async function main() {
    let works = [];
    try {
      const res = await fetch('works.json');
      if (res.ok) works = normalizeWorks(await res.json());
    } catch (_) { /* works.json غير موجود — نظهر واجهة افتراضية */ }

    const params = new URLSearchParams(location.search);
    const workSlug = params.get('work');

    if (workSlug) {
      const work = works.find(w => w.slug === workSlug) || { name: decodeURIComponent(workSlug).replace(/-/g, ' '), cover: '', slug: workSlug };
      renderWorkPage(work);
      return; /* لا نبني الصفحة الرئيسية أبداً */
    }

    renderHomePage(works);
    bindDownloadModal();
    animateCounters();
  }

  document.addEventListener('DOMContentLoaded', main);
})();
