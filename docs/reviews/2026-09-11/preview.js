const views = [...document.querySelectorAll('.view')];
function showView(id) {
  if (!views.some(view => view.id === id)) id = 'home';
  views.forEach(view => { view.hidden = view.id !== id; });
  document.querySelectorAll('.review-bar [data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === id)));
  history.replaceState(null, '', '#' + id);
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('.brand[href]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); showView(link.hash.slice(1)); }));
const office = document.querySelector('#office');
const theme = document.querySelector('.theme-switch');
function setTheme(value) { const dark = value === 'dark'; office.dataset.theme = dark ? 'dark' : 'light'; theme.setAttribute('aria-pressed', String(dark)); theme.setAttribute('aria-label', dark ? 'تفعيل المظهر الفاتح' : 'تفعيل المظهر الداكن'); theme.querySelector('span').textContent = dark ? 'المظهر الفاتح' : 'المظهر الداكن'; }
try { setTheme(localStorage.getItem('kmt-design-review-theme')); } catch { setTheme('light'); }
theme.addEventListener('click', () => { setTheme(office.dataset.theme === 'dark' ? 'light' : 'dark'); try { localStorage.setItem('kmt-design-review-theme', office.dataset.theme); } catch {} });
const result = document.querySelector('.demo-result');
const confirm = document.querySelector('#confirm-demo');
document.querySelectorAll('.slots button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.slots button').forEach(slot => slot.setAttribute('aria-pressed', String(slot === button))); document.querySelector('#chosen-slot').textContent = 'الثلاثاء · ' + button.textContent; result.textContent = ''; confirm.disabled = false; }));
confirm.addEventListener('click', () => { result.textContent = 'تمت مراجعة اختيارات المعاينة. لم يُنشأ حجز حقيقي.'; confirm.disabled = true; });
document.querySelector('#edit-demo').addEventListener('click', () => { document.querySelector('.slots button').focus(); result.textContent = 'يمكنك اختيار موعد آخر أو كتابة التعديل في الرسالة.'; confirm.disabled = false; });
document.querySelector('.composer').addEventListener('submit', event => { event.preventDefault(); const input = document.querySelector('#demo-message'); if (!input.value.trim()) return; const log = document.querySelector('.chat-log'); const user = document.createElement('div'); user.className = 'bubble user'; user.textContent = input.value; log.append(user); const reply = document.createElement('div'); reply.className = 'bubble assistant'; reply.textContent = 'هذه معاينة للشكل فقط. لن نرسل رسالتك إلى المكتب.'; log.append(reply); input.value = ''; log.scrollTop = log.scrollHeight; });
document.querySelectorAll('.office-sidebar nav button,.row-action').forEach(button => button.addEventListener('click', () => { document.querySelector('.office-demo-feedback').textContent = 'اخترت: ' + button.textContent.trim() + ' — تُعرض التفاصيل في النسخة الفعلية بعد اعتماد التصميم.'; }));
showView(location.hash.slice(1));

window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
window.addEventListener('load', () => window.scrollTo(0, 0));
