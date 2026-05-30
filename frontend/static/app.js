const API = '/api';

/* ─── State ──────────────────────── */
let allItems      = [];
let categories    = [];
let deliveryZones = [];
let cart          = [];   // { _key, id, name, price, qty, notes, image_url, category }
let orderType     = 'retirada';
let deliveryFee   = 0;
let sheetItem     = null;
let sheetQty      = 1;
let searchQuery   = '';
let catObserver   = null;
let toastTimer    = null;

/* ─── Boot ───────────────────────── */
async function init() {
  setupListeners();
  setupScrollBehavior();
  await Promise.all([loadItems(), loadDeliveryZones()]);
}

async function loadDeliveryZones() {
  try {
    const res = await fetch(`${API}/delivery/zones`);
    if (res.ok) {
      deliveryZones = await res.json();
      const sel = document.getElementById('customer-neighborhood');
      deliveryZones.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z.id;
        opt.textContent = z.fee > 0
          ? `${z.neighborhood} — ${price(z.fee)}`
          : `${z.neighborhood} — Grátis`;
        sel.appendChild(opt);
      });
    }
  } catch { /* offline */ }
}

/* ─── Load items ─────────────────── */
async function loadItems() {
  try {
    const res = await fetch(`${API}/items/`);
    allItems = await res.json();
    categories = [...new Set(allItems.map(i => i.category).filter(Boolean))];
    buildCatNav();
    renderGroupedItems(allItems);
  } catch {
    document.getElementById('skeleton-wrap').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
  }
}

/* ─── Category nav ───────────────── */
function buildCatNav() {
  const nav = document.getElementById('cat-nav-inner');
  nav.innerHTML = categories.map(cat => `
    <button class="cat-tab" data-cat="${esc(cat)}"
      onclick="scrollToCategory('${esc(cat)}')">${esc(cat)}</button>
  `).join('');
  if (categories[0]) setActiveCatTab(categories[0]);
}

function setActiveCatTab(cat) {
  document.querySelectorAll('.cat-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === cat)
  );
  scrollTabIntoView(cat);
}

function scrollTabIntoView(cat) {
  const tab = document.querySelector(`.cat-tab[data-cat="${CSS.escape(cat)}"]`);
  if (tab) tab.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
}

function scrollToCategory(cat) {
  const section = document.getElementById(`section-${slugify(cat)}`);
  if (!section) return;
  const offset = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--header-h')) +
    parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--cat-nav-h')) + 12;
  const top = section.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ─── Render items ───────────────── */
function renderGroupedItems(items) {
  const skeleton = document.getElementById('skeleton-wrap');
  const content  = document.getElementById('menu-content');
  const empty    = document.getElementById('empty-state');

  skeleton.classList.add('hidden');

  if (!items.length) {
    content.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  if (catObserver) catObserver.disconnect();

  const grouped = groupByCategory(items);
  content.innerHTML = Object.entries(grouped).map(([cat, catItems]) => `
    <section class="cat-section" id="section-${slugify(cat)}" data-category="${esc(cat)}">
      <h3 class="cat-section-heading">${esc(cat)}</h3>
      <div class="items-list">
        ${catItems.map((item, i) => renderCard(item, i)).join('')}
      </div>
    </section>
  `).join('');

  setupCategoryObserver();
}

function renderCard(item, idx) {
  const totalQty = getItemQty(item.id);
  const delay = `s${(idx % 9) + 1}`;

  const imgEl = item.image_url
    ? `<div class="item-card-img-wrap"><img src="${esc(item.image_url)}" alt="${esc(item.name)}" loading="lazy" /></div>`
    : `<div class="item-card-placeholder">🌭</div>`;

  const ctaEl = totalQty === 0
    ? `<button class="btn-plus ripple-btn" onclick="event.stopPropagation(); quickAdd(${item.id})" aria-label="Adicionar ${esc(item.name)}">
         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
       </button>`
    : `<div class="qty-pill" id="qpill-${item.id}">
         <button class="qty-pill-btn" onclick="event.stopPropagation(); quickRemove(${item.id})">−</button>
         <span class="qty-pill-val">${totalQty}</span>
         <button class="qty-pill-btn" onclick="event.stopPropagation(); quickAdd(${item.id})">+</button>
       </div>`;

  return `
    <div class="item-card ${delay}" id="card-${item.id}" onclick="openItemSheet(${item.id})">
      <div class="item-card-info">
        ${item.category ? `<span class="item-cat-label">${esc(item.category)}</span>` : ''}
        <span class="item-card-name">${esc(item.name)}</span>
        ${item.description ? `<span class="item-card-desc">${esc(item.description)}</span>` : ''}
        <div class="item-card-footer">
          <span class="item-card-price">${price(item.price)}</span>
          <div id="cta-${item.id}">${ctaEl}</div>
        </div>
      </div>
      ${imgEl}
    </div>`;
}

function updateCardCta(itemId) {
  const cta = document.getElementById(`cta-${itemId}`);
  if (!cta) return;
  const totalQty = getItemQty(itemId);
  if (totalQty === 0) {
    cta.innerHTML = `<button class="btn-plus ripple-btn" onclick="event.stopPropagation(); quickAdd(${itemId})" aria-label="Adicionar">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
    </button>`;
  } else {
    cta.innerHTML = `<div class="qty-pill">
      <button class="qty-pill-btn" onclick="event.stopPropagation(); quickRemove(${itemId})">−</button>
      <span class="qty-pill-val">${totalQty}</span>
      <button class="qty-pill-btn" onclick="event.stopPropagation(); quickAdd(${itemId})">+</button>
    </div>`;
  }
}

/* ─── Category Intersection Observer ─ */
function setupCategoryObserver() {
  const sections = document.querySelectorAll('.cat-section');
  const headerH  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))  || 56;
  const catNavH  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cat-nav-h')) || 48;
  const topMargin = -(headerH + catNavH + 16);

  catObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActiveCatTab(entry.target.dataset.category);
    });
  }, {
    rootMargin: `${topMargin}px 0px -55% 0px`,
    threshold: 0
  });

  sections.forEach(s => catObserver.observe(s));
}

