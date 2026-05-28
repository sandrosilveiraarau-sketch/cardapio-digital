const API = '/api';
let token = localStorage.getItem('admin_token');

if (token) showDashboard();

document.getElementById('btn-login').addEventListener('click', login);
document.getElementById('password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});

async function login() {
  const password = document.getElementById('password-input').value;
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.ok) {
    const data = await res.json();
    token = data.access_token;
    localStorage.setItem('admin_token', token);
    showDashboard();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadItems();
}

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  token = null;
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
});

async function loadItems() {
  const res = await fetch(`${API}/items/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const items = await res.json();
  renderAdminItems(items);
}

function renderAdminItems(items) {
  document.getElementById('admin-items').innerHTML = items.map(item => `
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
      ${item.image_url
        ? `<img src="${item.image_url}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0" />`
        : `<div class="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🍔</div>`
      }
      <div class="flex-1 min-w-0">
        <p class="font-bold truncate">${item.name}</p>
        <p class="text-amber-400 text-sm">${formatPrice(item.price)}</p>
        ${item.category ? `<p class="text-zinc-500 text-xs">${item.category}</p>` : ''}
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-1 rounded-full ${item.available ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-500'}">
          ${item.available ? 'Disponível' : 'Oculto'}
        </span>
        <button onclick="editItem(${JSON.stringify(item).replace(/"/g, '&quot;')})"
          class="text-zinc-400 hover:text-amber-400 transition text-sm px-2 py-1">Editar</button>
        <button onclick="deleteItem(${item.id})"
          class="text-zinc-400 hover:text-red-400 transition text-sm px-2 py-1">Excluir</button>
      </div>
    </div>
  `).join('');
}

document.getElementById('item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;
  const form = new FormData();
  form.append('name', document.getElementById('f-name').value);
  form.append('price', document.getElementById('f-price').value);
  form.append('description', document.getElementById('f-description').value);
  form.append('category', document.getElementById('f-category').value);
  form.append('available', document.getElementById('f-available').checked);
  const imageFile = document.getElementById('f-image').files[0];
  if (imageFile) form.append('image', imageFile);

  const url = id ? `${API}/items/${id}` : `${API}/items/`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (res.ok) {
    resetForm();
    loadItems();
  }
});

function editItem(item) {
  document.getElementById('edit-id').value = item.id;
  document.getElementById('f-name').value = item.name;
  document.getElementById('f-price').value = item.price;
  document.getElementById('f-description').value = item.description || '';
  document.getElementById('f-category').value = item.category || '';
  document.getElementById('f-available').checked = item.available;
  document.getElementById('form-title').textContent = 'Editar item';
  document.getElementById('btn-cancel').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('btn-cancel').addEventListener('click', resetForm);

function resetForm() {
  document.getElementById('item-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('form-title').textContent = 'Novo item';
  document.getElementById('btn-cancel').classList.add('hidden');
}

async function deleteItem(id) {
  if (!confirm('Excluir este item?')) return;
  await fetch(`${API}/items/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  loadItems();
}

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
