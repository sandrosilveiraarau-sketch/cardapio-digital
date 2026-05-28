# Cardápio Digital — Dogão do Bino

## Sobre o projeto
Sistema de cardápio digital mobile-first com painel admin e envio de pedido via WhatsApp.
Não é SaaS — é um sistema para um único estabelecimento.

## Funcionalidades
- Painel admin com senha simples para o dono cadastrar itens
- Cadastro de itens: nome, descrição, preço, categoria e imagem
- Cardápio público premium, 100% mobile-first
- Navegação por seções de categoria com Intersection Observer (tabs atualizam ao rolar)
- Busca em tempo real por nome ou descrição
- Botão "+" inline no card → adiciona diretamente; clique no card → bottom sheet de detalhes
- Qty pill inline no card (− N +) quando item já está no carrinho
- Bottom sheet de item: qty, campo de observações, preço dinâmico no botão
- Cart bar persistente no fundo da tela (aparece ao adicionar o 1º item)
- Bottom sheet de carrinho: nome do cliente, Retirada/Entrega, endereço condicional
- Toast de feedback ao adicionar item
- Pedido enviado ao WhatsApp com mensagem formatada profissionalmente
- Deploy em nuvem via Railway ou Render

## Stack
- Backend: Python com FastAPI
- Banco: SQLite local → PostgreSQL em produção
- Frontend: HTML + CSS customizado + JavaScript puro (sem framework, sem Tailwind)
- Fonte: Plus Jakarta Sans (Google Fonts)
- Imagens: upload local ou Cloudinary
- Deploy: Railway ou Render

## Design System (mobile-first)
- **Tema:** light premium — fundo parchment `#F7F5F0`, cards brancos
- **Accent primário:** burnt orange `#E8622A` (preços, botões, badge)
- **Accent verde:** `#25A244` (status Aberto, chip Entrega & Retirada)
- **Tipografia:** Plus Jakarta Sans 400/500/600/700/800
- **Max-width:** 640px (coluna central centralizada no desktop)
- **Viewport:** projetado para 390px (iPhone 14 Pro)
- **Bottom sheets:** animação spring `cubic-bezier(0.16, 1, 0.3, 1)` saindo de `translateY(100%)`
- **Cart bar:** `position: fixed`, bottom com `safe-area-inset-bottom`, fundo near-black
- **Category nav:** `position: sticky`, glassmorphism (`backdrop-filter: blur`)
- **Ripple effect:** delegado via `pointerdown` em `.ripple-btn`
- **Qty pill:** anima com `popIn` ao aparecer, substitui o botão "+" inline

## Estrutura de pastas
```
cardapio-digital/
├── backend/
│   ├── main.py          # entrypoint FastAPI + rotas estáticas
│   ├── config.py        # settings via pydantic-settings / .env
│   ├── database.py      # engine SQLAlchemy (SQLite dev, PostgreSQL prod)
│   ├── models.py        # tabela `items`
│   ├── schemas.py       # schemas Pydantic (ItemOut, LoginRequest, etc.)
│   ├── routers/
│   │   ├── auth.py      # POST /api/auth/login → JWT
│   │   └── items.py     # CRUD /api/items/ (público: GET, admin: POST/PUT/DELETE)
│   ├── uploads/         # imagens salvas localmente (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── index.html       # cardápio público mobile-first
│   ├── admin.html       # painel do dono
│   └── static/
│       ├── app.js       # toda a lógica do cardápio (ver fluxo abaixo)
│       ├── admin.js     # painel admin: login, CRUD de itens
│       └── style.css    # design system completo (sem Tailwind)
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

## Fluxo do app.js
1. `init()` → `setupListeners()` + `setupScrollBehavior()` + `loadItems()`
2. `loadItems()` → GET `/api/items/` → `buildCatNav()` + `renderGroupedItems()`
3. `renderGroupedItems()` → agrupa por categoria → renderiza `<section>` por categoria → `setupCategoryObserver()`
4. `setupCategoryObserver()` → IntersectionObserver nas sections → atualiza tab ativa ao rolar
5. `quickAdd(id)` → adiciona 1 unidade (sem notas, key `id_plain`) → `updateCardCta()` + `refreshCartBar()` + toast
6. `openItemSheet(id)` → preenche bottom sheet com dados do item → `openSheet('item-sheet')`
7. `addSheetItemToCart()` → cria `_key` único por notas → adiciona ao `cart[]` → fecha sheet → toast
8. `cartAdjust(key, delta)` → ajusta qty no carrinho → `updateCardCta()` + `refreshCartBar()` + `refreshCartSheet()`
9. `sendWhatsApp()` → GET `/api/items/config` para número → `buildMessage()` → `wa.me`

## Estado do cart[]
Cada entrada: `{ _key, id, name, price, qty, notes, image_url, category }`
- `_key` para item sem notas: `"${id}_plain"`
- `_key` para item com notas: `"${id}_${btoa(notes).slice(0,12)}"`
- Mesmo produto com notas diferentes → entradas separadas no cart

## Mensagem WhatsApp (formato)
```
🌭 *PEDIDO — DOGÃO DO BINO*

👤 *Nome:* João
🛵 *Tipo:* Entrega
📍 *Endereço:* Rua das Flores, 123

*🍽️ Itens:*
• 2x Dogão Tradicional — R$ 37,80
  📝 Sem cebola
• 1x Coca-Cola Lata — R$ 6,00

*💰 Total: R$ 43,80*

_Pedido via cardápio digital_ 🌭
```

## Autenticação admin
- Login via `POST /api/auth/login` com senha simples (env `ADMIN_PASSWORD`)
- Retorna JWT (HS256, 12h) armazenado em `localStorage`
- Rotas protegidas usam `HTTPBearer` + verificação do JWT

## Variáveis de ambiente (.env)
| Variável | Descrição | Padrão dev |
|---|---|---|
| `ADMIN_PASSWORD` | Senha do painel admin | `admin123` |
| `SECRET_KEY` | Chave JWT | `dev-secret-key-...` |
| `DATABASE_URL` | URL do banco (vazio = SQLite) | SQLite local |
| `CLOUDINARY_*` | Credenciais Cloudinary (opcional) | — |
| `WHATSAPP_NUMBER` | Número com DDI (ex: 5511999999999) | — |

## Como rodar localmente
```bash
cd cardapio-digital
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```
Acesse: http://localhost:8000 (cardápio) | http://localhost:8000/admin (painel)

## Personalização para outro estabelecimento
1. `index.html`: nome, horário, endereço no store-banner e meta chips
2. `style.css`: `--accent` (cor primária) e `--green` (cor de status)
3. `.env`: `WHATSAPP_NUMBER` com o número real
4. Admin `/admin`: cadastrar categorias e produtos reais com imagens

## Como trabalhamos
- Implementar de forma incremental, um passo de cada vez
- Código limpo, sem comentários óbvios
- Manter este CLAUDE.md e o README.md atualizados a cada mudança relevante