/* ─── Search ─────────────────────── */
function applySearch() {
  const q = searchQuery.toLowerCase();
  if (!q) { renderGroupedItems(allItems); return; }
  const filtered = allItems.filter(i =>
    i.name.toLowerCase().includes(q) ||
    (i.description && i.description.toLowerCase().includes(q))
  );
  renderGroupedItems(filtered);
}

/* ─── Quick add/remove (card CTA) ─── */
function quickAdd(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;
  const key = `${itemId}_plain`;
  const existing = cart.find(i => i._key === key);
  if (existing) existing.qty++;
  else cart.push({ ...item, qty: 1, notes: '', _key: key });
  updateCardCta(itemId);
  refreshCartBar();
  showToast(`${item.name} adicionado!`);
}

function quickRemove(itemId) {
  const entries = cart.filter(i => i.id === itemId);
  if (!entries.length) return;
  const target = entries[entries.length - 1]; // remove from last added
  if (target.qty > 1) target.qty--;
  else cart.splice(cart.indexOf(target), 1);
  updateCardCta(itemId);
  refreshCartBar();
}

function getItemQty(itemId) {
  return cart.filter(i => i.id === itemId).reduce((s, i) => s + i.qty, 0);
}

/* ─── Item Sheet ─────────────────── */
function openItemSheet(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;
  sheetItem = item;
  sheetQty  = 1;

  document.getElementById('item-sheet-title').textContent = item.name;
  document.getElementById('item-sheet-desc').textContent  = item.description || '';
  document.getElementById('item-sheet-qty').textContent   = 1;
  document.getElementById('item-sheet-notes').value       = '';

  const catEl = document.getElementById('item-sheet-cat');
  catEl.textContent   = item.category || '';
  catEl.style.display = item.category ? '' : 'none';

  document.getElementById('item-sheet-img').innerHTML = item.image_url
    ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" />`
    : `<div class="item-sheet-placeholder">🌭</div>`;

  refreshSheetBtn();
  openSheet('item-sheet');
}

function refreshSheetBtn() {
  if (!sheetItem) return;
  document.getElementById('item-sheet-price').textContent = price(sheetItem.price);
  document.getElementById('item-sheet-add').textContent =
    `Adicionar${sheetQty > 1 ? ` ${sheetQty}x` : ''} — ${price(sheetItem.price * sheetQty)}`;
}

