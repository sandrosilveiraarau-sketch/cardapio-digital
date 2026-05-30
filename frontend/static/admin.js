const API = '/api';
let token = localStorage.getItem('admin_token');
let allProducts = [];
let allCategories = [];
let toastTimer = null;

/* ─── Boot ─────────────────────────────── */
if (token) initDashboard();

document.getElementById('btn-login').addEventListener('click', login);
document.getElementById('password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});

async function login() {
  const password = document.getElementById('password-input').value;
  const btn = document.getElementById('btn-login');
  btn.disabled = true; btn.textContent = 'Entrando…';
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  btn.disabled = false; btn.textContent = 'Entrar';
  if (res.ok) {
    const data = await res.json();
    token = data.access_token;
    localStorage.setItem('admin_token', token);
    document.getElementById('login-screen').classList.add('hidden');
    initDashboard();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function logout() {
  localStorage.removeItem('admin_token');
  token = null;
  location.reload();
}

async function initDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  await Promise.all([loadCategories(), loadProducts(), loadDeliveryZones(), loadNotification()]);
}

/* ─── Navigation ────────────────────────── */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    closeSidebar();
  });
});

document.getElementById('btn-logout').addEventListener('click', logout);

/* Mobile sidebar */
const sidebar = document.getElementById('sidebar');
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  if (sidebar.classList.contains('open')) {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }
});

function closeSidebar() {
  sidebar.classList.remove('open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.remove();
}

/* ═══════════════════════════════════════════
   PRODUCTS
═══════════════════════════════════════════ */
async function loadProducts() {
  const res = await fetch(`${API}/items/all`, { headers: auth() });
  if (res.status === 401) return logout();
  allProducts = await res.json();
  renderProducts(allProducts);
  updateCategoryFilter();
}

function renderProducts(products) {
  const grid = document.getElementById('products-list');
  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--adm-muted);">Nenhum produto encontrado</div>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      ${p.image_url
        ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" class="product-thumb" />`
        : `<div class="product-thumb-placeholder">🌭</div>`}
      <div class="product-info">
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-price">${fmt(p.price)}</div>
        ${p.category ? `<div class="product-cat">${esc(p.category)}</div>` : ''}
      </div>
      <div class="product-actions">
        <span class="status-badge ${p.available ? 'status-badge--on' : 'status-badge--off'}">
          ${p.available ? 'Disponível' : 'Oculto'}
        </span>
        <div class="product-btns">
          <button class="icon-btn" title="Editar" onclick="openEditProduct(${p.id})">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn icon-btn--danger" title="Excluir" onclick="confirmDelete('product', ${p.id}, '${esc(p.name)}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* Search + filter */
document.getElementById('products-search').addEventListener('input', applyProductsFilter);
document.getElementById('products-filter-cat').addEventListener('change', applyProductsFilter);

function applyProductsFilter() {
  const q   = document.getElementById('products-search').value.toLowerCase();
  const cat = document.getElementById('products-filter-cat').value;
  const filtered = allProducts.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) &&
    (!cat || p.category === cat)
  );
  renderProducts(filtered);
}

function updateCategoryFilter() {
  const sel = document.getElementById('products-filter-cat');
  const current = sel.value;
  const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  sel.innerHTML = `<option value="">Todas as categorias</option>` +
    cats.map(c => `<option value="${esc(c)}" ${c === current ? 'selected' : ''}>${esc(c)}</option>`).join('');
}

/* ─── Product Modal ─────────────────────── */
document.getElementById('btn-new-product').addEventListener('click', openNewProduct);
document.getElementById('modal-close').addEventListener('click', closeProductModal);
document.getElementById('btn-cancel').addEventListener('click', closeProductModal);

document.getElementById('product-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('product-modal')) closeProductModal();
});

function populateCategorySelect() {
  const sel = document.getElementById('f-category');
  const current = sel.value;
  sel.innerHTML = `<option value="">Sem categoria</option>` +
    allCategories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
  sel.value = current;
}

