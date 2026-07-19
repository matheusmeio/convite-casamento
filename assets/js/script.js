const SUPABASE_CONFIG = window.publicSupabaseConfig;
const TEMPLATE_CATALOG = window.invitationTemplateCatalog || [];
const DEFAULT_TEMPLATE_ID =
  window.defaultInvitationTemplateId ||
  TEMPLATE_CATALOG[0]?.id ||
  "classic-botanical";

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
  const pages = window.weddingConfig.pages || [];
  ui.flipbook.innerHTML = "";

  pages.forEach((page, index) => {
    ui.flipbook.appendChild(createPageElement(page, index, pages.length));
  });
}

function createPageElement(page, index, total) {
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

function createContentPage(page, index, total) {
  const element = createBasePage(page);
  const templateId = getActiveTemplateId();

  if (templateId === "editorial-modern") {
    element.innerHTML = renderEditorialContentPage(page, index, total);
    return element;
  }

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
  const templateId = getActiveTemplateId();

  if (templateId === "editorial-modern") {
    element.innerHTML = renderEditorialSplitPage(page, index, total);
    return element;
  }

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

function renderEditorialContentPage(page, index, total) {
  return `
    <div class="page-inner editorial-page-shell">
      <div class="editorial-topline">
        <span class="editorial-kicker">${escapeHtml(page.eyebrow || window.weddingConfig.couple?.displayName || "Convite")}</span>
        <span class="editorial-index">${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="editorial-grid editorial-grid--content">
        <div class="page-copy page-copy--editorial">
          <div class="page-copy-main content-stack-lg">
            ${page.title ? `<h2 class="page-title editorial-title">${escapeHtml(page.title)}</h2>` : ""}
            ${renderDescriptions(page.description)}
            ${renderList(page.list)}
            ${page.quote ? `<blockquote class="page-quote editorial-quote">${escapeHtml(page.quote)}</blockquote>` : ""}
          </div>
        </div>
        <aside class="editorial-sidebar">
          <div class="editorial-sidebar-block">
            ${renderFacts(page.facts)}
            ${page.showEvent ? renderEventBlock() : ""}
            ${page.showCountdown ? renderCountdownBlock() : ""}
            ${page.showActions ? renderActionLinks() : ""}
            ${page.showPix ? renderPixBlock() : ""}
          </div>
          ${renderPageFooter(index, total)}
        </aside>
      </div>
    </div>
  `;
}

function renderEditorialSplitPage(page, index, total) {
  const imageMarkup = page.imageSrc
    ? `<div class="page-image editorial-image"><img src="${escapeHtml(page.imageSrc)}" alt="${escapeHtml(
        page.alt || ""
      )}" style="object-fit:${escapeHtml(page.imageFit || "cover")}" /></div>`
    : "";

  return `
    <div class="page-inner editorial-page-shell">
      <div class="editorial-topline">
        <span class="editorial-kicker">${escapeHtml(page.eyebrow || "Historia")}</span>
        <span class="editorial-index">${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="editorial-grid editorial-grid--split">
        <div class="editorial-story-column">
          ${imageMarkup}
          <div class="page-copy page-copy--editorial">
            <div class="page-copy-main content-stack-lg">
              ${page.title ? `<h2 class="page-title editorial-title">${escapeHtml(page.title)}</h2>` : ""}
              ${renderDescriptions(page.description)}
            </div>
          </div>
        </div>
        <aside class="editorial-sidebar">
          <div class="editorial-sidebar-block">
            ${renderFacts(page.facts)}
            ${renderList(page.list)}
            ${page.showEvent ? renderEventBlock() : ""}
            ${page.showCountdown ? renderCountdownBlock() : ""}
            ${page.showActions ? renderActionLinks() : ""}
            ${page.showPix ? renderPixBlock() : ""}
          </div>
          ${page.quote ? `<blockquote class="page-quote editorial-quote">${escapeHtml(page.quote)}</blockquote>` : ""}
          ${renderPageFooter(index, total)}
        </aside>
      </div>
    </div>
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

  if (event.mapsUrl) {
    items.push(`
      <a class="page-action" href="${escapeHtml(event.mapsUrl)}" target="_blank" rel="noreferrer">
        Ver local
      </a>
    `);
  }

  rsvpLinks.forEach((link) => {
    if (!link?.url) {
      return;
    }

    items.push(`
      <a class="page-action" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
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

function getActiveTemplateId() {
  const templateId =
    window.weddingConfig?.theme?.templateId ||
    window.weddingConfig?.meta?.templateName;

  return TEMPLATE_CATALOG.some((template) => template.id === templateId)
    ? templateId
    : DEFAULT_TEMPLATE_ID;
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

  if (!audioConfig.src) {
    return;
  }

  state.audio = new Audio(audioConfig.src);
  state.audio.loop = audioConfig.loop !== false;
  ui.audioToggle.classList.remove("hidden");
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
