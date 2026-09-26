/* Stager button START */
/* Letter-roll hover on [data-stager-btn] buttons with a [data-stager-text]
   label. Shared by site.ts (buttons present at page load) and chat-widget.ts
   (buttons created later). Safe to call repeatedly: each label is only
   initialised once. */
export function initStagerButtons() {
  document.querySelectorAll<HTMLElement>('[data-stager-text]').forEach((el) => {
    if (el.dataset.stagerInit) return;
    el.dataset.stagerInit = '1';
    const original = el.textContent ?? '';
    el.innerHTML = '';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.style.display = 'inline-block';
    const rowIn = document.createElement('span');
    rowIn.style.cssText = 'display:flex;';
    const rowOut = document.createElement('span');
    rowOut.style.cssText =
      'display:flex; position:absolute; top:50%; left:0; right:0; justify-content:center; transform:translateY(-50%);';
    original.split('').forEach((char, i) => {
      const delay = i * 25 + 'ms';
      const s1 = document.createElement('span');
      s1.textContent = char === ' ' ? ' ' : char;
      s1.style.cssText = `display:inline-block; transition:transform 0.5s ${delay}, opacity 0.4s ${delay}; transition-timing-function:cubic-bezier(0.76,0,0.24,1);`;
      rowIn.appendChild(s1);
      const s2 = document.createElement('span');
      s2.textContent = char === ' ' ? ' ' : char;
      s2.style.cssText = `display:inline-block; transform:translateY(120%); opacity:0; transition:transform 0.5s ${delay}, opacity 0.4s ${delay}; transition-timing-function:cubic-bezier(0.76,0,0.24,1);`;
      rowOut.appendChild(s2);
    });
    el.appendChild(rowIn);
    el.appendChild(rowOut);
    const btn = el.closest<HTMLElement>('[data-stager-btn]');
    if (!btn) return;
    btn.addEventListener('mouseenter', () => {
      rowIn.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = 'translateY(-120%)';
        (s as HTMLElement).style.opacity = '0';
      });
      rowOut.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = 'translateY(0)';
        (s as HTMLElement).style.opacity = '1';
      });
    });
    btn.addEventListener('mouseleave', () => {
      rowIn.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = '';
        (s as HTMLElement).style.opacity = '';
      });
      rowOut.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = 'translateY(120%)';
        (s as HTMLElement).style.opacity = '0';
      });
    });
  });
}
/* Stager button END */
