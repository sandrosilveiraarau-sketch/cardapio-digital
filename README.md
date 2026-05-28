# Cardápio Digital — Dogão do Bino

Sistema de cardápio digital premium com painel admin e envio de pedido via WhatsApp.
Design profissional com tema escuro, identidade visual personalizada e UX superior.

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
- Hero full-screen com identidade visual da marca e floating card animado
- Info strip com horário, localização e canal de atendimento
- Filtragem por categoria (gerada automaticamente a partir dos produtos)
- Busca em tempo real por nome ou descrição
- Cards com hover animado e overlay de ação
- Modal de item: quantidade, campo de observações, preço dinâmico
- Carrinho lateral com:
  - Campo de nome do cliente
  - Toggle Retirada / Entrega (campo de endereço condicional)
  - Lista de itens com observações destacadas
  - Total do pedido
  - Botão de envio pelo WhatsApp com mensagem formatada

### Painel admin (`/admin`)
- Login com senha simples
- Cadastro de itens: nome, descrição, preço, categoria, imagem
- Edição e exclusão de itens
- Controle de disponibilidade (ocultar item sem excluir)

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
│   │   └── items.py     # CRUD de itens do cardápio
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Cardápio público (Dogão do Bino)
│   ├── admin.html       # Painel admin
│   └── static/
│       ├── app.js       # Categorias, busca, modal, carrinho, WhatsApp
│       ├── admin.js     # Login, CRUD de itens
│       └── style.css    # Design system: variáveis, animações, componentes
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

1. **Nome e textos:** edite `frontend/index.html` — hero, info strip, footer
2. **Cores:** edite `--accent` e `--accent-2` em `frontend/static/style.css`
3. **WhatsApp:** configure `WHATSAPP_NUMBER` no `.env`
4. **Produtos:** cadastre pelo painel admin em `/admin`

---

## Stack

- **Backend:** Python + FastAPI
- **Banco:** SQLite (dev) / PostgreSQL (produção)
- **Frontend:** HTML + Tailwind CDN + CSS customizado + JavaScript puro
- **Autenticação:** JWT (HS256, 12h)
- **Imagens:** Upload local ou Cloudinary
