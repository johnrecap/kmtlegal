(() => {
  const query = new URLSearchParams(location.search);
  let locale = query.get('lang') === 'en' ? 'en' : 'ar';
  let theme = query.get('theme') === 'dark' ? 'dark' : 'light';
  let direction = '02', viewport = '1440', view = 'booking';
  const root = document.getElementById('gallery');
  const extras = {
    ar: { desktop: 'كمبيوتر', mobile: 'موبايل', viewport: 'حجم العرض', direction: 'اتجاه المقارنة', scene: 'مشهد المقارنة', local: 'مقترحات محلية فقط. الاختيار هنا للمقارنة، واعتماد الشكل يكون بقرارك في المحادثة.', readme: 'طريقة التشغيل والحدود', sourceLedger: 'سجل المراجع', qa: 'نتائج التحقق' },
    en: { desktop: 'Desktop', mobile: 'Mobile', viewport: 'Viewport', direction: 'Comparison direction', scene: 'Comparison scene', local: 'Local proposals only. These controls compare concepts; your choice in conversation establishes approval.', readme: 'Run instructions and boundaries', sourceLedger: 'Reference ledger', qa: 'QA results' }
  };
  const shortId = n => String(n).padStart(2, '0');
  function imagePath(id, screen) { return `images/${id === 'baseline' ? `baseline-${locale}-${theme}-${viewport}` : `direction-${id}-${locale}-${theme}-${viewport}`}-${screen}.png`; }
  function render() {
    const copy = KMT_PREVIEW[locale], text = extras[locale];
    document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; document.documentElement.dataset.theme = theme;
    root.innerHTML = `<div class="gallery-shell"><header class="gallery-header"><div class="brand"><img src="shared/assets/kmt-logo.webp" alt="KMT Legal" width="50" height="50"><div class="brand-wordmark">KMT<small>LEGAL</small></div></div><div class="gallery-tools"><button class="btn quiet" data-action="language">${copy.language}</button><button class="icon-button" data-action="theme" aria-label="${copy.theme}">${theme === 'dark' ? '☼' : '☾'}</button></div></header><section class="gallery-intro"><div><p class="eyebrow">${copy.lab} / KMT LEGAL</p><h1>${copy.galleryTitle}</h1></div><div class="intro-text"><p>${copy.galleryIntro}</p><p class="recommendation">${copy.recommendation}</p><a href="#comparison" class="baseline-button">${copy.compare} ↓</a></div></section><section class="direction-grid" aria-label="${copy.lab}">${copy.directions.map((item, index) => {
      const id = shortId(index + 1), url = `direction-${id}/index.html?lang=${locale}&theme=${theme}`;
      return `<article class="direction-card"><a class="card-image" href="${url}" aria-label="${copy.open}: ${item.name}"><img src="images/direction-${id}-${locale}-${theme}-1440-chat.png" alt="${item.name}" width="1440" height="900" loading="lazy"></a><div class="card-body"><p class="card-number">KMT / ${id}</p><h2>${item.name}</h2><p class="tagline">${item.tagline}</p><p class="description">${item.description}</p><div class="card-details"><p><strong>${copy.source}:</strong> ${item.source}</p><p><strong>${copy.tradeoff}:</strong> ${item.tradeoff}</p></div><div class="card-actions"><a class="btn" href="${url}">${copy.open} ↗</a><a class="btn secondary" href="${url}&scene=booking">${copy.showBooking}</a></div></div></article>`;
    }).join('')}</section><section class="comparison" id="comparison"><div class="comparison-head"><h2>${copy.compare}</h2><div class="compare-controls"><label class="sr-only" for="compare-direction">${text.direction}</label><select id="compare-direction">${copy.directions.map((item, index) => `<option value="${shortId(index + 1)}" ${direction === shortId(index + 1) ? 'selected' : ''}>${shortId(index + 1)} · ${item.name}</option>`).join('')}</select><label class="sr-only" for="compare-viewport">${text.viewport}</label><select id="compare-viewport"><option value="1440" ${viewport === '1440' ? 'selected' : ''}>${text.desktop}</option><option value="390" ${viewport === '390' ? 'selected' : ''}>${text.mobile}</option></select><label class="sr-only" for="compare-view">${text.scene}</label><select id="compare-view"><option value="booking" ${view === 'booking' ? 'selected' : ''}>${copy.bookingView}</option><option value="chat" ${view === 'chat' ? 'selected' : ''}>${copy.chatView}</option><option value="review" ${view === 'review' ? 'selected' : ''}>${copy.scenarios.review}</option></select></div></div><p class="comparison-note">${copy.compareNote}</p><div class="comparison-grid"><figure><figcaption>${copy.before}<span>dbdc926</span></figcaption><a class="comparison-image" id="before-image-link" href="${imagePath('baseline', view)}"><img id="before-image" src="${imagePath('baseline', view)}" alt="${copy.before}" loading="lazy"></a></figure><figure><figcaption>${copy.directions[Number(direction) - 1].name}<span>KMT / ${direction}</span></figcaption><a class="comparison-image" id="after-image-link" href="${imagePath(direction, view === 'booking' ? 'dialog' : view === 'chat' ? 'conversation' : 'review')}"><img id="after-image" src="${imagePath(direction, view === 'booking' ? 'dialog' : view === 'chat' ? 'conversation' : 'review')}" alt="${copy.directions[Number(direction) - 1].name}" loading="lazy"></a></figure></div></section><footer class="gallery-footer"><p>${text.local}</p><div class="compare-sources"><a href="README.md">${text.readme}</a><a href="SOURCES.md">${text.sourceLedger}</a><a href="qa/results.json">${text.qa}</a></div></footer></div>`;
  }
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'language') { locale = locale === 'ar' ? 'en' : 'ar'; render(); }
    if (action === 'theme') { theme = theme === 'dark' ? 'light' : 'dark'; render(); }
  });
  root.addEventListener('change', event => {
    if (event.target.id === 'compare-direction') direction = event.target.value;
    if (event.target.id === 'compare-viewport') viewport = event.target.value;
    if (event.target.id === 'compare-view') view = event.target.value;
    const scroll = scrollY; render(); requestAnimationFrame(() => scrollTo(0, scroll));
  });
  render();
})();
