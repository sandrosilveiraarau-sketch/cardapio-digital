# Cardápio Digital — Hamburgueria

Sistema de cardápio digital com painel admin e envio de pedido via WhatsApp.

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
| `SECRET_KEY` | Chave secreta para geração de JWT (use algo longo e aleatório em produção) |
| `DATABASE_URL` | URL do banco — deixe vazio para SQLite local, ou `postgresql://...` em produção |
| `WHATSAPP_NUMBER` | Número do WhatsApp com DDI, sem espaços (ex: `5511999999999`) |
| `CLOUDINARY_CLOUD_NAME` | Cloud name do Cloudinary (opcional — somente se usar imagens em nuvem) |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary (opcional) |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary (opcional) |

---

## Funcionalidades

### Cardápio público (`/`)
- Lista todos os itens disponíveis em grid responsivo
- Cliente adiciona itens ao carrinho
- Ao finalizar, abre WhatsApp com o pedido formatado

### Painel admin (`/admin`)
- Login com senha simples
- Cadastro de itens: nome, descrição, preço, categoria, imagem
- Edição e exclusão de itens
- Controle de disponibilidade (ocultar item sem excluir)

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
│   │   ├── auth.py      # Autenticação admin
│   │   └── items.py     # CRUD de itens do cardápio
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Cardápio público
│   ├── admin.html       # Painel admin
│   └── static/
│       ├── app.js       # Lógica do cardápio e carrinho
│       ├── admin.js     # Lógica do painel admin
│       └── style.css    # Estilos customizados
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

## Stack

- **Backend:** Python + FastAPI
- **Banco:** SQLite (dev) / PostgreSQL (produção)
- **Frontend:** HTML + Tailwind CSS + JavaScript puro
- **Autenticação:** JWT (HS256)
- **Imagens:** Upload local ou Cloudinary
