# Cardápio Digital — Dogão do Bino

## Sobre o projeto
Sistema de cardápio digital mobile-first com painel admin e envio de pedido via WhatsApp.
Não é SaaS — é um sistema para um único estabelecimento.

## Funcionalidades

### Cardápio público (`/`)
- Header fixo com logo, status "Aberto agora" e ícone de carrinho com badge
- Store banner com chips de horário, dias e tipo de entrega
- Category nav sticky com glassmorphism — tabs geradas automaticamente pelas categorias cadastradas
- Intersection Observer — tab ativa atualiza conforme o cliente rola
- Busca em tempo real por nome ou descrição
- Botão "+" inline no card → adiciona diretamente; clique no card → bottom sheet de detalhes
- Qty pill inline no card (− N +) quando item já está no carrinho
- Bottom sheet de item: qty, campo de observações, preço dinâmico no botão
- Cart bar persistente no fundo da tela (aparece ao adicionar o 1º item)
- Bottom sheet de carrinho: nome do cliente, Retirada/Entrega
- Ao selecionar Entrega: dropdown de bairros com taxa exibida + campo de endereço
- Taxa de entrega calculada automaticamente por bairro e somada ao total
- Toast de feedback ao adicionar item
- Pedido enviado ao WhatsApp direto ao contato da lanchonete (número via env WHATSAPP_NUMBER)
- Mensagem inclui nome, tipo, bairro, endereço, taxa de entrega e itens

### Painel admin (`/admin`)
- Login com senha simples → JWT armazenado em localStorage
- Sidebar com 3 abas: **Produtos**, **Categorias**, **Entregas**
- **Aba Produtos:** grid de cards com busca, filtro por categoria, modal de criação/edição com preview de imagem, toggle de disponibilidade, select de categoria
- **Aba Categorias:** criar e excluir divisões do cardápio (Dogs, Lanches, Combos, Especiais, Promoções…)
- **Aba Entregas:** cadastrar bairros com taxa individual (ex: Vila Lobos → R$ 6,00); taxa "Grátis" quando zerada
- Design responsivo: sidebar no desktop, topbar + drawer no mobile

## Stack
- Backend: Python com FastAPI
- Banco: SQLite local → PostgreSQL em produção
- Frontend: HTML + CSS customizado + JavaScript puro (sem framework, sem Tailwind)
- Fonte: Plus Jakarta Sans (Google Fonts)
- Imagens: upload local ou Cloudinary (auto-detectado por variável de ambiente)
- Deploy: Railway (Procfile + runtime.txt configurados)

## Design System — cardápio público (mobile-first)
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

## Design System — admin
- **Tema:** dark sidebar (`#18181B`) + light content (`#F4F4F5`)
- **Accent:** `#E8622A` (botões primários, destaques)
- **Fonte:** Plus Jakarta Sans
- **CSS próprio:** `admin.css` (separado do `style.css` do cardápio)
- **Layout:** sidebar fixa 240px no desktop, topbar + drawer deslizante no mobile
- **Animações:** `fadeIn` nos cards, `modalIn` no modal de produto

## Estrutura de pastas
```
cardapio-digital/
├── backend/
│   ├── main.py              # entrypoint FastAPI + rotas estáticas
│   ├── config.py            # settings via pydantic-settings / .env
│   ├── database.py          # engine SQLAlchemy (SQLite dev, PostgreSQL prod)
│   ├── models.py            # tabelas: Item, Category, DeliveryZone
│   ├── schemas.py           # schemas Pydantic (ItemOut, CategoryOut, DeliveryZoneOut, …)
│   ├── routers/
│   │   ├── auth.py          # POST /api/auth/login → JWT
│   │   ├── items.py         # CRUD /api/items/ + GET /api/items/config
│   │   ├── categories.py    # CRUD /api/categories/
│   │   └── delivery.py      # CRUD /api/delivery/zones
│   ├── uploads/             # imagens locais (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── index.html           # cardápio público mobile-first
│   ├── admin.html           # painel admin (sidebar layout)
│   └── static/
│       ├── app.js           # lógica do cardápio público
│       ├── admin.js         # lógica do painel admin
│       ├── style.css        # design system do cardápio público
│       └── admin.css        # design system do painel admin
├── .env.example
├── .gitignore
├── Procfile                 # web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
├── runtime.txt              # python-3.12.7
├── requirements.txt         # cópia na raiz para Railway detectar Python
├── CLAUDE.md
└── README.md
```

## Banco de dados — modelos
```python
Item:         id, name, description, price, image_url, category, available
Category:     id, name, order
DeliveryZone: id, neighborhood, fee
```
As tabelas são criadas automaticamente via `Base.metadata.create_all()` no startup.