function addSheetItemToCart() {
  if (!sheetItem) return;
  const notes = document.getElementById('item-sheet-notes').value.trim();
  const key   = notes ? `${sheetItem.id}_${btoa(notes).slice(0,12)}` : `${sheetItem.id}_plain`;
  const existing = cart.find(i => i._key === key);
  if (existing) existing.qty += sheetQty;
  else cart.push({ ...sheetItem, qty: sheetQty, notes, _key: key });

  updateCardCta(sheetItem.id);
  refreshCartBar();
  showToast(`${sheetItem.name} adicionado!`);
  closeSheet('item-sheet');
}

/* ─── Cart sheet ─────────────────── */
function openCartSheet() {
  refreshCartSheet();
  openSheet('cart-sheet');
}

function refreshCartSheet() {
  const isEmpty  = cart.length === 0;
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal + (orderType === 'entrega' ? deliveryFee : 0);

  document.getElementById('cart-empty').classList.toggle('hidden', !isEmpty);
  document.getElementById('cart-list').classList.toggle('hidden', isEmpty);
  document.getElementById('cart-footer').classList.toggle('hidden', isEmpty);
  document.getElementById('cart-customer-wrap').style.display = isEmpty ? 'none' : '';

  const feeRow = document.getElementById('cart-fee-row');
  if (orderType === 'entrega' && deliveryFee > 0) {
    feeRow.classList.remove('hidden');
    document.getElementById('cart-fee-val').textContent = price(deliveryFee);
  } else {
    feeRow.classList.add('hidden');
  }
  document.getElementById('cart-total-val').textContent = price(total);

  document.getElementById('cart-list').innerHTML = cart.map(item => `
    <li class="cart-item">
      ${item.image_url
        ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" class="cart-item-thumb" />`
        : `<div class="cart-item-thumb-placeholder">🌭</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        ${item.notes ? `<div class="cart-item-notes">📝 ${esc(item.notes)}</div>` : ''}
        <div class="cart-item-price">${price(item.price)} cada</div>
      </div>
      <div class="cart-item-qty">
        <button class="cart-qty-btn" onclick="cartAdjust('${esc(item._key)}', -1)">−</button>
        <span class="cart-qty-val">${item.qty}</span>
        <button class="cart-qty-btn" onclick="cartAdjust('${esc(item._key)}', +1)">+</button>
      </div>
    </li>`).join('');
}

function cartAdjust(key, delta) {
  const item = cart.find(i => i._key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
  updateCardCta(item.id);
  refreshCartBar();
  refreshCartSheet();
}

/* ─── Cart bar ───────────────────── */
function refreshCartBar() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const isEmpty = count === 0;

  const bar = document.getElementById('cart-bar');
  bar.classList.toggle('hidden', isEmpty);
  document.getElementById('bar-badge').textContent = count;
  document.getElementById('bar-total').textContent = price(total);

  const badge = document.getElementById('header-badge');
  badge.textContent = count;
  badge.classList.toggle('hidden', isEmpty);
}

