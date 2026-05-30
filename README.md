# Cardápio Digital — Dogão do Bino

Sistema de cardápio digital **mobile-first** com painel admin completo e envio de pedido via WhatsApp.
Design premium inspirado em iFood/Uber Eats: light theme, bottom sheets, cart bar persistente e micro-interações nativas.

---

## Funcionalidades

### Cardápio público (`/`)
- Header fixo com logo, status "Aberto agora" e carrinho com badge
- Category nav sticky com glassmorphism — tabs geradas pelas categorias cadastradas
- Intersection Observer — tab ativa atualiza ao rolar
- Busca em tempo real por nome ou descrição
- Cards com botão "+" inline e qty pill (− N +) quando o item está no carrinho
- Bottom sheet de detalhe: imagem, qty, observações, preço dinâmico
- Cart bar fixa no fundo da tela
- Bottom sheet de carrinho com Retirada / Entrega
- Ao escolher Entrega: dropdown de bairros com taxa + campo de endereço
- Taxa de entrega calculada automaticamente por bairro, somada ao total
- Pedido enviado direto ao WhatsApp da lanchonete (sem precisar selecionar contato)

### Painel admin (`/admin`)
- Login com senha → JWT (12h)
- **Aba Produtos:** grid com busca e filtro por categoria; modal de criação/edição com preview de imagem e toggle de disponibilidade
- **Aba Categorias:** criar e excluir divisões do cardápio (Dogs, Lanches, Combos, Especiais, Promoções…)
- **Aba Entregas:** cadastrar bairros com taxa individual; exibe "Grátis" quando taxa = 0
- Responsivo: sidebar no desktop, topbar + drawer no mobile

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python + FastAPI |
| Banco | SQLite (dev) / PostgreSQL (produção) |
| Frontend | HTML + CSS + JavaScript puro |
| Fonte | Plus Jakarta Sans (Google Fonts) |
| Imagens | Upload local ou Cloudinary |
| Auth | JWT HS256 via python-jose |
| Deploy | Railway |

---

## Instalação local

```bash
git clone <url-do-repo>
cd cardapio-digital

pip install -r backend/requirements.txt

cp .env.example .env
# edite o .env

uvicorn backend.main:app --reload
```

- **Cardápio:** http://localhost:8000
- **Admin:** http://localhost:8000/admin

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `ADMIN_PASSWORD` | Senha do painel admin |
| `SECRET_KEY` | Chave JWT (use string longa e aleatória em produção) |
| `DATABASE_URL` | Vazio = SQLite local; `postgresql://...` em produção |
| `WHATSAPP_NUMBER` | Número com DDI, só dígitos (ex: `5511999999999`) |
| `CLOUDINARY_CLOUD_NAME` | Cloud name do Cloudinary (opcional) |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary (opcional) |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary (opcional) |
| `MISE_PYTHON_GITHUB_ATTESTATIONS` | Definir como `false` no Railway para evitar erro de build |

---

## Deploy no Railway

1. Crie um projeto em [railway.app](https://railway.app) e conecte o repositório
2. Adicione um serviço **PostgreSQL** — o Railway preenche `DATABASE_URL` automaticamente
3. Configure as variáveis de ambiente no painel do serviço
4. O Railway detecta `Procfile` e `runtime.txt` e faz o deploy automaticamente

---

## Imagens

- Com `CLOUDINARY_*` configurado → imagens enviadas para o Cloudinary (persistentes entre deploys)
- Sem Cloudinary → salvas em `backend/uploads/` (perdidas a cada redeploy)

---

## Estrutura do projeto

```
cardapio-digital/
├── backend/
│   ├── main.py              # FastAPI app + montagem de rotas e statics
│   ├── config.py            # settings via pydantic-settings
│   ├── database.py          # engine SQLAlchemy
│   ├── models.py            # Item, Category, DeliveryZone
│   ├── schemas.py           # schemas Pydantic
│   ├── routers/
│   │   ├── auth.py          # POST /api/auth/login
│   │   ├── items.py         # CRUD /api/items/ + /api/items/config
│   │   ├── categories.py    # CRUD /api/categories/
│   │   └── delivery.py      # CRUD /api/delivery/zones
│   └── requirements.txt
├── frontend/
│   ├── index.html           # cardápio público
│   ├── admin.html           # painel admin
│   └── static/
│       ├── app.js           # lógica do cardápio
│       ├── admin.js         # lógica do admin
│       ├── style.css        # design system do cardápio
│       └── admin.css        # design system do admin
├── .env.example
├── Procfile
├── runtime.txt              # python-3.12.7
├── requirements.txt         # cópia na raiz para Railway
└── CLAUDE.md
```

---

## Mensagem enviada ao WhatsApp

```
🌭 *PEDIDO — DOGÃO DO BINO*

👤 *Nome:* João Silva
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

---

## Personalização para outro estabelecimento

1. `index.html` — nome, horário e endereço no store-banner
2. `style.css` — variáveis `--accent` e `--green` no topo
3. `.env` — `WHATSAPP_NUMBER` com o número real
4. Admin `/admin` — cadastrar categorias e produtos com imagens
