const SUPABASE_CONFIG = window.publicSupabaseConfig;
const DEFAULT_TEMPLATE_ID = "timeless-paper";

const state = {
  pageFlip: null,
  countdownTimer: null,
  audio: null,
  toastTimer: null
};

const ui = {};

document.addEventListener("DOMContentLoaded", bootstrapInvitation);

async function bootstrapInvitation() {
  cacheElements();
  showLoadingState();

  try {
    window.weddingConfig = await loadWeddingConfig();
    initializeInvitation();
  } catch (error) {
    console.error("Falha ao carregar configuracao do convite.", error);
    showFatalError(
      "Nao foi possivel carregar este convite agora. Verifique o link ou tente novamente em instantes."
    );
  }
}

function initializeInvitation() {
  if (!window.weddingConfig) {
    console.error("weddingConfig nao foi encontrado.");
    showFatalError("Nenhuma configuracao de convite foi encontrada.");
    return;
  }

  applyMeta();
  applyTheme();
  applyTemplateMode();
  renderPages();
  initFlipbook();
  initCountdown();
  initAudio();
  bindEvents();
}

async function loadWeddingConfig() {
  const slug = getInvitationSlug();

  if (!slug) {
    return window.defaultWeddingConfig;
  }

  return fetchInvitationConfig(slug);
}

function getInvitationSlug() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("casal");

  return slug ? slug.trim() : "";
}

async function fetchInvitationConfig(slug) {
  const url = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`);
  url.searchParams.set("select", "config");
  url.searchParams.set("slug", `eq.${slug}`);
  url.searchParams.set("is_published", "eq.true");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase respondeu com status ${response.status}.`);
  }

  const [record] = await response.json();

  if (!record?.config) {
    throw new Error(`Convite "${slug}" nao encontrado.`);
  }

  return record.config;
}

function cacheElements() {
  ["audioToggle", "invitationExperience", "flipbook", "toast"].forEach((id) => {
    ui[id] = document.getElementById(id);
  });
}

function showLoadingState() {
  if (!ui.flipbook) {
    return;
  }

  ui.flipbook.innerHTML = `
    <div class="page-placeholder placeholder-card">
      Carregando convite...
    </div>
  `;
}

function showFatalError(message) {
  if (!ui.flipbook) {
    return;
  }

  ui.flipbook.innerHTML = `
    <div class="page-placeholder placeholder-card">
      <div class="placeholder-content">
        <p class="page-tag">Convite indisponivel</p>
        <p class="message-top-spacing">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

function applyMeta() {
  const { meta, couple } = window.weddingConfig;

  document.title = meta?.pageTitle || `${couple?.displayName || "Convite"} | Casamento`;

  const description =
    meta?.description ||
    "Template base de convite de casamento com efeito flipbook.";
  const descriptionTag = document.querySelector('meta[name="description"]');

  if (descriptionTag) {
    descriptionTag.setAttribute("content", description);
  }
}

function applyTheme() {
  const theme = window.weddingConfig.theme || {};
  const root = document.documentElement;

  const themeMap = {
    "--color-bg": theme.background,
    "--color-surface": theme.surface,
    "--color-surface-strong": theme.surfaceStrong,
    "--color-ink": theme.ink,
    "--color-muted": theme.muted,
    "--color-accent": theme.accent,
    "--color-accent-strong": theme.accentStrong
  };

  Object.entries(themeMap).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(key, value);
    }
  });
}

function applyTemplateMode() {
  const templateId = getActiveTemplateId();
  document.body.dataset.template = templateId;

  if (ui.invitationExperience) {
    ui.invitationExperience.dataset.template = templateId;
  }
}

function renderPages() {
  const pages = buildTemplatePages();
  ui.flipbook.innerHTML = "";

  pages.forEach((page, index) => {
    ui.flipbook.appendChild(createPageElement(page, index, pages.length));
  });
}

function createPageElement(page, index, total) {
  if (page.layout) {
    return createTimelessPage(page, index, total);
  }

  switch (page.type) {
    case "image":
      return createImagePage(page, index, total);
    case "split":
      return createSplitPage(page, index, total);
    case "content":
    default:
      return createContentPage(page, index, total);
  }
}

function createBasePage(page) {
  const element = document.createElement("article");
  const templateId = getActiveTemplateId();
  element.className = `invitation-page page--${page.type || "content"} template--${templateId}`;
  element.dataset.pageId = page.id || "";
  element.dataset.density = page.density || "soft";
  element.dataset.template = templateId;

  if (page.density) {
    element.setAttribute("data-density", page.density);
  }

  return element;
}

function createImagePage(page, index, total) {
  const element = createBasePage(page);
  const imageMarkup = page.imageSrc
    ? `<div class="page-image"><img src="${escapeHtml(page.imageSrc)}" alt="${escapeHtml(
        page.alt || ""
      )}" style="object-fit:${escapeHtml(page.imageFit || "cover")}" /></div>`
    : `<div class="page-placeholder"><div class="placeholder-content"><p class="page-tag">Imagem</p><p class="message-top-spacing">Adicione a arte desta pagina no config.js.</p></div></div>`;

  element.innerHTML = `
    <div class="page-inner">
      ${imageMarkup}
      <div class="page-footer page-footer-overlay">
        <span>${escapeHtml(window.weddingConfig.couple?.displayName || "Convite")}</span>
        <span>${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
      </div>
    </div>
  `;

  return element;
}

