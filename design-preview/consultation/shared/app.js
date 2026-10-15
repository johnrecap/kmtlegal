(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  const direction = document.body.dataset.direction || '01';
  let locale = query.get('lang') === 'en' ? 'en' : 'ar';
  let theme = query.get('theme') === 'dark' ? 'dark' : 'light';
  let copy, chat, policy, booking;
  const fixture = window.KMT_FIXTURE;
  const root = document.getElementById('application');
  const state = { date: fixture.firstDate, slot: null, name: '', phone: '', channel: 'PHONE', consent: false,
    page: 0, open: false, empty: false, error: false, busy: false, chatError: false, staff: false,
    scenario: 'normal', text: '', messages: [], confirmed: null, editing: false, cancelling: false, cancelled: false };
  let opener = null, sendTimer = null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{
    arrow: '<path d="M12 19V5m-6 6 6-6 6 6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-12 5h.01M12 16h.01M16 16h.01"/>',
    check: '<path d="m5 12 4 4L19 6"/>', shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    moon: '<path d="M20.5 13.6A9 9 0 0 1 10.4 3.5 9 9 0 1 0 20.5 13.6Z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>', previous: '<path d="m14 6-6 6 6 6"/>', next: '<path d="m10 6 6 6-6 6"/>',
    scales: '<path d="M12 3v18M6 21h12M5 7h14M5 7l-4 7h8L5 7Zm14 0-4 7h8l-4-7Z"/>', person: '<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    message: '<path d="M21 12a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 11h8m-8 4h5"/>'
  }[name] || ''}</svg>`;
  const dateLabel = (date, short = false) => new Intl.DateTimeFormat(locale, { timeZone: 'Africa/Cairo', weekday: short ? 'short' : 'long', day: 'numeric', ...(short ? {} : { month: 'long', year: 'numeric' }) }).format(new Date(date + 'T12:00:00Z'));
  const clockLabel = time => new Intl.DateTimeFormat(locale, { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(time));
  const weekdayLabel = date => new Intl.DateTimeFormat(locale, { timeZone: 'Africa/Cairo', weekday: 'short' }).format(new Date(date + 'T12:00:00Z'));
  const numeral = value => new Intl.NumberFormat(locale).format(value);
  const selectedAvailability = () => fixture.availability(state.date, state.empty);
  const dateOf = slot => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(slot.startsAt));
  const canConfirm = () => !state.error && !state.busy && (state.slot || state.empty) && state.name.trim().length >= 2 && /^[+\d\s()-]{8,24}$/.test(state.phone) && state.consent;
  function setCopy() {
    copy = window.KMT_PREVIEW[locale]; chat = window.KMT_CATALOGS.chat[locale];
    policy = window.KMT_CATALOGS.policy[locale]; booking = window.KMT_CATALOGS.booking[locale];
    document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; document.documentElement.dataset.theme = theme;
    document.title = `KMT · ${copy.directions[Number(direction) - 1].name}`;
  }
  function toolbar() {
    document.getElementById('prototype-toolbar').innerHTML = `<div class="preview-toolbar"><a href="../index.html?lang=${locale}&theme=${theme}">${icon('previous')} ${copy.gallery}</a><span class="preview-badge">${copy.local}</span><div class="preview-tools"><label class="sr-only" for="preview-state">${copy.state}</label><select id="preview-state">${Object.entries(copy.scenarios).map(([value, label]) => `<option value="${value}" ${state.scenario === value ? 'selected' : ''}>${label}</option>`).join('')}</select><button class="btn quiet lang-button" data-action="language">${copy.language}</button><button class="icon-button" data-action="theme" aria-label="${copy.theme}">${icon(theme === 'dark' ? 'sun' : 'moon')}</button></div></div>`;
  }
  function brand() { return `<div class="brand"><img src="../shared/assets/kmt-logo.webp" alt="KMT Legal" width="50" height="50"><div class="brand-wordmark">KMT<small>LEGAL</small></div></div>`; }
  function intro() { return `<aside class="intro"><p class="eyebrow">${copy.eyebrow}</p><h1>${copy.headline}</h1><p>${copy.subhead}</p><div class="intro-note">${icon('shield')}${copy.privacy}<br>${copy.assistantNote}</div></aside>`; }
  function chatHead() { return `<header class="chat-head"><div class="assistant-mark">${direction === '04' ? '<img src="../shared/assets/kmt-logo.webp" alt="" width="42" height="42">' : icon(direction === '03' ? 'calendar' : 'scales')}</div><div><h2 class="chat-title">${chat.title}</h2><p>${copy.description}</p></div><span class="head-meta">KMT / ${direction}</span></header>`; }
  function chatCard() {
    return `<section class="chat-card" aria-label="${chat.title}">${chatHead()}<div class="conversation-day">${copy.today}</div><div class="chat-log" role="log" aria-live="polite" aria-relevant="additions" id="chat-log"></div><div id="chat-feedback"></div><form id="chat-form" class="composer"><label class="sr-only" for="message">${chat.message}</label><textarea id="message" rows="1" maxlength="4000" dir="auto" placeholder="${copy.placeholder}">${escape(state.text)}</textarea><button type="submit" class="btn" id="send-button" aria-label="${chat.send}">${icon('arrow')}</button></form><div class="chat-actions"><button class="btn" data-action="open-booking" id="open-booking">${icon('calendar')}${policy.begin}</button><button class="btn quiet" data-action="account">${policy.account}</button></div><div class="chat-foot"><p class="privacy-note">${icon('shield')}${copy.privacy}</p><button class="btn quiet" data-action="whatsapp">${booking.whatsapp}</button></div></section>`;
  }
  function render() {
    setCopy(); toolbar();
    const card = chatCard(), lead = intro();
    const layouts = {
      '01': `<div class="experience">${lead}<div>${card}<p class="assistant-footnote">${copy.assistantNote}</p></div></div>`,
      '02': `<div class="experience"><div class="conversation-intro"><p class="eyebrow">${copy.eyebrow}</p><h1>${copy.welcome}</h1><p>${copy.description}</p></div>${card}<p class="assistant-footnote">${copy.assistantNote}</p></div>`,
      '03': `<div class="experience"><div class="desk-caption"><p class="eyebrow">${copy.eyebrow}</p><h1>${copy.ready}</h1><p>${copy.bookingContext}</p></div><div class="desk-workspace"><aside class="chat-side-label">${icon('scales')}<span>${copy.service}</span><div class="line"></div><span>${copy.today}</span></aside>${card}</div><p class="assistant-footnote">${copy.assistantNote}</p></div>`,
      '04': `<div class="experience"><div class="concierge-intro">${brand()}<p class="eyebrow">${copy.eyebrow}</p><h1>${copy.welcome}</h1><p>${copy.subhead}</p></div>${card}<p class="assistant-footnote">${copy.assistantNote}</p></div>`,
      '05': `<div class="experience"><div class="minimal-intro"><p class="eyebrow">${copy.eyebrow}</p><h1>${copy.welcome}</h1></div>${card}<p class="assistant-footnote">${copy.assistantNote}</p></div>`
    };
    root.innerHTML = `<div class="site-header">${brand()}<span class="site-caption">${copy.directions[Number(direction) - 1].tagline}</span></div>${layouts[direction]}<div id="dialog-mount"></div>`;
    renderMessages(); renderDialog(); specimen();
  }
  function renderMessages() {
    const initial = [ ['user', copy.question], ['assistant', copy.answer], ['user', copy.followup], ['assistant', copy.response] ];
    const rows = [...initial, ...state.messages.map(m => [m.type, m.body])];
    if (state.staff) rows.push(['staff', booking.claimed]);
    document.getElementById('chat-log').innerHTML = rows.map(([type, body]) => `<article class="message ${type}"><div class="message-author">${icon(type === 'user' ? 'person' : type === 'staff' ? 'message' : 'scales')}<span>${type === 'user' ? copy.you : type === 'staff' ? chat.staff : copy.yourAssistant}</span></div><p dir="auto">${escape(body)}</p></article>`).join('');
    document.getElementById('chat-feedback').innerHTML = state.busy ? `<p role="status" class="chat-status">${icon('clock')}${chat.waiting}</p>` : state.chatError ? `<div class="chat-status error" role="alert"><span>${chat.unavailable}</span><button type="button" class="btn secondary" data-action="retry-chat">${chat.retry}</button></div>` : '';
    document.getElementById('send-button').disabled = state.busy || !state.text.trim();
    document.getElementById('message').disabled = state.busy;
    document.getElementById('chat-log').scrollTop = document.getElementById('chat-log').scrollHeight;
  }
  function weekly() { return `<details class="weekly-schedule"><summary><span>${copy.weekly}</span><span>${numeral(60)} ${booking.minutes} · ${booking.cairo}</span>${icon('chevron')}</summary><div class="weekly-list"><span>${copy.weekdays}</span><span>${clockLabel(fixture.slotsByDate[fixture.firstDate][0].startsAt)} – ${clockLabel(fixture.slotsByDate[fixture.firstDate].at(-1).endsAt)}</span><span>${copy.friday}</span><span>${copy.closed}</span></div></details>`; }
  function nearest(availability) {
    const next = availability.nearestSlot;
    return next ? `<div class="nearest"><div><p class="eyebrow">${booking.nearestOne}</p><p class="nearest-time">${dateLabel(dateOf(next), true)} · ${clockLabel(next.startsAt)}</p></div><button class="btn secondary" type="button" data-action="nearest" aria-label="${booking.chooseNearest}">${booking.chooseNearest}${icon('check')}</button></div>` : '';
  }
  function calendar(availability) {
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(availability.days[state.page * 7].date + 'T12:00:00Z'));
    return `<div class="date-navigation"><h3>${month}</h3><div class="nav-buttons"><button class="icon-button" type="button" data-action="previous-week" aria-label="${booking.previousDays}" ${state.page === 0 ? 'disabled' : ''}>${icon(locale === 'ar' ? 'next' : 'previous')}</button><button class="icon-button" type="button" data-action="next-week" aria-label="${booking.nextDays}" ${state.page === 1 ? 'disabled' : ''}>${icon(locale === 'ar' ? 'previous' : 'next')}</button></div></div><div class="week-days" role="group" aria-label="${booking.daysTitle}">${availability.days.slice(state.page * 7, state.page * 7 + 7).map(day => `<button type="button" class="day-button" data-date="${day.date}" data-focus="day-${day.date}" aria-pressed="${day.date === state.date}" data-unavailable="${day.status !== 'AVAILABLE'}" aria-label="${dateLabel(day.date)} · ${booking.availabilityReasons[day.status]}"><span class="day-name">${weekdayLabel(day.date)}</span><span class="day-number">${numeral(Number(day.date.slice(-2)))}</span><span class="day-status">${day.status === 'AVAILABLE' ? copy.available : day.status === 'FULL' ? copy.full : copy.closed}</span></button>`).join('')}</div><label class="direct-date"><span>${booking.date}</span><input type="date" id="direct-date" value="${state.date}" min="${fixture.days[0].date}" max="${fixture.days.at(-1).date}" data-focus="direct-date"></label>`;
  }
  function timeChoices(availability) {
    const day = availability.selectedDay;
    let explanation = day.status !== 'AVAILABLE' ? `<div class="day-explanation" role="status"><p>${booking.availabilityReasons[day.status]}</p></div>` : day.closedPeriods.length ? `<div class="day-explanation" role="status"><p>${booking.closedPeriods}: ${locale === 'ar' ? '١٠:٠٠ ص – ١٢:٠٠ م' : '10:00 AM – 12:00 PM'}</p></div>` : '';
    if (!availability.slots.length) return explanation;
    return explanation + `<fieldset class="time-fieldset"><legend>${booking.dayTimes} · ${dateLabel(state.date, true)}</legend><div class="time-grid">${availability.slots.map((slot, i) => `<label class="time-option"><input type="radio" name="appointment-time" value="${slot.startsAt}" data-focus="slot-${i}" ${state.slot?.startsAt === slot.startsAt ? 'checked' : ''}><span>${clockLabel(slot.startsAt)}</span></label>`).join('')}</div><p class="slot-caption">${copy.bookingHint}</p></fieldset>`;
  }
  function contact() {
    return `<section class="contact-column"><h3 class="section-title">${copy.contact}</h3><label class="field-label"><span>${booking.name}</span><input id="full-name" name="fullName" data-focus="full-name" value="${escape(state.name)}" placeholder="${copy.namePlaceholder}" autocomplete="name" minlength="2" maxlength="160" required ${state.editing ? 'disabled' : ''}></label><label class="field-label"><span>${booking.number}</span><input id="phone" name="phone" data-focus="phone" value="${escape(state.phone)}" placeholder="${copy.phonePlaceholder}" type="tel" dir="ltr" autocomplete="tel" maxlength="24" minlength="8" required ${state.editing ? 'disabled' : ''}></label><fieldset class="channel-fieldset"><legend>${booking.channel}</legend><div class="channel-options">${['PHONE', 'WHATSAPP'].map(channel => `<label class="channel-option"><input type="radio" name="channel" value="${channel}" data-focus="channel-${channel}" ${state.channel === channel ? 'checked' : ''}><span>${channel === 'PHONE' ? booking.phone : booking.whatsapp}</span></label>`).join('')}</div></fieldset><div id="review-mount">${review()}</div></section>`;
  }
  function review() {
    if (!state.slot && !state.empty) return `<p class="privacy-note">${icon('shield')}${copy.privacy}</p>`;
    return `<section class="review-card"><h3>${booking.review}</h3><div class="review-details">${state.slot ? `<p class="date-line">${dateLabel(state.date)} · ${clockLabel(state.slot.startsAt)}</p><p>${numeral(60)} ${booking.minutes} · ${booking.cairo}</p>` : `<p>${booking.callback}</p>`}<p class="person-line">${escape(state.name) || '—'} · <bdi>${escape(state.phone) || '—'}</bdi></p><p>${state.channel === 'PHONE' ? booking.phone : booking.whatsapp}</p></div><label class="consent-label"><input type="checkbox" id="booking-consent" data-focus="booking-consent" ${state.consent ? 'checked' : ''}><span>${booking.consent}</span></label></section>`;
  }
  function successful() {
    const data = state.confirmed;
    return `<section class="success-layout"><div class="success-mark">${icon(state.cancelled ? 'close' : 'check')}</div><p class="eyebrow">KMT LEGAL / ${copy.reference}</p><h3>${state.cancelled ? copy.cancelledTitle : copy.successTitle}</h3><p class="success-note">${copy.successNote}</p><div class="confirmation-summary"><p class="confirmed-date">${data.slot ? `${dateLabel(dateOf(data.slot))} · ${clockLabel(data.slot.startsAt)}` : booking.callbackDone}</p><p>${booking.cairo} · ${numeral(60)} ${booking.minutes}</p><p>${escape(data.name)} · <bdi>${escape(data.phone)}</bdi></p><p>${data.channel === 'PHONE' ? booking.phone : booking.whatsapp}</p><p>${booking.reference}: <bdi>CONS-DEMO-001</bdi></p></div>${!state.cancelled ? `<div class="success-actions"><button type="button" class="btn secondary" data-action="edit">${booking.change}</button><button type="button" class="btn quiet" data-action="cancel">${booking.cancel}</button></div>` : `<button type="button" class="btn secondary" data-action="new-booking">${policy.begin}</button>`}${state.cancelling ? `<div class="cancel-check"><p>${copy.cancelQuestion}</p><div class="success-actions"><button type="button" class="btn secondary" data-action="confirm-cancel">${booking.cancelConfirm}</button><button type="button" class="btn quiet" data-action="keep">${booking.keep}</button></div></div>` : ''}<p class="success-note">${booking.optionalAccount}</p></section>`;
  }
  function dialogBody() {
    if (state.confirmed && !state.editing) return successful();
    const availability = selectedAvailability();
    const schedule = `<section class="schedule-column"><h3 class="section-title">${copy.schedule}</h3>${weekly()}${state.error ? `<div class="error-panel" role="alert">${icon('clock')}<h3>${copy.errorTitle}</h3><p>${copy.retryHint}</p><button type="button" class="btn secondary" data-action="retry-booking">${booking.retry}</button></div>` : state.empty ? `<div class="empty-panel" role="status">${icon('calendar')}<h3>${copy.emptyTitle}</h3><p>${booking.availabilityReasons.UNPUBLISHED}</p><p>${booking.callback}</p></div>` : nearest(availability) + calendar(availability) + timeChoices(availability)}</section>`;
    const details = contact();
    const top = `<div class="booking-top-note"><p class="eyebrow">${copy.summary}</p><p>${state.slot ? `${dateLabel(state.date)} · ${clockLabel(state.slot.startsAt)}` : copy.noSelection}</p></div>`;
    const layouts = {
      '01': `<div class="booking-layout">${schedule}${details}</div>`,
      '02': `<div class="booking-layout"><div class="booking-conversation-note">${icon('message')}<p>${copy.bookingDescription}</p></div>${schedule}${details}</div>`,
      '03': `<div class="booking-layout"><div class="appointment-desk-label">${icon('calendar')}<span>${booking.scheduleTitle}</span></div>${schedule}${details}</div>`,
      '04': `${top}<div class="booking-layout">${schedule}${details}</div>`,
      '05': `<div class="booking-layout">${schedule}<div class="minimal-divider"></div>${details}</div>`
    };
    return layouts[direction];
  }
  function renderDialog() {
    const old = document.getElementById('booking-dialog');
    const scroll = old?.querySelector('.dialog-scroll')?.scrollTop || 0;
    const focused = old?.contains(document.activeElement) ? document.activeElement.dataset.focus : null;
    const existing = !!state.confirmed && !state.editing;
    const title = existing ? copy.summary : state.editing ? copy.editTitle : copy.bookingTitle;
    document.getElementById('dialog-mount').innerHTML = `<dialog id="booking-dialog" class="booking-dialog" aria-labelledby="booking-title" aria-describedby="booking-description"><header class="dialog-head"><div><p class="eyebrow">KMT LEGAL / ${copy.bookingContext}</p><h2 id="booking-title">${title}</h2><p id="booking-description">${copy.bookingDescription}</p></div><button type="button" class="icon-button" data-action="close-booking" aria-label="${copy.close}" data-focus="close">${icon('close')}</button></header><form id="booking-form" class="dialog-form"><div class="dialog-scroll">${dialogBody()}</div><footer class="dialog-footer"><div class="footer-summary" id="footer-picked">${state.slot ? `<strong>${dateLabel(state.date, true)} · ${clockLabel(state.slot.startsAt)}</strong>${booking.cairo}` : copy.noSelection}</div>${existing ? `<button type="button" class="btn secondary" data-action="close-booking">${booking.closeForm}</button>` : `<button type="submit" class="btn" id="confirm-booking" ${canConfirm() ? '' : 'disabled'}>${state.empty ? booking.callback : booking.confirm}</button>`}</footer></form></dialog>`;
    const dialog = document.getElementById('booking-dialog');
    validatePhone();
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeBooking(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeBooking(); });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, a[href]')]
        .filter(control => control.getClientRects().length && (control.type !== 'radio' || control.checked ||
          (!dialog.querySelector(`input[name="${CSS.escape(control.name)}"]:checked`) && control === dialog.querySelector(`input[name="${CSS.escape(control.name)}"]`))));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    if (state.open) {
      dialog.showModal(); dialog.querySelector('.dialog-scroll').scrollTop = scroll;
      (focused ? dialog.querySelector(`[data-focus="${focused}"]`) : null)?.focus({ preventScroll: true });
    }
  }
  function updateReview() {
    const mount = document.getElementById('review-mount'); if (mount) mount.innerHTML = review();
    const confirm = document.getElementById('confirm-booking'); if (confirm) confirm.disabled = !canConfirm();
    validatePhone();
  }
  function validatePhone() {
    const input = document.getElementById('phone'); if (!input) return;
    let hint = document.getElementById('phone-error');
    if (!hint) { hint = document.createElement('small'); hint.id = 'phone-error'; hint.className = 'specimen-error'; hint.setAttribute('role', 'alert'); input.after(hint); input.setAttribute('aria-describedby', hint.id); }
    const invalid = !!state.phone && !/^[+\d\s()-]{8,24}$/.test(state.phone);
    input.setAttribute('aria-invalid', String(invalid)); hint.textContent = invalid ? copy.errorExample : ''; hint.hidden = !invalid;
  }
  function openBooking() { opener = document.activeElement; state.open = true; renderDialog(); }
  function closeBooking() { state.open = false; document.getElementById('booking-dialog')?.close(); (opener?.isConnected ? opener : document.getElementById('open-booking'))?.focus(); }
  function chooseDate(date) {
    if (!fixture.days.some(day => day.date === date) || date === state.date) return;
    state.date = date; state.page = Math.floor(fixture.days.findIndex(day => day.date === date) / 7); state.slot = null; state.consent = false; renderDialog();
  }
  function scenario(name) {
    clearTimeout(sendTimer); state.scenario = name; state.busy = name === 'waiting'; state.chatError = name === 'error'; state.staff = name === 'staff'; state.error = name === 'error'; state.empty = name === 'empty';
    state.confirmed = null; state.editing = false; state.cancelling = false; state.cancelled = false; state.slot = null; state.consent = false; state.date = name === 'closed' ? fixture.closedDate : fixture.firstDate; state.page = 0;
    if (['review', 'success'].includes(name)) { state.slot = fixture.slotsByDate[state.date][0]; state.name = copy.syntheticName; state.phone = '01000000000'; }
    if (name === 'success') { state.consent = true; state.confirmed = { slot: state.slot, name: state.name, phone: state.phone, channel: state.channel }; }
    state.open = ['booking', 'review', 'closed', 'empty', 'success', 'error'].includes(name); render();
  }
  function send(retry = false) {
    if (state.busy || !state.text.trim()) return;
    if (!retry) state.messages.push({ type: 'user', body: state.text.trim() });
    state.chatError = false;
    if (state.staff) { state.text = ''; document.getElementById('message').value = ''; renderMessages(); return; }
    state.busy = true; renderMessages();
    sendTimer = setTimeout(() => {
      state.messages.push({ type: 'assistant', body: policy.safeReply }); state.busy = false; state.text = ''; document.getElementById('message').value = ''; document.getElementById('message').style.height = '44px'; renderMessages(); document.getElementById('message').focus();
    }, 550);
  }
  function specimen() {
    document.getElementById('specimen').innerHTML = `<details class="specimen"><summary>${copy.specimen}</summary><div class="specimen-body"><p>${copy.specimenIntro}</p><div class="specimen-grid"><section><h3>${copy.colors}</h3><div class="swatches">${['--canvas', '--surface', '--tint', '--gold-fill', '--text'].map(token => `<span class="swatch" style="background:var(${token})" title="${token}"></span>`).join('')}</div><p class="specimen-system">KMT · IBM Plex Sans Arabic / Inter · 4 / 8 / 12 / 16 / 24 / 32</p></section><section><h3>${copy.type}</h3><p class="chat-title">${copy.textSample}</p><p>${copy.description}</p><p class="privacy-note">${copy.privacy}</p></section><section><h3>${copy.controls}</h3><div class="specimen-controls"><button class="btn" type="button">${copy.normalAction}</button><button class="btn secondary" type="button">${copy.secondaryAction}</button><button class="btn" type="button" disabled>${copy.disabled}</button><label class="sr-only" for="specimen-field">${copy.fieldExample}</label><input id="specimen-field" placeholder="${copy.fieldExample}"><p class="specimen-error">${copy.errorExample}</p><p class="specimen-success">${copy.successExample}</p></div></section></div></div></details>`;
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action], [data-date]'); if (!button || button.disabled) return;
    if (button.dataset.date) { chooseDate(button.dataset.date); return; }
    const action = button.dataset.action;
    if (action === 'open-booking') openBooking();
    if (action === 'close-booking') closeBooking();
    if (action === 'language') { locale = locale === 'ar' ? 'en' : 'ar'; render(); }
    if (action === 'theme') { theme = theme === 'dark' ? 'light' : 'dark'; render(); }
    if (action === 'previous-week' || action === 'next-week') { state.page += action === 'next-week' ? 1 : -1; renderDialog(); }
    if (action === 'nearest') { const nearest = selectedAvailability().nearestSlot; if (nearest) { state.date = dateOf(nearest); state.page = Math.floor(fixture.days.findIndex(day => day.date === state.date) / 7); state.slot = nearest; state.consent = false; renderDialog(); } }
    if (action === 'retry-booking') { state.error = false; state.chatError = false; renderMessages(); renderDialog(); }
    if (action === 'retry-chat') { if (!state.text) state.text = copy.question; send(true); }
    if (action === 'edit') { state.editing = true; state.slot = null; state.consent = false; renderDialog(); }
    if (action === 'cancel') { state.cancelling = true; renderDialog(); }
    if (action === 'keep') { state.cancelling = false; renderDialog(); }
    if (action === 'confirm-cancel') { state.cancelled = true; state.cancelling = false; renderDialog(); }
    if (action === 'new-booking') { state.confirmed = null; state.editing = false; state.slot = null; state.consent = false; state.cancelled = false; renderDialog(); }
    if (['account', 'whatsapp'].includes(action)) document.getElementById('chat-feedback').innerHTML = `<p role="status" class="chat-status">${copy.successNote}</p>`;
  });
  document.addEventListener('input', event => {
    const input = event.target;
    if (input.id === 'message') { state.text = input.value; input.style.height = '44px'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; document.getElementById('send-button').disabled = state.busy || !state.text.trim(); }
    if (input.id === 'full-name' || input.id === 'phone') { state[input.id === 'full-name' ? 'name' : 'phone'] = input.value; state.consent = false; updateReview(); }
  });
  document.addEventListener('change', event => {
    const input = event.target;
    if (input.id === 'preview-state') scenario(input.value);
    if (input.id === 'direct-date') chooseDate(input.value);
    if (input.name === 'appointment-time') { state.slot = selectedAvailability().slots.find(slot => slot.startsAt === input.value); state.consent = false; renderDialog(); }
    if (input.name === 'channel') { state.channel = input.value; state.consent = false; updateReview(); }
    if (input.id === 'booking-consent') { state.consent = input.checked; document.getElementById('confirm-booking').disabled = !canConfirm(); }
  });
  document.addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'chat-form') send();
    if (event.target.id === 'booking-form' && canConfirm()) { state.confirmed = { slot: state.slot, name: state.name.trim(), phone: state.phone, channel: state.channel }; state.editing = false; state.cancelled = false; renderDialog(); }
  });
  render(); if (query.has('scene') && query.get('scene') !== 'normal') scenario(query.get('scene'));
})();
