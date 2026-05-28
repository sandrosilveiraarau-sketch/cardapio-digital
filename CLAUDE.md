# Cardápio Digital — Dogão do Bino

## Sobre o projeto
Sistema de cardápio digital com link web fixo para uma lanchonete/hotdog house.
Não é SaaS — é um sistema para um único estabelecimento.

## Funcionalidades
- Painel admin com senha simples para o dono cadastrar itens
- Cadastro de lanches: nome, descrição, preço, categoria e imagem
- Cardápio público premium para o cliente navegar
- Filtragem por categoria (gerada automaticamente) e busca em tempo real
- Cliente abre modal do item, escolhe quantidade e adiciona observações
- Carrinho com nome do cliente, tipo de pedido (Retirada/Entrega) e endereço
- Pedido enviado via WhatsApp com mensagem formatada profissionalmente
- Deploy em nuvem via Railway ou Render

## Stack
- Backend: Python com FastAPI
- Banco: SQLite local → PostgreSQL em produção
- Frontend: HTML + Tailwind CDN + CSS customizado + JavaScript puro
- Imagens: upload local ou Cloudinary
- Deploy: Railway ou Render

## Identidade visual (Dogão do Bino)
- Tema: escuro premium (`#080808` de fundo)
- Cor primária (accent): vermelho ketchup `#E63030`
- Cor secundária: mostarda `#F5A520`
- Tipografia: **Bebas Neue** (títulos/display) + **Inter** (corpo)
- Hero: full-screen com glow vermelho, dot-grid pattern, floating card animado
- Info strip: horário, localização, tipo de pedido, canal WhatsApp
- Cards: hover com overlay vermelho + scale na imagem
- Modal de item: qty controls + campo de observações + preço dinâmico
- Carrinho: nome do cliente, toggle Retirada/Entrega, endereço condicional

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
│   ├── index.html       # cardápio público (Dogão do Bino)
│   ├── admin.html       # painel do dono
│   └── static/
│       ├── app.js       # cardápio: categorias, busca, modal, carrinho, WhatsApp
│       ├── admin.js     # painel admin: login, CRUD de itens
│       └── style.css    # design system completo (variáveis, animações, componentes)
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

## Fluxo do app.js
1. `init()` → chama `setupListeners()` + `setupScrollBehavior()` + `loadItems()`
2. `loadItems()` → GET `/api/items/` → `buildCategoryTabs()` + `renderItems()`
3. `applyFilters()` → filtra por categoria ativa + query de busca → `renderItems()`
4. `openModal(id)` → exibe item com qty/notas, atualiza botão com preço total
5. `addModalItemToCart()` → `cartAdd()` → `refreshCartUI()` → abre carrinho
6. `sendWhatsApp()` → GET `/api/items/config` para número → monta mensagem formatada → `wa.me`

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
1. `index.html`: trocar nome, tagline, horário, endereço no info-strip
2. `style.css`: mudar `--accent` e `--accent-2` para a paleta da marca
3. `.env`: `WHATSAPP_NUMBER` com o número real do estabelecimento
4. Admin: cadastrar produtos reais com imagens

## Como trabalhamos
- Implementar de forma incremental, um passo de cada vez
- Código limpo, sem comentários óbvios
- Manter este CLAUDE.md e o README.md atualizados a cada mudança relevante
