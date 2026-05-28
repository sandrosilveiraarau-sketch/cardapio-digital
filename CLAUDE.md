# Cardápio Digital — Hamburgueria

## Sobre o projeto
Sistema de cardápio digital com link web fixo para uma hamburgueria/lanchonete.
Não é SaaS — é um sistema para um único estabelecimento.

## Funcionalidades
- Painel admin com senha simples para o dono cadastrar itens
- Cadastro de lanches: nome, descrição, preço e imagem
- Cardápio público bonito e moderno para o cliente navegar
- Cliente monta o pedido e envia via WhatsApp (link wa.me formatado)
- Deploy em nuvem via Railway ou Render

## Stack
- Backend: Python com FastAPI
- Banco: SQLite local → PostgreSQL em produção
- Frontend: HTML + Tailwind CSS + JavaScript puro
- Imagens: upload local ou Cloudinary
- Deploy: Railway ou Render

## Identidade visual
Referência: Hamburgueria Orquestra
Interface escura, moderna, tipografia forte, imagens em destaque, sensação premium.
Fontes: Bebas Neue (títulos) + Inter (corpo). Cor de destaque: amber-400.

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
│   ├── index.html       # cardápio público
│   ├── admin.html       # painel do dono
│   └── static/
│       ├── app.js       # lógica cardápio + carrinho + WhatsApp
│       ├── admin.js     # lógica painel admin (login, CRUD)
│       └── style.css    # fontes + classe .input-field
├── .env.example         # variáveis necessárias documentadas
├── .gitignore
├── CLAUDE.md
└── README.md
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
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --app-dir ..
```
Acesse: http://localhost:8000 (cardápio) | http://localhost:8000/admin (painel)

## Como trabalhamos
- Implementar de forma incremental, um passo de cada vez
- Sempre explicar o raciocínio por trás das decisões
- Sugerir alternativas quando houver trade-offs
- Código limpo, sem comentários óbvios
- Atualizar este CLAUDE.md e o README.md a cada mudança relevante
