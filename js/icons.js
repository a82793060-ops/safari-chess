// ==== نظام الأيقونات: SVG بدل الإيموجي في الأزرار ====
// تُحقن تلقائيا حسب معرف الزر مع الحفاظ على نصوص i18n

const ICONS = {
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.5 1 2.5h6c0-1 .4-1.9 1-2.5A6 6 0 0 0 12 3z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  door: '<path d="M13 3H5v18h8"/><path d="m17 16 4-4-4-4"/><path d="M21 12H10"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.8-1.3"/>',
  next: '<path d="m6 5 8 7-8 7"/><path d="M18 5v14"/>',
  paw: '<circle cx="7" cy="8" r="2.2"/><circle cx="17" cy="8" r="2.2"/><circle cx="4.5" cy="14" r="2"/><circle cx="19.5" cy="14" r="2"/><path d="M12 11c-3 0-5.5 2.6-5.5 5.2 0 1.8 1.4 2.8 3 2.8 1 0 1.7-.5 2.5-.5s1.5.5 2.5.5c1.6 0 3-1 3-2.8C17.5 13.6 15 11 12 11z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  puzzle: '<path d="M20 13v6a1 1 0 0 1-1 1h-6v-2.3a2 2 0 1 0-3 0V20H4a1 1 0 0 1-1-1v-6h2.3a2 2 0 1 0 0-3H3V5a1 1 0 0 1 1-1h6v2.3a2 2 0 1 0 3 0V4h6a1 1 0 0 1 1 1v5h-2.3a2 2 0 1 0 0 3H20z"/>',
  bag: '<path d="M6 8h12l1 13H5L6 8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
};

function iconSVG(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

(function injectIcons() {
  // أزرار اللعب والنوافذ: استبدال الإيموجي الأول بأيقونة
  const BTN_ICONS = {
    "btn-hint": "bulb", "btn-undo": "undo", "btn-resign": "flag",
    "btn-newgame": "home", "btn-watchlink": "eye", "btn-exit-analysis": "door",
    "btn-analyze": "search", "btn-share": "share", "btn-pgn": "copy",
    "btn-puzzle-hint": "bulb", "btn-puzzle-solution": "unlock",
    "btn-puzzle-next": "next", "btn-puzzle-back": "home",
  };
  for (const [id, name] of Object.entries(BTN_ICONS)) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    // النص داخل span[data-i18n] يبقى؛ نزيل الإيموجي الحر ونضع الأيقونة
    for (const node of [...btn.childNodes]) {
      if (node.nodeType === 3 && node.textContent.trim()) node.remove();
    }
    btn.insertAdjacentHTML("afterbegin", iconSVG(name));
  }
  // تبويبات الأطوار
  const TAB_ICONS = { bot: "paw", online: "link", puzzles: "puzzle", shop: "bag" };
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    const name = TAB_ICONS[tab.dataset.mode];
    if (!name) return;
    for (const node of [...tab.childNodes]) {
      if (node.nodeType === 3 && node.textContent.trim()) node.remove();
    }
    tab.insertAdjacentHTML("afterbegin", iconSVG(name));
  });
})();