## API — endpoints relevantes
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/items/` | — | Lista itens disponíveis (público) |
| GET | `/api/items/all` | JWT | Lista todos os itens (admin) |
| GET | `/api/items/config` | — | Retorna `whatsapp_number` |
| POST | `/api/items/` | JWT | Cria item (multipart form + imagem) |
| PUT | `/api/items/{id}` | JWT | Edita item |
| DELETE | `/api/items/{id}` | JWT | Remove item |
| GET | `/api/categories/` | — | Lista categorias |
| POST | `/api/categories/` | JWT | Cria categoria |
| DELETE | `/api/categories/{id}` | JWT | Remove categoria |
| GET | `/api/delivery/zones` | — | Lista bairros com taxa |
| POST | `/api/delivery/zones` | JWT | Cria bairro |
| PUT | `/api/delivery/zones/{id}` | JWT | Edita bairro |
| DELETE | `/api/delivery/zones/{id}` | JWT | Remove bairro |
| POST | `/api/auth/login` | — | Retorna JWT |

## Fluxo do app.js (cardápio público)
1. `init()` → `setupListeners()` + `setupScrollBehavior()` + `loadItems()` + `loadDeliveryZones()`
2. `loadDeliveryZones()` → GET `/api/delivery/zones` → popula select `#customer-neighborhood`
3. `loadItems()` → GET `/api/items/` → `buildCatNav()` + `renderGroupedItems()`
4. `renderGroupedItems()` → agrupa por categoria → renderiza `<section>` por categoria → `setupCategoryObserver()`
5. `setupCategoryObserver()` → IntersectionObserver nas sections → atualiza tab ativa ao rolar
6. Selecionar "Entrega" → mostra `#customer-address-wrap` (bairro + endereço)
7. Selecionar bairro → atualiza `deliveryFee` → `refreshCartSheet()` recalcula total
8. `quickAdd(id)` → adiciona 1 unidade → `updateCardCta()` + `refreshCartBar()` + toast
9. `openItemSheet(id)` → preenche bottom sheet → `openSheet('item-sheet')`
10. `sendWhatsApp()` → GET `/api/items/config` para número → `buildMessage()` → `wa.me/{number}?text=...`

## Estado do cart[]
Cada entrada: `{ _key, id, name, price, qty, notes, image_url, category }`
- `_key` sem notas: `"${id}_plain"`
- `_key` com notas: `"${id}_${btoa(notes).slice(0,12)}"`

## Mensagem WhatsApp (formato atual)
```
🌭 *PEDIDO — DOGÃO DO BINO*

👤 *Nome:* João
🛵 *Tipo:* Entrega
📍 *Bairro:* Vila Lobos — R$ 6,00
🏠 *Endereço:* Rua das Flores, 123
🚚 *Taxa de entrega:* R$ 6,00

*🍽️ Itens:*
• 2x Dogão Tradicional — R$ 37,80
  📝 Sem cebola
• 1x Coca-Cola Lata — R$ 6,00

*💰 Total: R$ 49,80*

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
| `CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary (opcional) | — |
| `CLOUDINARY_API_KEY` | API Key Cloudinary (opcional) | — |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary (opcional) | — |
| `WHATSAPP_NUMBER` | Número com DDI (ex: 5511999999999) | — |
| `MISE_PYTHON_GITHUB_ATTESTATIONS` | `false` (fix de build no Railway) | — |

## Upload de imagens
- Se `CLOUDINARY_CLOUD_NAME` está definido → upload para Cloudinary (persistente)
- Se não → salva em `backend/uploads/` (perdido a cada redeploy no Railway)
- Imagens no Cloudinary ficam na pasta `cardapio/`

## Como rodar localmente
```bash
cd cardapio-digital
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```
Acesse: http://localhost:8000 (cardápio) | http://localhost:8000/admin (painel)

## Deploy no Railway
1. Conectar repositório GitHub no Railway
2. Adicionar serviço PostgreSQL ao projeto (Railway preenche `DATABASE_URL` automaticamente)
3. Configurar variáveis de ambiente no painel do serviço
4. Railway detecta `Procfile` e `runtime.txt` automaticamente

## Personalização para outro estabelecimento
1. `index.html`: nome, horário, endereço no store-banner e meta chips
2. `style.css`: `--accent` (cor primária) e `--green` (cor de status)
3. `.env`: `WHATSAPP_NUMBER` com o número real
4. Admin `/admin`: cadastrar categorias → cadastrar produtos com imagens

## Como trabalhamos
- Implementar de forma incremental, um passo de cada vez
- Código limpo, sem comentários óbvios
- Manter este CLAUDE.md e o README.md atualizados a cada mudança relevante