function openNewProduct() {
  resetProductForm();
  document.getElementById('modal-title').textContent = 'Novo produto';
  document.getElementById('btn-save-label').textContent = 'Salvar produto';
  document.getElementById('product-modal').classList.remove('hidden');
}

function openEditProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  resetProductForm();
  document.getElementById('edit-id').value       = p.id;
  document.getElementById('f-name').value        = p.name;
  document.getElementById('f-price').value       = p.price;
  document.getElementById('f-description').value = p.description || '';
  document.getElementById('f-available').checked = p.available;
  populateCategorySelect();
  document.getElementById('f-category').value = p.category || '';
  if (p.image_url) {
    document.getElementById('image-preview').src = p.image_url;
    document.getElementById('image-preview-wrap').classList.remove('hidden');
    document.getElementById('image-placeholder').classList.add('hidden');
  }
  document.getElementById('modal-title').textContent = 'Editar produto';
  document.getElementById('btn-save-label').textContent = 'Salvar alterações';
  document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
  resetProductForm();
}

function resetProductForm() {
  document.getElementById('product-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('image-preview-wrap').classList.add('hidden');
  document.getElementById('image-placeholder').classList.remove('hidden');
  populateCategorySelect();
}

/* Image preview */
document.getElementById('f-image').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('image-preview').src = ev.target.result;
    document.getElementById('image-preview-wrap').classList.remove('hidden');
    document.getElementById('image-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('image-remove').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('f-image').value = '';
  document.getElementById('image-preview-wrap').classList.add('hidden');
  document.getElementById('image-placeholder').classList.remove('hidden');
});

/* Submit product form */
document.getElementById('product-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id  = document.getElementById('edit-id').value;
  const btn = document.getElementById('btn-save');
  btn.disabled = true;

  const form = new FormData();
  form.append('name',        document.getElementById('f-name').value);
  form.append('price',       document.getElementById('f-price').value);
  form.append('description', document.getElementById('f-description').value);
  form.append('category',    document.getElementById('f-category').value);
  form.append('available',   document.getElementById('f-available').checked);
  const imageFile = document.getElementById('f-image').files[0];
  if (imageFile) form.append('image', imageFile);

  const res = await fetch(id ? `${API}/items/${id}` : `${API}/items/`, {
    method: id ? 'PUT' : 'POST',
    headers: auth(),
    body: form,
  });

  btn.disabled = false;
  if (res.ok) {
    closeProductModal();
    await loadProducts();
    showToast(id ? 'Produto atualizado!' : 'Produto criado!');
  }
});

/* ═══════════════════════════════════════════
   CATEGORIES
═══════════════════════════════════════════ */
async function loadCategories() {
  const res = await fetch(`${API}/categories/`);
  allCategories = await res.json();
  renderCategories();
  populateCategorySelect();
}

function renderCategories() {
  const list = document.getElementById('categories-list');
  if (!allCategories.length) {
    list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--adm-muted);font-size:.875rem;">Nenhuma categoria cadastrada</div>`;
    return;
  }
  list.innerHTML = allCategories.map(c => `
    <div class="simple-list-item">
      <div class="simple-list-label">${esc(c.name)}</div>
      <button class="icon-btn icon-btn--danger" title="Excluir" onclick="confirmDelete('category', ${c.id}, '${esc(c.name)}')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  `).join('');
}

document.getElementById('btn-add-cat').addEventListener('click', async () => {
  const name = document.getElementById('cat-name-input').value.trim();
  if (!name) return;
  const res = await fetch(`${API}/categories/`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (res.ok) {
    document.getElementById('cat-name-input').value = '';
    await loadCategories();
    showToast('Categoria criada!');
  } else if (res.status === 400) {
    showToast('Categoria já existe.');
  }
});

document.getElementById('cat-name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-add-cat').click();
});

/* ═══════════════════════════════════════════
   DELIVERY ZONES
═══════════════════════════════════════════ */
let allZones = [];

async function loadDeliveryZones() {
  const res = await fetch(`${API}/delivery/zones`);
  allZones = await res.json();
  renderZones();
}