function buildTemplatePages() {
  return [
    { id: "cover", layout: "cover", type: "content" },
    { id: "save-date", layout: "save-date", type: "content" },
    { id: "details", layout: "details", type: "content" },
    { id: "actions", layout: "actions", type: "content" },
    { id: "closing", layout: "closing", type: "content" }
  ];
}

function createTimelessPage(page, index, total) {
  const element = createBasePage(page);
  element.classList.add(`layout--${page.layout}`);

  switch (page.layout) {
    case "cover":
      element.innerHTML = renderTimelessCover(index, total);
      break;
    case "save-date":
      element.innerHTML = renderTimelessSaveDate(index, total);
      break;
    case "details":
      element.innerHTML = renderTimelessDetails(index, total);
      break;
    case "actions":
      element.innerHTML = renderTimelessActions(index, total);
      break;
    case "closing":
    default:
      element.innerHTML = renderTimelessClosing(index, total);
      break;
  }

  return element;
}

function createContentPage(page, index, total) {
  const element = createBasePage(page);

  element.innerHTML = `
    <div class="page-inner">
      <div class="page-copy">
        <div class="page-copy-main content-stack-lg">
          ${page.eyebrow ? `<p class="page-tag">${escapeHtml(page.eyebrow)}</p>` : ""}
          ${
            page.title
              ? `<h2 class="page-title">${escapeHtml(page.title)}</h2>`
              : ""
          }
          ${renderDescriptions(page.description)}
          ${renderFacts(page.facts)}
          ${renderList(page.list)}
          ${page.showEvent ? renderEventBlock() : ""}
          ${page.showCountdown ? renderCountdownBlock() : ""}
          ${page.showActions ? renderActionLinks() : ""}
          ${page.showPix ? renderPixBlock() : ""}
        </div>
        <div class="page-copy-meta content-stack-md">
          ${page.quote ? `<blockquote class="page-quote">${escapeHtml(page.quote)}</blockquote>` : ""}
          ${renderPageFooter(index, total)}
        </div>
      </div>
    </div>
  `;

  return element;
}

