insert into public.invitations (slug, is_published, config)
values (
  'matheus-beatriz',
  true,
  $json$
  {
    "meta": {
      "pageTitle": "Beatriz & Matheus | Convite de Casamento",
      "description": "Convite digital com visual editorial moderno e narrativa emocional.",
      "templateName": "editorial-modern"
    },
    "theme": {
      "templateId": "editorial-modern",
      "background": "#ede8df",
      "surface": "#f7f3ee",
      "surfaceStrong": "#e3ddd4",
      "ink": "#1f1a17",
      "muted": "#706861",
      "accent": "#8f7f6d",
      "accentStrong": "#2a2420"
    },
    "hero": {
      "overline": "Nosso grande dia",
      "headline": "Depois de tanta historia, chegou a hora do nosso sim.",
      "subheadline": "Criamos este convite para compartilhar com voce a beleza, a emocao e a leveza do dia mais especial das nossas vidas.",
      "primaryCtaLabel": "Abrir convite",
      "secondaryCtaLabel": "Ver local"
    },
    "couple": {
      "brideName": "Beatriz",
      "groomName": "Matheus",
      "displayName": "Beatriz & Matheus",
      "storyHeadline": "14 de setembro de 2028"
    },
    "event": {
      "dateISO": "2028-09-14T16:30:00-03:00",
      "dateLabel": "14 de setembro de 2028, as 16h30",
      "venueName": "Villa Toscana Eventos",
      "venueAddress": "Alameda das Oliveiras, 2450 - Vinhedo, SP",
      "mapsUrl": "https://maps.google.com/?q=Villa+Toscana+Eventos+Vinhedo+SP"
    },
    "audio": {
      "src": "",
      "autoplay": false,
      "loop": true,
      "label": "Nossa trilha"
    },
    "actions": {
      "rsvpLinks": [
        {
          "label": "Confirmar presenca",
          "url": "https://wa.me/5511987654321?text=Ola%2C+quero+confirmar+presenca+no+casamento+de+Beatriz+e+Matheus."
        }
      ],
      "pix": {
        "label": "Presente via PIX",
        "beneficiary": "Beatriz e Matheus",
        "key": "presentes.beatriz.matheus@email.com",
        "copyPaste": "00020126580014BR.GOV.BCB.PIX0137presentes.beatriz.matheus@email.com5204000053039865406150.005802BR5919BEATRIZ E MATHEUS6009SAO PAULO62070503***6304ABCD"
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
      "maxShadowOpacity": 0.12,
      "mobileScrollSupport": true,
      "clickEventForward": true,
      "disableFlipByClick": false
    },
    "pages": [
      {
        "id": "cover",
        "type": "image",
        "density": "soft",
        "imageSrc": "assets/media/pages/demo-cover.svg",
        "imageFit": "cover",
        "alt": "Capa do convite de Beatriz e Matheus"
      },
      {
        "id": "welcome",
        "type": "content",
        "density": "soft",
        "eyebrow": "Com muito amor",
        "title": "Convidamos voce para viver conosco o dia em que dois caminhos se tornam um so.",
        "description": [
          "Entre sonhos divididos, planos construidos e incontaveis memorias, chegamos ao momento mais esperado da nossa historia.",
          "Nada faria mais sentido do que celebrar esse novo capitulo ao lado das pessoas que fizeram parte da nossa caminhada."
        ],
        "facts": [
          {
            "label": "Data",
            "value": "14 de setembro de 2028"
          },
          {
            "label": "Horario",
            "value": "16h30"
          }
        ],
        "quote": "O amor nos trouxe ate aqui, e a sua presenca vai tornar tudo ainda mais inesquecivel."
      },
      {
        "id": "story",
        "type": "split",
        "density": "soft",
        "imageSrc": "assets/media/pages/demo-garden-scene.svg",
        "imageFit": "cover",
        "alt": "Beatriz e Matheus em um momento romantico",
        "eyebrow": "Nossa historia",
        "title": "Algumas historias nascem devagar, florescem com calma e, quando percebemos, ja se tornaram lar.",
        "description": [
          "Foi assim com a gente: entre encontros improvaveis, conversas longas e pequenos gestos, nasceu um amor leve, profundo e verdadeiro.",
          "Hoje, queremos transformar tudo o que vivemos em uma celebracao cheia de significado, beleza e gratidao."
        ],
        "list": [
          "Fim de tarde especial em clima intimista.",
          "Uma experiencia pensada para ser lembrada com carinho."
        ]
      },
      {
        "id": "event-details",
        "type": "content",
        "density": "soft",
        "eyebrow": "Informacoes",
        "title": "Reserve este dia para estar com a gente.",
        "description": [
          "Preparamos cada detalhe com muito amor para receber voce em uma celebracao acolhedora, elegante e cheia de emocao.",
          "Abaixo voce encontra as principais informacoes para chegar tranquilo e aproveitar cada instante."
        ],
        "showEvent": true,
        "showCountdown": true,
        "showActions": true
      },
      {
        "id": "gift-page",
        "type": "content",
        "density": "soft",
        "eyebrow": "Com carinho",
        "title": "Sua presenca e o nosso maior presente, mas deixamos uma opcao especial para quem desejar contribuir.",
        "description": [
          "Se quiser participar desse novo comeco de uma forma diferente, disponibilizamos nossa chave PIX com muito carinho.",
          "Toda contribuicao sera recebida com alegria e gratidao."
        ],
        "showPix": true
      },
      {
        "id": "closing",
        "type": "image",
        "density": "soft",
        "imageSrc": "assets/media/pages/demo-closing.svg",
        "imageFit": "cover",
        "alt": "Pagina final do convite de Beatriz e Matheus"
      }
    ]
  }
  $json$::jsonb
)
on conflict (slug) do update
set
  is_published = excluded.is_published,
  config = excluded.config;
