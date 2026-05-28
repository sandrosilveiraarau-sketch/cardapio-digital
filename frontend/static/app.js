const API = '/api';
const cart = [];

async function loadItems() {
  const res = await fetch(`${API}/items/`);
  const items = await res.json();
  renderItems(items);
}

function renderItems(items) {
  const grid = document.getElementById('items-grid');
  grid.innerHTML = items.map(item => `
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-amber-400/50 transition group">
      ${item.image_url
        ? `<img src="${item.image_url}" alt="${item.name}" class="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />`
        : `<div class="w-full h-48 bg-zinc-800 flex items-center justify-center text-zinc-600 text-4xl">🍔</div>`
      }
      <div class="p-4 space-y-2">
        ${item.category ? `<span class="text-xs text-amber-400 uppercase tracking-widest">${item.category}</span>` : ''}
        <h3 class="font-bold text-lg leading-tight">${item.name}</h3>
        ${item.description ? `<p class="text-zinc-400 text-sm">${item.description}</p>` : ''}
        <div class="flex items-center justify-between pt-2">
          <span class="text-amber-400 font-bold text-xl">${formatPrice(item.price)}</span>
          <button onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})"
            class="bg-amber-400 text-zinc-950 font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-amber-300 transition">
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(item) {
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartUI();
}

function removeFromCart(id) {
  const idx = cart.findIndex(i => i.id === id);
  if (idx !== -1) {
    if (cart[idx].qty > 1) cart[idx].qty -= 1;
    else cart.splice(idx, 1);
  }
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  document.getElementById('cart-total').textContent = formatPrice(total);
  const badge = document.getElementById('cart-count');
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);

  document.getElementById('cart-list').innerHTML = cart.map(item => `
    <li class="flex items-center justify-between gap-3">
      <div class="flex-1">
        <p class="font-semibold text-sm">${item.name}</p>
        <p class="text-zinc-400 text-xs">${formatPrice(item.price)} cada</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="removeFromCart(${item.id})" class="w-7 h-7 bg-zinc-700 rounded-full hover:bg-zinc-600 text-sm font-bold">-</button>
        <span class="w-5 text-center text-sm">${item.qty}</span>
        <button onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="w-7 h-7 bg-zinc-700 rounded-full hover:bg-zinc-600 text-sm font-bold">+</button>
      </div>
    </li>
  `).join('');
}

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildWhatsAppMessage() {
  const lines = cart.map(i => `• ${i.qty}x ${i.name} — ${formatPrice(i.price * i.qty)}`);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  lines.push(`\n*Total: ${formatPrice(total)}*`);
  return encodeURIComponent(lines.join('\n'));
}

async function getWhatsAppNumber() {
  try {
    const res = await fetch(`${API}/items/config`);
    if (res.ok) {
      const data = await res.json();
      return data.whatsapp_number || '';
    }
  } catch (_) {}
  return '';
}

document.getElementById('btn-cart').addEventListener('click', () => {
  document.getElementById('cart-drawer').classList.remove('hidden');
});
document.getElementById('close-cart').addEventListener('click', () => {
  document.getElementById('cart-drawer').classList.add('hidden');
});
document.getElementById('cart-overlay').addEventListener('click', () => {
  document.getElementById('cart-drawer').classList.add('hidden');
});

document.getElementById('btn-whatsapp').addEventListener('click', async () => {
  if (cart.length === 0) return;
  const number = await getWhatsAppNumber();
  const msg = buildWhatsAppMessage();
  window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
});

loadItems();
