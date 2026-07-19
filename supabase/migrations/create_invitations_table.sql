insert into public.invitations (slug, is_published, config)
values (
  'julia-renan',
  true,
  $json$
  {
    "meta": {
      "pageTitle": "Júlia & Renan | Nosso Casamento",
    },
    "theme": {
      "background": "#1e2522",
      "surface": "#252e2a",
      "surfaceStrong": "#2d3833",
      "ink": "#f4f6f5",
      "muted": "#a3b2ab",
      "accent": "#d4af37",
      "accentStrong": "#aa841c"
    },
    "hero": {
      "overline": "14 . NOVEMBRO . 2026",
      "headline": "O amor é a maior de todas as jornadas",
      "subheadline": "Estamos muito felizes em compartilhar esse momento com as pessoas que mais amamos.",
      "primaryCtaLabel": "Abrir Convite",
      "secondaryCtaLabel": "Localização"
    },
    "couple": {
      "brideName": "Júlia",
      "groomName": "Renan",
      "displayName": "Júlia & Renan",
      "storyHeadline": "Nossa Próxima Parada"
    },
    "event": {
      "dateISO": "2026-11-14T17:00:00-03:00",
      "dateLabel": "14 de Novembro de 2026, às 17h00",
      "ceremonyLabel": "Cerimônia & Recepção",
      "venueName": "Espaço Das Figueiras",
      "venueAddress": "Av. das Nações, 1050 - Jardim Botânico, Porto Alegre - RS",
      "mapsUrl": "https://maps.google.com/?q=Espaco+Das+Figueiras+Porto+Alegre"
    },
    "audio": {
      "src": "",
      "autoplay": false,
      "loop": true,
      "label": "Música Ambiente"
    },
    "actions": {
      "rsvpLinks": [
        {
          "label": "Confirmar Presença",
          "url": "https://wa.me/5551999999999?text=Olá!+Quero+confirmar+minha+presença+no+casamento+da+Júlia+e+do+Renan."
        }
      ],
      "pix": {
        "label": "Lista de Presentes (PIX)",
        "beneficiary": "Júlia e Renan",
        "key": "casamento.juliaerenan@gmail.com",
        "copyPaste": "00020126520014BR.GOV.BCB.PIX0131casamento.juliaerenan@gmail.com5204000053039865405100.005802BR5913JULIA E RENAN6012PORTO ALEGRE62070503***63041234"
      }
    },
    "book": {
      "width": 420,
      "height": 640,
      "minWidth": 260,
      "maxWidth": 420,
      "minHeight": 390,
      "maxHeight": 640,
      "showCover": false,
      "usePortrait": true,
      "size": "stretch",
      "maxShadowOpacity": 0.25,
      "mobileScrollSupport": true,
      "clickEventForward": true,
      "disableFlipByClick": false
    },
    "pages": [
      {
        "id": "cover",
        "type": "content",
        "density": "soft",
        "eyebrow": "Save The Date",
        "title": "O grande dia está chegando.",
      },
      {
        "id": "details",
        "type": "content",
        "density": "soft",
        "eyebrow": "Programação",
        "title": "Onde e Quando",
        "description": [
          "A recepção acontecerá no mesmo local da cerimônia. Venha preparado para comemorar e dançar muito conosco!"
        ],
        "showEvent": true,
        "showCountdown": true,
        "showActions": true
      },
      {
        "id": "attire",
        "type": "content",
        "density": "soft",
        "eyebrow": "Dress Code",
        "title": "Traje: Passeio Completo",
        "description": [
          "Queremos que você se sinta incrível e confortável para aproveitar a noite.",
          "Dica para as convidadas: o local possui áreas de gramado, então saltos em bloco (grossos) são muito bem-vindos!"
        ],
        "list": [
          "Homens: Terno ou costume (gravata opcional).",
          "Mulheres: Vestidos longos ou mídis fluidos.",
          "Pedimos gentilmente para evitar tons de branco e off-white."
        ]
      },
      {
        "id": "gift",
        "type": "content",
        "density": "soft",
        "eyebrow": "Contribuição",
        "title": "Nossa Lua de Mel",
        "description": [
          "Sua presença é o nosso maior presente. Mas, se quiser nos ajudar a realizar a viagem dos nossos sonhos, você pode fazer uma contribuição voluntária via PIX."
        ],
        "showPix": true
      }
    ]
  }
  $json$::jsonb
)
on conflict (slug) do update
set
  is_published = excluded.is_published,
  config = excluded.config;