function createSplitPage(page, index, total) {
  const element = createBasePage(page);
  const imageMarkup = page.imageSrc
    ? `<div class="page-image"><img src="${escapeHtml(page.imageSrc)}" alt="${escapeHtml(
        page.alt || ""
      )}" style="object-fit:${escapeHtml(page.imageFit || "cover")}" /></div>`
    : `<div class="page-placeholder"><div class="placeholder-content"><p class="page-tag">Pagina hibrida</p><p class="message-top-spacing">Adicione uma imagem ou use apenas conteudo textual.</p></div></div>`;

  element.innerHTML = `
    <div class="page-inner">
      ${imageMarkup}
      <div class="page-copy">
        <div class="page-copy-main content-stack-lg">
          ${page.eyebrow ? `<p class="page-tag">${escapeHtml(page.eyebrow)}</p>` : ""}
          ${
            page.title
              ? `<h2 class="page-title">${escapeHtml(page.title)}</h2>`
              : ""
          }
          ${renderDescriptions(page.description)}
          ${renderFacts(page.facts)}
          ${renderList(page.list)}
          ${page.showEvent ? renderEventBlock() : ""}
          ${page.showCountdown ? renderCountdownBlock() : ""}
          ${page.showActions ? renderActionLinks() : ""}
          ${page.showPix ? renderPixBlock() : ""}
        </div>
        <div class="page-copy-meta content-stack-md">
          ${page.quote ? `<blockquote class="page-quote">${escapeHtml(page.quote)}</blockquote>` : ""}
          ${renderPageFooter(index, total)}
        </div>
      </div>
    </div>
  `;

  return element;
}

function renderTimelessCover(index, total) {
  const hero = window.weddingConfig.hero || {};
  return `
    <div class="page-inner timeless-page-shell timeless-page-shell--cover">
      <div class="timeless-page-main timeless-page-main--center">
        ${renderMonogram()}
        <p class="timeless-overline">${escapeHtml(hero.overline || "Convidamos voce para o nosso casamento")}</p>
        <h1 class="timeless-names">${renderNamesMarkup()}</h1>
        <div class="timeless-copy">
        </div>
      </div>
      ${renderPageFooter(index, total)}
    </div>
  `;
}

function renderTimelessSaveDate(index, total) {
  const dateParts = getEventDateParts();
  return `
    <div class="page-inner timeless-page-shell timeless-page-shell--save-date">
      <div class="timeless-page-main timeless-page-main--center">
        <div class="timeless-save-lockup">
          <span class="timeless-save-word timeless-save-word--top">SAVE</span>
          <span class="timeless-save-script">the</span>
          <span class="timeless-save-word timeless-save-word--bottom">DATE</span>
        </div>
        <p class="timeless-date-feature">
          <span>${escapeHtml(dateParts.saveDateLine)}</span>
        </p>
      </div>
      ${renderPageFooter(index, total)}
    </div>
  `;
}

function renderTimelessDetails(index, total) {
  const event = window.weddingConfig.event || {};
  const dateParts = getEventDateParts();
  return `
    <div class="page-inner timeless-page-shell timeless-page-shell--details">
      <div class="timeless-page-main">
        ${renderMonogram()}
        <p class="timeless-blessing">Com a bencao de suas familias</p>
        <h2 class="timeless-names timeless-names--details">${renderNamesMarkup()}</h2>
        <div class="timeless-divider"></div>
        <div class="timeless-details-stack">
          <div class="timeless-date-frame">
            <p class="timeless-date-block">${escapeHtml(dateParts.numericDate)}</p>
            <p class="timeless-date-meta">${escapeHtml(dateParts.weekdayTimeLine)}</p>
          </div>
          <div class="timeless-location-frame">
            <p class="timeless-location">${escapeHtml(event.venueName || "")}</p>
            <p class="timeless-location-sub">${escapeHtml(event.venueAddress || "")}</p>
          </div>
        </div>
      </div>
      ${renderPageFooter(index, total)}
    </div>
  `;
}

function renderTimelessActions(index, total) {
  const event = window.weddingConfig.event || {};
  return `
    <div class="page-inner timeless-page-shell timeless-page-shell--actions">
      <div class="timeless-page-main">
        <p class="timeless-overline">Informacoes importantes</p>
        <h2 class="timeless-title">Toque nos botoes para interagir</h2>
        ${renderActionLinks()}
        ${renderPixBlock()}
      </div>
      ${renderPageFooter(index, total)}
    </div>
  `;
}

