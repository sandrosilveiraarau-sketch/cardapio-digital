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

## Como trabalhamos
- Implementar de forma incremental, um passo de cada vez
- Sempre explicar o raciocínio por trás das decisões
- Sugerir alternativas quando houver trade-offs
- Código limpo, sem comentários óbvios