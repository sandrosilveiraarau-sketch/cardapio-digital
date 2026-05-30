"""
Seed — Dogão do Bino
Cria categorias e produtos no cardápio via API.

Uso:
    python seed.py --url https://web-production-2f76b.up.railway.app --password dogao2024@bino
"""

import argparse
import requests
import sys

# ─── Dados do cardápio ────────────────────────────────────────────────────────

CATEGORIES = [
    "Dogs",
    "Especiais",
    "Combos",
    "Lanches",
    "Bebidas",
    "Sobremesas",
]

PRODUCTS = [
    # ── Dogs ──────────────────────────────────────────────────────────────────
    {
        "name": "Dogão Simples",
        "category": "Dogs",
        "price": 12.00,
        "description": "Pão macio, salsicha suculenta, molho de tomate, mostarda e ketchup.",
        "available": True,
    },
    {
        "name": "Dogão Tradicional",
        "category": "Dogs",
        "price": 16.00,
        "description": "Pão artesanal, salsicha, milho, ervilha, batata palha, molho de tomate e mostarda.",
        "available": True,
    },
    {
        "name": "Dogão Completo",
        "category": "Dogs",
        "price": 19.00,
        "description": "Pão artesanal, salsicha, bacon crocante, queijo derretido, milho, batata palha e molhos especiais.",
        "available": True,
    },
    {
        "name": "Dogão do Bino",
        "category": "Dogs",
        "price": 24.00,
        "description": "Nossa receita exclusiva: pão brioche, salsicha premium, blend de queijos, bacon, cebola caramelizada e molho da casa. O preferido dos clientes!",
        "available": True,
    },
    {
        "name": "Dogão de Frango",
        "category": "Dogs",
        "price": 18.00,
        "description": "Pão artesanal, frango desfiado temperado, queijo mussarela, milho e catupiry.",
        "available": True,
    },
    {
        "name": "Dogão Duplo",
        "category": "Dogs",
        "price": 22.00,
        "description": "Duas salsichas, pão artesanal, queijo derretido, batata palha, molho especial. Para quem tem fome de verdade!",
        "available": True,
    },

    # ── Especiais ─────────────────────────────────────────────────────────────
    {
        "name": "Dog Bacon Crocante",
        "category": "Especiais",
        "price": 26.00,
        "description": "Pão brioche tostado, salsicha defumada, bacon extra crocante, queijo cheddar derretido e molho barbecue.",
        "available": True,
    },
    {
        "name": "Dog Catupiry",
        "category": "Especiais",
        "price": 23.00,
        "description": "Pão artesanal, salsicha, catupiry cremoso, milho, batata palha e cebolinha.",
        "available": True,
    },
    {
        "name": "Dog Cheddar",
        "category": "Especiais",
        "price": 23.00,
        "description": "Pão brioche, salsicha premium, cheddar derretido generoso, cebola crocante e mostarda Dijon.",
        "available": True,
    },
    {
        "name": "Dog Veggie",
        "category": "Especiais",
        "price": 20.00,
        "description": "Pão integral, salsicha de soja, legumes grelhados, queijo, tomate e molho verde especial.",
        "available": True,
    },

    # ── Combos ────────────────────────────────────────────────────────────────
    {
        "name": "Combo Dog + Bebida",
        "category": "Combos",
        "price": 22.00,
        "description": "Dogão Tradicional + 1 refrigerante lata 350ml. Economize no combo!",
        "available": True,
    },
    {
        "name": "Combo Especial + Bebida",
        "category": "Combos",
        "price": 30.00,
        "description": "Dogão do Bino + 1 refrigerante lata 350ml. O combo mais pedido da casa!",
        "available": True,
    },
    {
        "name": "Combo Família (2 Dogs + 2 Bebidas)",
        "category": "Combos",
        "price": 48.00,
        "description": "2 Dogões Completos + 2 refrigerantes lata. Perfeito para dividir!",
        "available": True,
    },
    {
        "name": "Combo Dog Duplo + Batata + Bebida",
        "category": "Combos",
        "price": 38.00,
        "description": "Dogão Duplo + porção de batata frita + 1 refrigerante lata. Combo mais completo!",
        "available": True,
    },

    # ── Lanches ───────────────────────────────────────────────────────────────
    {
        "name": "X-Burguer",
        "category": "Lanches",
        "price": 18.00,
        "description": "Pão de hambúrguer, hambúrguer 150g, queijo mussarela, alface, tomate e maionese.",
        "available": True,
    },
    {
        "name": "X-Bacon",
        "category": "Lanches",
        "price": 22.00,
        "description": "Pão de hambúrguer, hambúrguer 150g, bacon crocante, queijo cheddar, alface, tomate e maionese especial.",
        "available": True,
    },
    {
        "name": "X-Tudo",
        "category": "Lanches",
        "price": 26.00,
        "description": "Pão brioche, hambúrguer 180g, bacon, ovo frito, queijo, alface, tomate, cebola e molho da casa.",
        "available": True,
    },
    {
        "name": "Porção de Batata Frita",
        "category": "Lanches",
        "price": 14.00,
        "description": "Porção generosa de batata frita crocante temperada com sal e ervas. Serve 2 pessoas.",
        "available": True,
    },
    {
        "name": "Batata Frita com Cheddar e Bacon",
        "category": "Lanches",
        "price": 19.00,
        "description": "Porção de batata frita coberta com molho cheddar cremoso e bacon crocante.",
        "available": True,
    },

    # ── Bebidas ───────────────────────────────────────────────────────────────
    {
        "name": "Refrigerante Lata",
        "category": "Bebidas",
        "price": 6.00,
        "description": "Coca-Cola, Guaraná Antarctica ou Sprite. 350ml gelado.",
        "available": True,
    },
    {
        "name": "Refrigerante 600ml",
        "category": "Bebidas",
        "price": 8.00,
        "description": "Coca-Cola, Guaraná Antarctica ou Sprite. 600ml gelado.",
        "available": True,
    },
    {
        "name": "Água Mineral",
        "category": "Bebidas",
        "price": 4.00,
        "description": "Água mineral sem gás 500ml.",
        "available": True,
    },
    {
        "name": "Suco Natural",
        "category": "Bebidas",
        "price": 9.00,
        "description": "Suco natural de laranja, maracujá ou limão. Feito na hora. 300ml.",
        "available": True,
    },
    {
        "name": "Milk-shake",
        "category": "Bebidas",
        "price": 16.00,
        "description": "Milk-shake cremoso nos sabores: chocolate, morango ou baunilha. 400ml.",
        "available": True,
    },

    # ── Sobremesas ────────────────────────────────────────────────────────────
    {
        "name": "Brownie Artesanal",
        "category": "Sobremesas",
        "price": 10.00,
        "description": "Brownie de chocolate meio amargo com nozes, macio por dentro e crocante por fora.",
        "available": True,
    },
    {
        "name": "Sorvete 2 Bolas",
        "category": "Sobremesas",
        "price": 8.00,
        "description": "2 bolas de sorvete nos sabores: chocolate, creme, morango ou baunilha.",
        "available": True,
    },
]