function renderTimelessClosing(index, total) {
  const event = window.weddingConfig.event || {};
  const dateParts = getEventDateParts();
  return `
    <div class="page-inner timeless-page-shell timeless-page-shell--closing">
      <div class="timeless-page-main timeless-page-main--center">
        ${renderMonogram()}
        <p class="timeless-script-line">Esperamos por voce</p>
        <div class="timeless-copy timeless-copy--closing">
          <p>${escapeHtml(dateParts.longDateLine)}</p>
          <p>${escapeHtml(event.venueName || "")}</p>
        </div>
      </div>
      ${renderPageFooter(index, total)}
    </div>
  `;
}

function renderMonogram() {
  const brideInitial = (window.weddingConfig.couple?.brideName || "L").trim().charAt(0);
  const groomInitial = (window.weddingConfig.couple?.groomName || "P").trim().charAt(0);

  return `
    <div class="timeless-monogram" aria-hidden="true">
      <div class="timeless-monogram-stack">
        <span class="timeless-monogram-letter timeless-monogram-letter--first">${escapeHtml(brideInitial)}</span>
        <span class="timeless-monogram-letter timeless-monogram-letter--second">${escapeHtml(groomInitial)}</span>
      </div>
    </div>
  `;
}

function renderNamesMarkup() {
  const couple = window.weddingConfig.couple || {};

  return `
    <span>${escapeHtml(couple.brideName || "")}</span>
    <small>e</small>
    <span>${escapeHtml(couple.groomName || "")}</span>
  `;
}

function renderDescriptions(items) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return `
    <div class="page-description">
      ${items.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
    </div>
  `;
}