function renderZones() {
  const list = document.getElementById('delivery-list');
  if (!allZones.length) {
    list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--adm-muted);font-size:.875rem;">Nenhum bairro cadastrado</div>`;
    return;
  }
  list.innerHTML = allZones.map(z => `
    <div class="simple-list-item">
      <div class="simple-list-label">${esc(z.neighborhood)}</div>
      <span class="simple-list-badge">${fmtFee(z.fee)}</span>
      <button class="icon-btn icon-btn--danger" title="Excluir" onclick="confirmDelete('zone', ${z.id}, '${esc(z.neighborhood)}')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  `).join('');
}

document.getElementById('btn-add-zone').addEventListener('click', async () => {
  const neighborhood = document.getElementById('zone-neighborhood').value.trim();
  const fee = parseFloat(document.getElementById('zone-fee').value);
  if (!neighborhood || isNaN(fee)) return;
  const res = await fetch(`${API}/delivery/zones`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ neighborhood, fee }),
  });
  if (res.ok) {
    document.getElementById('zone-neighborhood').value = '';
    document.getElementById('zone-fee').value = '';
    await loadDeliveryZones();
    showToast('Bairro adicionado!');
  }
});

document.getElementById('zone-fee').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-add-zone').click();
});

/* ═══════════════════════════════════════════
   CONFIRM DELETE
═══════════════════════════════════════════ */
let pendingDelete = null;

function confirmDelete(type, id, name) {
  pendingDelete = { type, id };
  document.getElementById('confirm-title').textContent = 'Confirmar exclusão';
  document.getElementById('confirm-text').textContent = `Excluir "${name}"? Esta ação não pode ser desfeita.`;
  document.getElementById('confirm-modal').classList.remove('hidden');
}

document.getElementById('confirm-cancel').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
  pendingDelete = null;
});

document.getElementById('confirm-ok').addEventListener('click', async () => {
  if (!pendingDelete) return;
  const { type, id } = pendingDelete;
  document.getElementById('confirm-modal').classList.add('hidden');
  pendingDelete = null;

  if (type === 'product') {
    await fetch(`${API}/items/${id}`, { method: 'DELETE', headers: auth() });
    await loadProducts();
    showToast('Produto excluído.');
  } else if (type === 'category') {
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: auth() });
    await loadCategories();
    showToast('Categoria excluída.');
  } else if (type === 'zone') {
    await fetch(`${API}/delivery/zones/${id}`, { method: 'DELETE', headers: auth() });
    await loadDeliveryZones();
    showToast('Bairro removido.');
  }
});

/* ═══════════════════════════════════════════
   NOTIFICATION
═══════════════════════════════════════════ */
async function loadNotification() {
  const res = await fetch(`${API}/notification/`);
  if (!res.ok) return;
  const n = await res.json();
  document.getElementById('notif-message').value = n.message || '';
  document.getElementById('notif-active').checked = n.active;
  updateNotifPreview();
}

function updateNotifPreview() {
  const msg = document.getElementById('notif-message').value.trim();
  document.getElementById('notif-preview').textContent = msg || 'Sua mensagem aparece aqui.';
}

document.getElementById('notif-message').addEventListener('input', updateNotifPreview);

document.getElementById('btn-save-notif').addEventListener('click', async () => {
  const message = document.getElementById('notif-message').value.trim();
  const active  = document.getElementById('notif-active').checked;
  const btn = document.getElementById('btn-save-notif');
  btn.disabled = true;
  const res = await fetch(`${API}/notification/`, {
    method: 'PUT',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, active }),
  });
  btn.disabled = false;
  if (res.ok) showToast(active ? 'Aviso ativado!' : 'Aviso salvo (inativo).');
});

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function auth() {
  return { Authorization: `Bearer ${token}` };
}

function fmt(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtFee(v) {
  return v === 0 ? 'Grátis' : fmt(v);
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function showToast(msg) {
  const el = document.getElementById('adm-toast');
  document.getElementById('adm-toast-msg').textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2500);
}
