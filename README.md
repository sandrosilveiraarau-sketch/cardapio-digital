# Cardápio Digital — Dogão do Bino

Sistema de cardápio digital **mobile-first** com painel admin e envio de pedido via WhatsApp.
Design world-class inspirado em iFood/Uber Eats: light theme premium, bottom sheets, cart bar persistente e micro-interações nativas.

---

## Pré-requisitos
- Python 3.11+
- pip

---

## Instalação local

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd cardapio-digital

# 2. Instale as dependências
pip install -r backend/requirements.txt

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com sua senha e número de WhatsApp

# 4. Suba o servidor
uvicorn backend.main:app --reload
```

Acesse:
- **Cardápio público:** http://localhost:8000
- **Painel admin:** http://localhost:8000/admin

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|---|---|
| `ADMIN_PASSWORD` | Senha de acesso ao painel admin |
| `SECRET_KEY` | Chave secreta para JWT (use algo longo e aleatório em produção) |
| `DATABASE_URL` | URL do banco — vazio para SQLite local, ou `postgresql://...` em produção |
| `WHATSAPP_NUMBER` | Número com DDI, sem espaços (ex: `5511999999999`) |
| `CLOUDINARY_CLOUD_NAME` | Cloud name do Cloudinary (opcional) |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary (opcional) |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary (opcional) |

---

## Funcionalidades

### Cardápio público (`/`)
- Header fixo com logo, status "Aberto agora" e ícone de carrinho com badge
- Store banner com chips de horário, dias e tipo de entrega
- **Category nav sticky** com glassmorphism — tabs geradas automaticamente pelos produtos cadastrados
- **Intersection Observer** — tab ativa atualiza conforme o cliente rola o cardápio
- **Busca em tempo real** por nome ou descrição
- **Cards horizontais** (imagem à direita) com botão "+" de toque grande
- **Qty pill inline** (− N +) aparece no card quando o item está no carrinho
- **Item bottom sheet** ao tocar no card: imagem, descrição, qty, observações, preço dinâmico
- **Cart bar** fixa no fundo da tela — aparece ao adicionar o primeiro item, some quando o carrinho esvazia
- **Cart bottom sheet** com nome do cliente, toggle Retirada/Entrega, endereço condicional, total e botão WhatsApp
- Toast de feedback ao adicionar cada item

### Painel admin (`/admin`)
- Login com senha simples
- Cadastro de itens: nome, descrição, preço, categoria, imagem
- Edição e exclusão de itens
- Controle de disponibilidade (ocultar sem excluir)

---

## Design

| Atributo | Valor |
|---|---|
| Tema | Light premium (warm parchment `#F7F5F0`) |
| Accent | Burnt orange `#E8622A` |
| Verde (status) | `#25A244` |
| Fonte | Plus Jakarta Sans (400–800) |
| Max-width | 640px — coluna centralizada no desktop |
| Viewport-alvo | 390px (iPhone 14 Pro) |
| Animações | Spring `cubic-bezier(0.16, 1, 0.3, 1)` |

---

## Mensagem enviada ao WhatsApp

```
🌭 *PEDIDO — DOGÃO DO BINO*

👤 *Nome:* João Silva
🛵 *Tipo:* Entrega
📍 *Endereço:* Rua das Flores, 123

*🍽️ Itens:*
• 2x Dogão Tradicional — R$ 37,80
  📝 Sem cebola
• 1x Coca-Cola Lata — R$ 6,00

*💰 Total: R$ 43,80*

_Pedido via cardápio digital_ 🌭
```

---

## Estrutura do projeto

```
cardapio-digital/
├── backend/
│   ├── main.py          # FastAPI app + rotas estáticas
│   ├── config.py        # Configurações via .env
│   ├── database.py      # Conexão com banco de dados
│   ├── models.py        # Modelo Item (SQLAlchemy)
│   ├── schemas.py       # Schemas Pydantic
│   ├── routers/
│   │   ├── auth.py      # Autenticação admin (JWT)
│   │   └── items.py     # CRUD de itens (Form data + upload de imagem)
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Cardápio público mobile-first
│   ├── admin.html       # Painel admin
│   └── static/
│       ├── app.js       # Lógica completa: categorias, busca, sheets, carrinho, WhatsApp
│       ├── admin.js     # Login, CRUD de itens
│       └── style.css    # Design system completo (sem Tailwind)
├── .env.example
└── CLAUDE.md
```

---

## Deploy (Railway ou Render)

1. Crie um projeto no [Railway](https://railway.app) ou [Render](https://render.com)
2. Conecte este repositório
3. Configure as variáveis de ambiente (incluindo `DATABASE_URL` com PostgreSQL)
4. Comando de start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

---

## Personalização para outro estabelecimento

1. **Nome e info:** edite o store-banner em `frontend/index.html`
2. **Cores:** altere `--accent` e `--green` no topo de `frontend/static/style.css`
3. **WhatsApp:** configure `WHATSAPP_NUMBER` no `.env`
4. **Produtos:** cadastre pelo painel admin em `/admin`

---

## Stack

- **Backend:** Python + FastAPI
- **Banco:** SQLite (dev) / PostgreSQL (produção)
- **Frontend:** HTML + CSS customizado + JavaScript puro (sem framework)
- **Fonte:** Plus Jakarta Sans (Google Fonts)
- **Autenticação:** JWT (HS256, 12h)
- **Imagens:** Upload local ou Cloudinary