function renderFacts(items) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return `
    <div class="page-facts">
      ${items
        .map(
          (item) => `
            <div class="page-fact">
              <span class="page-fact-label">${escapeHtml(item.label || "")}</span>
              <span class="page-fact-value">${escapeHtml(item.value || "")}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderList(items) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return `
    <ul class="page-list">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderEventBlock() {
  const event = window.weddingConfig.event || {};

  return `
    <div class="page-facts">
      <div class="page-fact">
        <span class="page-fact-label">Data</span>
        <span class="page-fact-value">${escapeHtml(event.dateLabel || "")}</span>
      </div>
      <div class="page-fact">
        <span class="page-fact-label">Cerimonia</span>
        <span class="page-fact-value">${escapeHtml(event.ceremonyLabel || "")}</span>
      </div>
      <div class="page-fact">
        <span class="page-fact-label">Local</span>
        <span class="page-fact-value">${escapeHtml(event.venueName || "")}</span>
      </div>
      <div class="page-fact">
        <span class="page-fact-label">Endereco</span>
        <span class="page-fact-value">${escapeHtml(event.venueAddress || "")}</span>
      </div>
    </div>
  `;
}

function renderCountdownBlock() {
  return `
    <div class="page-countdown">
      <div class="page-countdown-item">
        <span class="page-countdown-value" data-countdown="days">00</span>
        <span class="page-countdown-label">Dias</span>
      </div>
      <div class="page-countdown-item">
        <span class="page-countdown-value" data-countdown="hours">00</span>
        <span class="page-countdown-label">Horas</span>
      </div>
      <div class="page-countdown-item">
        <span class="page-countdown-value" data-countdown="minutes">00</span>
        <span class="page-countdown-label">Min</span>
      </div>
      <div class="page-countdown-item">
        <span class="page-countdown-value" data-countdown="seconds">00</span>
        <span class="page-countdown-label">Seg</span>
      </div>
    </div>
  `;
}

function renderActionLinks() {
  const event = window.weddingConfig.event || {};
  const rsvpLinks = window.weddingConfig.actions?.rsvpLinks || [];
  const items = [];
  const mapsUrl = normalizeLinkValue(event.mapsUrl);

  if (mapsUrl) {
    items.push(`
      <a class="page-action" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noreferrer">
        Ver local
      </a>
    `);
  }

  rsvpLinks.forEach((link) => {
    const normalizedUrl = normalizeLinkValue(link?.url);

    if (!normalizedUrl) {
      return;
    }

    items.push(`
      <a class="page-action" href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noreferrer">
        ${escapeHtml(link.label || "Confirmar presenca")}
      </a>
    `);
  });

  const pixValue =
    window.weddingConfig.actions?.pix?.copyPaste ||
    window.weddingConfig.actions?.pix?.key ||
    "";

  if (pixValue) {
    items.push(`
      <button type="button" class="page-action" data-copy-pix="true">
        Copiar PIX
      </button>
    `);
  }

  if (!items.length) {
    return "";
  }

  return `<div class="page-actions">${items.join("")}</div>`;
}

function renderPixBlock() {
  const pix = window.weddingConfig.actions?.pix || {};
  const pixValue = pix.copyPaste || pix.key || "";

  return `
    <div class="page-pix">
      <p class="page-fact-label">${escapeHtml(pix.label || "Presente via PIX")}</p>
      <p class="page-pix-beneficiary">
        ${escapeHtml(pix.beneficiary || "")}
      </p>
      <p class="page-pix-code">${escapeHtml(pixValue || "Nenhum codigo PIX configurado.")}</p>
      ${
        pixValue
          ? '<button type="button" class="page-action page-action-spaced" data-copy-pix="true">Copiar PIX</button>'
          : ""
      }
    </div>
  `;
}

function renderPageFooter(index, total) {
  return `
    <div class="page-footer">
      <span>${escapeHtml(window.weddingConfig.couple?.displayName || "Convite")}</span>
      <span>${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
    </div>
  `;
}

function getEventDateParts() {
  const event = window.weddingConfig.event || {};
  const date = new Date(event.dateISO || "");

  if (Number.isNaN(date.getTime())) {
    return {
      saveDateLine: "14 . SETEMBRO . 2028",
      numericDate: "14 | 09 | 2028",
      weekdayTimeLine: "SEXTA-FEIRA, AS 16H30",
      longDateLine: event.dateLabel || "14 de setembro de 2028, as 16h30"
    };
  }

  const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
  const monthNumeric = new Intl.DateTimeFormat("pt-BR", { month: "2-digit" }).format(date);
  const monthWord = new Intl.DateTimeFormat("pt-BR", { month: "long" })
    .format(date)
    .toUpperCase();
  const year = new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(date);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" })
    .format(date)
    .toUpperCase();
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(date)
    .replace(":", "H");

  return {
    saveDateLine: `${day} . ${monthWord} . ${year}`,
    numericDate: `${day} | ${monthNumeric} | ${year}`,
    weekdayTimeLine: `${weekday}, AS ${time}`,
    longDateLine: event.dateLabel || `${day}/${monthNumeric}/${year}`
  };
}

function getActiveTemplateId() {
  return DEFAULT_TEMPLATE_ID;
}

function initFlipbook() {
  const pageElements = Array.from(ui.flipbook.querySelectorAll(".invitation-page"));

  if (!pageElements.length) {
    ui.flipbook.innerHTML =
      '<div class="page-placeholder placeholder-card">Adicione paginas em <strong>assets/js/config.js</strong>.</div>';
    return;
  }

  if (!window.St?.PageFlip) {
    console.error("St.PageFlip nao foi carregado.");
    return;
  }

  const book = window.weddingConfig.book || {};
  const frameWidth = book.width || 420;
  const frameHeight = book.height || 640;

  ui.flipbook.style.maxWidth = `${frameWidth}px`;

  state.pageFlip = new window.St.PageFlip(ui.flipbook, {
    width: frameWidth,
    height: frameHeight,
    minWidth: book.minWidth || 260,
    maxWidth: book.maxWidth || frameWidth,
    minHeight: book.minHeight || 390,
    maxHeight: book.maxHeight || frameHeight,
    size: book.size || "stretch",
    usePortrait: true,
    showCover: Boolean(book.showCover),
    maxShadowOpacity: book.maxShadowOpacity ?? 0.22,
    mobileScrollSupport: book.mobileScrollSupport !== false,
    clickEventForward: book.clickEventForward !== false,
    disableFlipByClick: Boolean(book.disableFlipByClick),
    autoSize: true
  });

  const loadPages =
    state.pageFlip.loadFromHtml?.bind(state.pageFlip) ||
    state.pageFlip.loadFromHTML?.bind(state.pageFlip);

  if (!loadPages) {
    console.error("Metodo de carregamento do flipbook nao encontrado.");
    return;
  }

  loadPages(pageElements);
}

function initCountdown() {
  const targetDate = new Date(window.weddingConfig.event?.dateISO || "");

  if (Number.isNaN(targetDate.getTime())) {
    setCountdownValues({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    return;
  }

  const updateCountdown = () => {
    const diff = targetDate.getTime() - Date.now();

    if (diff <= 0) {
      setCountdownValues({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      clearInterval(state.countdownTimer);
      return;
    }

    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;

    setCountdownValues({
      days: Math.floor(diff / day),
      hours: Math.floor((diff % day) / hour),
      minutes: Math.floor((diff % hour) / minute),
      seconds: Math.floor((diff % minute) / second)
    });
  };

  updateCountdown();
  state.countdownTimer = window.setInterval(updateCountdown, 1000);
}

function setCountdownValues(values) {
  document.querySelectorAll('[data-countdown="days"]').forEach((element) => {
    element.textContent = String(values.days).padStart(2, "0");
  });
  document.querySelectorAll('[data-countdown="hours"]').forEach((element) => {
    element.textContent = String(values.hours).padStart(2, "0");
  });
  document.querySelectorAll('[data-countdown="minutes"]').forEach((element) => {
    element.textContent = String(values.minutes).padStart(2, "0");
  });
  document.querySelectorAll('[data-countdown="seconds"]').forEach((element) => {
    element.textContent = String(values.seconds).padStart(2, "0");
  });
}

function initAudio() {
  const audioConfig = window.weddingConfig.audio || {};
  ui.audioToggle.classList.remove("hidden");

  if (!audioConfig.src) {
    ui.audioToggle.textContent = "Musica";
    ui.audioToggle.setAttribute("aria-pressed", "false");
    ui.audioToggle.dataset.audioReady = "false";
    return;
  }

  state.audio = new Audio(normalizeLinkValue(audioConfig.src));
  state.audio.loop = audioConfig.loop !== false;
  ui.audioToggle.dataset.audioReady = "true";
  syncAudioButton();

  if (audioConfig.autoplay) {
    const tryAutoplay = () => {
      state.audio
        .play()
        .then(syncAudioButton)
        .catch(() => {});

      window.removeEventListener("pointerdown", tryAutoplay);
    };

    window.addEventListener("pointerdown", tryAutoplay, { once: true });
  }
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-pix]");

    if (!copyButton) {
      return;
    }

    const pix = window.weddingConfig.actions?.pix || {};
    const valueToCopy = pix.copyPaste || pix.key || "";

    if (!valueToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(valueToCopy);
      showToast("Codigo PIX copiado.");
    } catch (error) {
      fallbackCopy(valueToCopy);
      showToast("Codigo PIX copiado.");
    }
  });

  ui.audioToggle?.addEventListener("click", async () => {
    if (ui.audioToggle?.dataset.audioReady !== "true") {
      showToast("A musica sera adicionada em breve.");
      return;
    }

    if (!state.audio) {
      return;
    }

    if (state.audio.paused) {
      try {
        await state.audio.play();
      } catch (error) {
        showToast("Nao foi possivel iniciar a musica.");
      }
    } else {
      state.audio.pause();
    }

    syncAudioButton();
  });
}

function syncAudioButton() {
  if (!state.audio) {
    return;
  }

  const isPlaying = !state.audio.paused;
  ui.audioToggle.textContent = isPlaying ? "Pausar musica" : "Tocar musica";
  ui.audioToggle.setAttribute("aria-pressed", String(isPlaying));
}

function fallbackCopy(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");

  clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    ui.toast.classList.remove("is-visible");
  }, 2200);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return replacements[character];
  });
}

function normalizeLinkValue(value) {
  return String(value || "")
    .trim()
    .replace(/[`]/g, "")
    .replace(/\s+/g, "");
}
