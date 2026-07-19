const BUILDER_TEMPLATE_ID = "timeless-paper";

window.invitationTemplateBuilder = {
  createDefaultFormState,
  buildInvitationConfig,
  extractInvitationFormState
};

function createDefaultFormState() {
  return {
    slug: "laura-pedro",
    isPublished: true,
    brideName: "Laura",
    groomName: "Pedro",
    dateTime: "2028-09-14T16:30",
    venueName: "Villa Toscana Eventos",
    venueAddress: "Alameda das Oliveiras, 2450 - Vinhedo, SP",
    mapsUrl: "https://maps.google.com/?q=Villa+Toscana+Eventos+Vinhedo+SP",
    rsvpUrl:
      "https://wa.me/5511987654321?text=Ola%2C+quero+confirmar+presenca+no+casamento+de+Laura+e+Pedro.",
    pixKey: "presentes.laura.pedro@email.com",
    pixCopyPaste:
      "00020126580014BR.GOV.BCB.PIX0137presentes.laura.pedro@email.com5204000053039865406150.005802BR5914LAURA E PEDRO6009SAO PAULO62070503***6304ABCD",
    audioSrc: ""
  };
}

function buildInvitationConfig(formState) {
  const brideName = normalizeText(formState.brideName, "Laura");
  const groomName = normalizeText(formState.groomName, "Pedro");
  const displayName = `${brideName} & ${groomName}`;
  const beneficiary = `${brideName} e ${groomName}`;
  const dateISO = normalizeDateTime(formState.dateTime);
  const longDateLabel = formatLongDate(dateISO);

  return {
    meta: {
      pageTitle: `${displayName} | Convite de Casamento`,
      description: "Convite digital com papelaria editorial e atmosfera delicada.",
      templateName: BUILDER_TEMPLATE_ID
    },
    theme: {
      templateId: BUILDER_TEMPLATE_ID,
      background: "#efebe6",
      surface: "#ffffff",
      surfaceStrong: "#f6f1eb",
      ink: "#2f2723",
      muted: "#7c6d66",
      accent: "#b07a46",
      accentStrong: "#8f6034"
    },
    hero: {
      overline: "Convidamos voce para o nosso casamento",
      headline: displayName,
      subheadline:
        "Cada pagina foi pensada para compartilhar com voce a beleza e a delicadeza desse dia especial.",
      primaryCtaLabel: "Abrir convite",
      secondaryCtaLabel: "Ver local"
    },
    couple: {
      brideName,
      groomName,
      displayName,
      storyHeadline: longDateLabel
    },
    event: {
      dateISO,
      dateLabel: longDateLabel,
      venueName: normalizeText(formState.venueName, "Villa Toscana Eventos"),
      venueAddress: normalizeText(
        formState.venueAddress,
        "Alameda das Oliveiras, 2450 - Vinhedo, SP"
      ),
      mapsUrl: normalizeUrl(formState.mapsUrl)
    },
    audio: {
      src: normalizeUrl(formState.audioSrc),
      autoplay: false,
      loop: true,
      label: "Musica"
    },
    actions: {
      rsvpLinks: buildRsvpLinks(formState.rsvpUrl),
      pix: {
        label: "Presente via PIX",
        beneficiary,
        key: normalizeText(formState.pixKey, ""),
        copyPaste: normalizeText(formState.pixCopyPaste, "")
      }
    },
    book: {
      width: 420,
      height: 760,
      minWidth: 260,
      maxWidth: 420,
      minHeight: 420,
      maxHeight: 760,
      showCover: false,
      usePortrait: true,
      size: "stretch",
      maxShadowOpacity: 0.1,
      mobileScrollSupport: true,
      clickEventForward: true,
      disableFlipByClick: false
    },
    pages: []
  };
}

function extractInvitationFormState(config) {
  const defaults = createDefaultFormState();
  const brideName = normalizeText(config?.couple?.brideName, defaults.brideName);
  const groomName = normalizeText(config?.couple?.groomName, defaults.groomName);
  const rsvpUrl = config?.actions?.rsvpLinks?.[0]?.url || defaults.rsvpUrl;

  return {
    slug: defaults.slug,
    isPublished: true,
    brideName,
    groomName,
    dateTime: normalizeDateTimeForInput(config?.event?.dateISO, defaults.dateTime),
    ceremonyLabel: normalizeText(config?.event?.ceremonyLabel, defaults.ceremonyLabel),
    venueName: normalizeText(config?.event?.venueName, defaults.venueName),
    venueAddress: normalizeText(config?.event?.venueAddress, defaults.venueAddress),
    mapsUrl: normalizeUrl(config?.event?.mapsUrl || defaults.mapsUrl),
    rsvpUrl: normalizeUrl(rsvpUrl),
    pixKey: normalizeText(config?.actions?.pix?.key, defaults.pixKey),
    pixCopyPaste: normalizeText(
      config?.actions?.pix?.copyPaste,
      defaults.pixCopyPaste
    ),
    audioSrc: normalizeUrl(config?.audio?.src || "")
  };
}

function buildRsvpLinks(rsvpUrl) {
  const normalizedUrl = normalizeUrl(rsvpUrl);

  if (!normalizedUrl) {
    return [];
  }

  return [
    {
      label: "Confirmar presenca",
      url: normalizedUrl
    }
  ];
}

function normalizeText(value, fallback) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || fallback;
}

function normalizeUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[`]/g, "")
    .replace(/\s+/g, "");
}

function normalizeDateTime(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "2028-09-14T16:30:00-03:00";
  }

  if (normalizedValue.endsWith(":00-03:00")) {
    return normalizedValue;
  }

  if (normalizedValue.length === 16) {
    return `${normalizedValue}:00-03:00`;
  }

  if (normalizedValue.length === 19) {
    return `${normalizedValue}-03:00`;
  }

  return normalizedValue;
}

function normalizeDateTimeForInput(value, fallback) {
  if (!value) {
    return fallback;
  }

  return String(value).slice(0, 16);
}

function formatLongDate(dateISO) {
  const date = new Date(dateISO);

  if (Number.isNaN(date.getTime())) {
    return "14 de setembro de 2028, as 16h30";
  }

  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  return `${dateLabel}, as ${timeLabel}`;
}