# ─── Script ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed do cardápio Dogão do Bino")
    parser.add_argument("--url", required=True, help="URL base da aplicação (ex: https://web-production-2f76b.up.railway.app)")
    parser.add_argument("--password", required=True, help="Senha do painel admin")
    args = parser.parse_args()

    base = args.url.rstrip("/")

    # 1. Login
    print("Autenticando...")
    res = requests.post(f"{base}/api/auth/login", json={"password": args.password})
    if not res.ok:
        print("ERRO: Senha incorreta.")
        sys.exit(1)
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Autenticado!\n")

    # 2. Criar categorias
    print("Criando categorias...")
    cat_map = {}
    for i, name in enumerate(CATEGORIES):
        res = requests.post(
            f"{base}/api/categories/",
            json={"name": name, "order": i},
            headers={**headers, "Content-Type": "application/json"},
        )
        if res.ok:
            cat_map[name] = name
            print(f"  [OK] {name}")
        elif res.status_code == 400:
            cat_map[name] = name
            print(f"  [JA EXISTE] {name}")
        else:
            print(f"  [ERRO] {name} — {res.status_code}")

    # 3. Criar produtos
    print(f"\nCriando {len(PRODUCTS)} produtos...")
    ok = 0
    for p in PRODUCTS:
        data = {
            "name": p["name"],
            "price": str(p["price"]),
            "description": p.get("description", ""),
            "category": p.get("category", ""),
            "available": str(p.get("available", True)).lower(),
        }
        res = requests.post(
            f"{base}/api/items/",
            data=data,
            headers=headers,
        )
        if res.ok:
            ok += 1
            print(f"  [OK] {p['name']} — R$ {p['price']:.2f}")
        else:
            print(f"  [ERRO] {p['name']} — {res.status_code}: {res.text[:80]}")

    print(f"\nConcluido! {ok}/{len(PRODUCTS)} produtos criados.")
    print(f"Acesse {base}/admin para adicionar imagens aos produtos.")

if __name__ == "__main__":
    main()