/* ─── WhatsApp ───────────────────── */
function buildMessage() {
  const name    = (document.getElementById('customer-name').value || '').trim();
  const address = (document.getElementById('customer-address').value || '').trim();
  const neighborhoodSel = document.getElementById('customer-neighborhood');
  const neighborhoodName = neighborhoodSel.options[neighborhoodSel.selectedIndex]?.text || '';

  let msg = `🌭 *PEDIDO — DOGÃO DO BINO*\n\n`;
  if (name) msg += `👤 *Nome:* ${name}\n`;

  if (orderType === 'entrega') {
    msg += `🛵 *Tipo:* Entrega\n`;
    if (neighborhoodName && neighborhoodSel.value) msg += `📍 *Bairro:* ${neighborhoodName}\n`;
    if (address) msg += `🏠 *Endereço:* ${address}\n`;
    if (deliveryFee > 0) msg += `🚚 *Taxa de entrega:* ${price(deliveryFee)}\n`;
  } else {
    msg += `🏪 *Tipo:* Retirada no local\n`;
  }

  msg += `\n*🍽️ Itens:*\n`;
  cart.forEach(item => {
    msg += `• ${item.qty}x ${item.name} — ${price(item.price * item.qty)}`;
    if (item.notes) msg += `\n  📝 ${item.notes}`;
    msg += `\n`;
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal + (orderType === 'entrega' ? deliveryFee : 0);
  msg += `\n*💰 Total: ${price(total)}*`;
  msg += `\n\n_Pedido via cardápio digital_ 🌭`;

  return encodeURIComponent(msg);
}

async function sendWhatsApp() {
  if (!cart.length) return;
  let number = '';
  try {
    const res = await fetch(`${API}/items/config`);
    if (res.ok) { const d = await res.json(); number = d.whatsapp_number || ''; }
  } catch { /* sem número configurado */ }
  window.open(`https://wa.me/${number}?text=${buildMessage()}`, '_blank');
}

/* ─── Sheet helpers ──────────────── */
function openSheet(id) {
  const overlay = document.getElementById(id);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSheet(id) {
  const overlay = document.getElementById(id);
  overlay.classList.remove('open');
  const anyOpen = document.querySelector('.sheet-overlay.open');
  if (!anyOpen) document.body.style.overflow = '';
}

/* ─── Toast ──────────────────────── */
function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2000);
}

/* ─── Ripple effect ──────────────── */
function addRipple(btn, e) {
  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height) * 1.2;
  const x      = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
  const y      = (e.clientY || e.touches?.[0]?.clientY || rect.top  + rect.height / 2) - rect.top  - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* ─── Scroll behavior ────────────── */
function setupScrollBehavior() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ─── Listeners ──────────────────── */
function setupListeners() {
  /* Cart bar → open cart sheet */
  const cartBar = document.getElementById('cart-bar');
  cartBar.addEventListener('click', openCartSheet);
  cartBar.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openCartSheet(); });

  /* Header cart btn */
  document.getElementById('header-cart-btn').addEventListener('click', openCartSheet);

  /* Item sheet */
  document.getElementById('item-sheet-backdrop').addEventListener('click', () => closeSheet('item-sheet'));
  document.getElementById('item-sheet-minus').addEventListener('click', () => {
    if (sheetQty > 1) { sheetQty--; document.getElementById('item-sheet-qty').textContent = sheetQty; refreshSheetBtn(); }
  });
  document.getElementById('item-sheet-plus').addEventListener('click', () => {
    sheetQty++; document.getElementById('item-sheet-qty').textContent = sheetQty; refreshSheetBtn();
  });
  document.getElementById('item-sheet-add').addEventListener('click', addSheetItemToCart);

  /* Cart sheet */
  document.getElementById('cart-sheet-backdrop').addEventListener('click', () => closeSheet('cart-sheet'));
  document.getElementById('close-cart-sheet').addEventListener('click',   () => closeSheet('cart-sheet'));
  document.getElementById('back-to-menu').addEventListener('click',       () => closeSheet('cart-sheet'));
  document.getElementById('btn-whatsapp').addEventListener('click', sendWhatsApp);

  /* Order type toggle */
  document.querySelectorAll('.order-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      orderType = btn.dataset.type;
      document.querySelectorAll('.order-tab').forEach(b => b.classList.toggle('active', b === btn));
      const isEntrega = orderType === 'entrega';
      document.getElementById('customer-address-wrap').classList.toggle('hidden', !isEntrega);
      if (!isEntrega) { deliveryFee = 0; refreshCartSheet(); }
    });
  });

  /* Bairro select → update fee */
  document.getElementById('customer-neighborhood').addEventListener('change', e => {
    const zoneId = parseInt(e.target.value);
    const zone = deliveryZones.find(z => z.id === zoneId);
    deliveryFee = zone ? zone.fee : 0;
    refreshCartSheet();
  });

  /* Search */
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    searchClear.classList.toggle('hidden', !searchQuery);
    applySearch();
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = ''; searchQuery = '';
    searchClear.classList.add('hidden');
    applySearch(); searchInput.focus();
  });

  /* Ripple on .ripple-btn buttons (delegated) */
  document.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.ripple-btn');
    if (btn) addRipple(btn, e);
  });

  /* Keyboard: Escape closes any open sheet */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSheet('item-sheet');
      closeSheet('cart-sheet');
    }
  });
}

/* ─── Helpers ────────────────────── */
function groupByCategory(items) {
  const map = {};
  items.forEach(item => {
    const cat = item.category || 'Outros';
    if (!map[cat]) map[cat] = [];
    map[cat].push(item);
  });
  return map;
}

function slugify(str) {
  return String(str).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function price(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ─── Start ──────────────────────── */
init();
