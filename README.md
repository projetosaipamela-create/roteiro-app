# Roteiro Interativo Dubai, Coreia e Japão 2026

Aplicativo estático do roteiro da família, pronto para publicar no Vercel e compartilhar por link.

## Como ver localmente

Acesse pelo servidor local:

`http://127.0.0.1:8765/roteiro-app/`

## Estrutura

- `index.html`: casca do aplicativo.
- `assets/styles.css`: visual, responsividade e temas por destino.
- `assets/app.js`: interação, abas, filtros, links de mapa e cópia de endereço.
- `data/itinerary.js`: dias, horários, passeios e planos B.
- `data/places.js`: atrações, lojas, cafés e restaurantes.
- `data/hotels.js`: hotéis, endereços e observações por destino.

## Como publicar no Vercel

1. Criar um projeto no Vercel apontando para esta pasta `roteiro-app`.
2. Framework: `Other`.
3. Build command: deixar vazio.
4. Output directory: deixar vazio ou `.`.
5. Ativar proteção/privacidade do projeto ou deployment se quiser compartilhar apenas com a família.

Como o app é só HTML/CSS/JS, não precisa instalar dependências para publicar.
