const API = '/api';

/* ─── State ─────────────────────────────── */
let allItems       = [];
let activeCategory = 'all';
let searchQuery    = '';
let orderType      = 'retirada';
let currentItem    = null;
let modalQty       = 1;

// cart items: { id, name, price, image_url, category, qty, notes, _key }
const cart = [];

/* ─── Init ──────────────────────────────── */
async function init() {
  setupListeners();
  setupScrollBehavior();
  await loadItems();
}

/* ─── Load & render items ───────────────── */
async function loadItems() {
  try {
    const res = await fetch(`${API}/items/`);
    allItems = await res.json();
    buildCategoryTabs(allItems);
    renderItems(allItems);
  } catch {
    document.getElementById('skeleton-grid').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
  }
}

function buildCategoryTabs(items) {
  const cats = [...new Set(items.map(i => i.category).filter(Boolean))];
  const bar  = document.getElementById('cat-bar');
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className    = 'cat-tab';
    btn.dataset.cat  = cat;
    btn.textContent  = cat;
    btn.addEventListener('click', () => setCategory(cat));
    bar.appendChild(btn);
  });
}

function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === cat)
  );
  applyFilters();
}

function applyFilters() {
  let items = allItems;

  if (activeCategory !== 'all') {
    items = items.filter(i => i.category === activeCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  }
  renderItems(items);
}

function renderItems(items) {
  const skeleton = document.getElementById('skeleton-grid');
  const grid     = document.getElementById('items-grid');
  const empty    = document.getElementById('empty-state');

  skeleton.classList.add('hidden');

  if (!items.length) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.classList.remove('hidden');

  grid.innerHTML = items.map((item, i) => {
    const delay = `s${(i % 9) + 1}`;
    const img   = item.image_url
      ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" loading="lazy" />`
      : `<div class="item-placeholder">🌭</div>`;
    const badge = item.category
      ? `<span class="item-cat-badge">${esc(item.category)}</span>`
      : '';

    return `
      <div class="item-card ${delay}" onclick="openModal(${item.id})">
        <div class="item-img-wrap">
          ${img}
          <div class="item-img-overlay"></div>
          ${badge}
          <div class="item-hover-cta">+ Adicionar</div>
        </div>
        <div class="item-body">
          <h3 class="item-name">${esc(item.name)}</h3>
          ${item.description ? `<p class="item-desc">${esc(item.description)}</p>` : ''}
          <div class="item-footer">
            <span class="item-price">${price(item.price)}</span>
            <button class="btn-add" onclick="event.stopPropagation(); openModal(${item.id})">+ Pedir</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ─── Modal ─────────────────────────────── */
function openModal(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  currentItem = item;
  modalQty    = 1;

  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-desc').textContent  = item.description || '';
  document.getElementById('modal-qty').textContent   = 1;
  document.getElementById('modal-notes').value       = '';

  const cat = document.getElementById('modal-cat');
  if (item.category) {
    cat.textContent    = item.category;
    cat.style.display  = '';
  } else {
    cat.style.display  = 'none';
  }

  document.getElementById('modal-img-wrap').innerHTML = item.image_url
    ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" />`
    : `<div class="modal-placeholder">🌭</div>`;

  refreshModalBtn();

  document.getElementById('item-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('item-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function refreshModalBtn() {
  const total = currentItem ? currentItem.price * modalQty : 0;
  document.getElementById('modal-price').textContent = price(currentItem?.price || 0);
  document.getElementById('modal-add-btn').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    Adicionar${modalQty > 1 ? ` ${modalQty}x` : ''} — ${price(total)}
  `;
}

function addModalItemToCart() {
  if (!currentItem) return;
  const notes = document.getElementById('modal-notes').value.trim();
  cartAdd(currentItem, modalQty, notes);
  closeModal();
  setTimeout(openCart, 80);
}

/* ─── Cart ──────────────────────────────── */
function cartAdd(item, qty = 1, notes = '') {
  const key      = notes ? `${item.id}__${encodeURIComponent(notes)}` : String(item.id);
  const existing = cart.find(i => i._key === key);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty, notes, _key: key });
  }

  refreshCartUI();
  showToast(`${item.name} adicionado!`);
  bumpFloating();
}

function cartRemove(key) {
  const idx = cart.findIndex(i => i._key === key);
  if (idx === -1) return;
  if (cart[idx].qty > 1) cart[idx].qty--;
  else cart.splice(idx, 1);
  refreshCartUI();
}

function cartIncrease(key) {
  const item = cart.find(i => i._key === key);
  if (item) { item.qty++; refreshCartUI(); }
}

function refreshCartUI() {
  const total  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count  = cart.reduce((s, i) => s + i.qty, 0);
  const isEmpty = cart.length === 0;

  /* header badge */
  const badge = document.getElementById('header-cart-count');
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);

  /* floating button */
  const floating = document.getElementById('floating-cart');
  floating.classList.toggle('hidden', count === 0);
  document.getElementById('floating-label').textContent = `Ver pedido (${count})`;
  document.getElementById('floating-total').textContent = price(total);

  /* cart subtitle */
  document.getElementById('cart-item-count').textContent =
    `${count} ${count === 1 ? 'item' : 'itens'}`;

  /* show/hide sections */
  document.getElementById('cart-empty').classList.toggle('hidden', !isEmpty);
  document.getElementById('cart-list').classList.toggle('hidden', isEmpty);
  document.getElementById('cart-footer').classList.toggle('hidden', isEmpty);
  document.getElementById('cart-customer-section').classList.toggle('hidden', isEmpty);

  /* totals */
  document.getElementById('cart-subtotal-val').textContent = price(total);
  document.getElementById('cart-total').textContent        = price(total);

  /* items */
  document.getElementById('cart-list').innerHTML = cart.map(item => `
    <li class="cart-item">
      ${item.image_url
        ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" class="cart-item-img" />`
        : `<div class="cart-item-placeholder">🌭</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        ${item.notes ? `<div class="cart-item-notes">📝 ${esc(item.notes)}</div>` : ''}
        <div class="cart-item-price">${price(item.price)} cada</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="cartRemove('${esc(item._key)}')">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="cartIncrease('${esc(item._key)}')">+</button>
      </div>
    </li>
  `).join('');
}

/* ─── Cart open / close ─────────────────── */
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  if (!document.getElementById('item-modal').classList.contains('hidden')) return;
  document.body.style.overflow = '';
}

/* ─── WhatsApp message ──────────────────── */
function buildMessage() {
  const name    = (document.getElementById('customer-name').value || '').trim();
  const address = (document.getElementById('customer-address').value || '').trim();

  let msg = `🌭 *PEDIDO — DOGÃO DO BINO*\n\n`;

  if (name)    msg += `👤 *Nome:* ${name}\n`;

  if (orderType === 'entrega') {
    msg += `🛵 *Tipo:* Entrega\n`;
    if (address) msg += `📍 *Endereço:* ${address}\n`;
  } else {
    msg += `🏪 *Tipo:* Retirada no local\n`;
  }

  msg += `\n*🍽️ Itens:*\n`;

  cart.forEach(item => {
    msg += `• ${item.qty}x ${item.name} — ${price(item.price * item.qty)}`;
    if (item.notes) msg += `\n  📝 ${item.notes}`;
    msg += `\n`;
  });

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
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
  } catch { /* use empty number */ }
  window.open(`https://wa.me/${number}?text=${buildMessage()}`, '_blank');
}

/* ─── Toast ─────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2200);
}

/* ─── Floating cart bump animation ─────── */
function bumpFloating() {
  const btn = document.getElementById('floating-cart');
  btn.classList.remove('cart-bump');
  void btn.offsetWidth; // reflow to restart animation
  btn.classList.add('cart-bump');
}

/* ─── Scroll behavior ───────────────────── */
function setupScrollBehavior() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ─── Event listeners ───────────────────── */
function setupListeners() {
  /* Cart open/close */
  document.getElementById('header-cart-btn').addEventListener('click', openCart);
  document.getElementById('floating-cart').addEventListener('click', openCart);
  document.getElementById('close-cart').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  /* Go to menu from empty cart */
  document.getElementById('go-to-menu').addEventListener('click', closeCart);

  /* Modal close */
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('item-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  /* Modal qty */
  document.getElementById('modal-qty-minus').addEventListener('click', () => {
    if (modalQty > 1) { modalQty--; document.getElementById('modal-qty').textContent = modalQty; refreshModalBtn(); }
  });
  document.getElementById('modal-qty-plus').addEventListener('click', () => {
    modalQty++; document.getElementById('modal-qty').textContent = modalQty; refreshModalBtn();
  });

  /* Modal add */
  document.getElementById('modal-add-btn').addEventListener('click', addModalItemToCart);

  /* Category "Todos" tab */
  document.querySelector('.cat-tab[data-cat="all"]').addEventListener('click', () => setCategory('all'));

  /* Search */
  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    applyFilters();
  });

  /* Order type toggle */
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      orderType = btn.dataset.type;
      document.querySelectorAll('.order-type-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
      document.getElementById('customer-address').classList.toggle('hidden', orderType !== 'entrega');
    });
  });

  /* WhatsApp */
  document.getElementById('btn-whatsapp').addEventListener('click', sendWhatsApp);

  /* Keyboard shortcuts */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
  });
}

/* ─── Helpers ───────────────────────────── */
function price(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── Boot ──────────────────────────────── */
init();
