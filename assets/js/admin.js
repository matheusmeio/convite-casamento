const STORAGE_KEY = "convite_admin_session";
const DEFAULT_SLUG = "laura-pedro";
const SUPABASE_CONFIG = window.publicSupabaseConfig;
const invitationBuilder = window.invitationTemplateBuilder;

const state = {
  session: null,
  toastTimer: null
};

const ui = {};

document.addEventListener("DOMContentLoaded", () => {
  initializeAdmin().catch((error) => {
    console.error(error);
  });
});

async function initializeAdmin() {
  cacheElements();
  bindEvents();
  loadPersistedSession();
  fillForm(invitationBuilder.createDefaultFormState());
  renderAuthState();
  refreshPreviewLink();
  refreshDerivedOutputs();
}

function cacheElements() {
  [
    "authCard",
    "workspace",
    "loginForm",
    "invitationForm",
    "emailInput",
    "passwordInput",
    "slugInput",
    "publishedInput",
    "brideNameInput",
    "groomNameInput",
    "dateTimeInput",
    "ceremonyLabelInput",
    "venueNameInput",
    "venueAddressInput",
    "mapsUrlInput",
    "rsvpUrlInput",
    "pixKeyInput",
    "pixCopyPasteInput",
    "audioSrcInput",
    "configPreview",
    "sqlOutput",
    "previewLink",
    "loadButton",
    "resetButton",
    "generateSqlButton",
    "copySqlButton",
    "logoutButton",
    "toast"
  ].forEach((id) => {
    ui[id] = document.getElementById(id);
  });
}

function bindEvents() {
  ui.loginForm?.addEventListener("submit", handleLoginSubmit);
  ui.invitationForm?.addEventListener("submit", handleSaveSubmit);
  ui.loadButton?.addEventListener("click", handleLoadInvitation);
  ui.resetButton?.addEventListener("click", handleResetForm);
  ui.generateSqlButton?.addEventListener("click", () => {
    refreshDerivedOutputs();
    showToast("SQL gerado.");
  });
  ui.copySqlButton?.addEventListener("click", handleCopySql);
  ui.logoutButton?.addEventListener("click", handleLogout);

  [
    "slugInput",
    "publishedInput",
    "brideNameInput",
    "groomNameInput",
    "dateTimeInput",
    "ceremonyLabelInput",
    "venueNameInput",
    "venueAddressInput",
    "mapsUrlInput",
    "rsvpUrlInput",
    "pixKeyInput",
    "pixCopyPasteInput",
    "audioSrcInput"
  ].forEach((id) => {
    const eventName = id === "publishedInput" ? "change" : "input";
    ui[id]?.addEventListener(eventName, () => {
      refreshPreviewLink();
      refreshDerivedOutputs();
    });
  });
}

function loadPersistedSession() {
  const rawSession = window.localStorage.getItem(STORAGE_KEY);

  if (!rawSession) {
    return;
  }

  try {
    state.session = JSON.parse(rawSession);
  } catch (error) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function renderAuthState() {
  const isAuthenticated = Boolean(state.session?.access_token);

  ui.authCard.classList.toggle("hidden", isAuthenticated);
  ui.workspace.classList.toggle("hidden", !isAuthenticated);
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = ui.emailInput.value.trim();
  const password = ui.passwordInput.value;

  if (!email || !password) {
    showToast("Informe e-mail e senha.");
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_CONFIG.anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error("Credenciais invalidas.");
    }

    state.session = await response.json();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.session));
    renderAuthState();
    showToast("Login realizado.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel entrar.");
  }
}

async function handleLoadInvitation() {
  if (!state.session?.access_token) {
    showToast("Faca login para carregar convites.");
    return;
  }

  const slug = getSlugValue();

  if (!slug) {
    showToast("Informe o slug.");
    return;
  }

  try {
    const url = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`);
    url.searchParams.set("select", "slug,is_published,config");
    url.searchParams.set("slug", `eq.${slug}`);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: buildAuthenticatedHeaders()
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar convite (${response.status}).`);
    }

    const [record] = await response.json();

    if (!record) {
      const fallbackState = invitationBuilder.createDefaultFormState();
      fallbackState.slug = slug;
      fillForm(fallbackState);
      showToast("Slug nao encontrado. Carreguei o modelo padrao.");
      return;
    }

    const formState = invitationBuilder.extractInvitationFormState(record.config);
    formState.slug = record.slug;
    formState.isPublished = Boolean(record.is_published);
    fillForm(formState);
    showToast("Convite carregado.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel carregar o convite.");
  }
}

async function handleSaveSubmit(event) {
  event.preventDefault();

  if (!state.session?.access_token) {
    showToast("Faca login para salvar.");
    return;
  }

  const slug = getSlugValue();

  if (!slug) {
    showToast("Informe o slug.");
    return;
  }

  const config = buildCurrentConfig();

  try {
    const url = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`);
    url.searchParams.set("on_conflict", "slug");

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        ...buildAuthenticatedHeaders(),
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({
        slug,
        is_published: ui.publishedInput.checked,
        config
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Falha ao salvar convite (${response.status}).`);
    }

    refreshDerivedOutputs();
    showToast("Convite salvo com sucesso.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel salvar o convite.");
  }
}

function handleResetForm() {
  const fallbackState = invitationBuilder.createDefaultFormState();
  fallbackState.slug = getSlugValue() || fallbackState.slug;
  fallbackState.isPublished = ui.publishedInput.checked;
  fillForm(fallbackState);
  showToast("Formulario restaurado.");
}

async function handleCopySql() {
  refreshDerivedOutputs();

  try {
    await navigator.clipboard.writeText(ui.sqlOutput.value);
    showToast("SQL copiado.");
  } catch (error) {
    fallbackCopy(ui.sqlOutput.value);
    showToast("SQL copiado.");
  }
}

function handleLogout() {
  state.session = null;
  window.localStorage.removeItem(STORAGE_KEY);
  renderAuthState();
  showToast("Sessao encerrada.");
}

function fillForm(formState) {
  ui.slugInput.value = formState.slug || DEFAULT_SLUG;
  ui.publishedInput.checked = Boolean(formState.isPublished);
  ui.brideNameInput.value = formState.brideName || "";
  ui.groomNameInput.value = formState.groomName || "";
  ui.dateTimeInput.value = formState.dateTime || "";
  ui.ceremonyLabelInput.value = formState.ceremonyLabel || "";
  ui.venueNameInput.value = formState.venueName || "";
  ui.venueAddressInput.value = formState.venueAddress || "";
  ui.mapsUrlInput.value = formState.mapsUrl || "";
  ui.rsvpUrlInput.value = formState.rsvpUrl || "";
  ui.pixKeyInput.value = formState.pixKey || "";
  ui.pixCopyPasteInput.value = formState.pixCopyPaste || "";
  ui.audioSrcInput.value = formState.audioSrc || "";
  refreshPreviewLink();
  refreshDerivedOutputs();
}

function readFormState() {
  return {
    slug: getSlugValue() || DEFAULT_SLUG,
    isPublished: ui.publishedInput.checked,
    brideName: ui.brideNameInput.value.trim(),
    groomName: ui.groomNameInput.value.trim(),
    dateTime: ui.dateTimeInput.value,
    ceremonyLabel: ui.ceremonyLabelInput.value.trim(),
    venueName: ui.venueNameInput.value.trim(),
    venueAddress: ui.venueAddressInput.value.trim(),
    mapsUrl: ui.mapsUrlInput.value.trim(),
    rsvpUrl: ui.rsvpUrlInput.value.trim(),
    pixKey: ui.pixKeyInput.value.trim(),
    pixCopyPaste: ui.pixCopyPasteInput.value.trim(),
    audioSrc: ui.audioSrcInput.value.trim()
  };
}

function buildCurrentConfig() {
  return invitationBuilder.buildInvitationConfig(readFormState());
}

function refreshPreviewLink() {
  const slug = getSlugValue() || DEFAULT_SLUG;
  ui.previewLink.href = `/?casal=${encodeURIComponent(slug)}`;
}

function refreshDerivedOutputs() {
  const config = buildCurrentConfig();
  const configText = JSON.stringify(config, null, 2);

  ui.configPreview.value = configText;
  ui.sqlOutput.value = buildUpsertSql(
    getSlugValue() || DEFAULT_SLUG,
    ui.publishedInput.checked,
    configText
  );
}

function buildUpsertSql(slug, isPublished, configText) {
  const safeSlug = String(slug).replace(/'/g, "''");
  const safeConfig = normalizeDollarQuotedJson(configText);

  return `insert into public.invitations (slug, is_published, config)
values (
  '${safeSlug}',
  ${isPublished ? "true" : "false"},
  $json$
${safeConfig}
  $json$::jsonb
)
on conflict (slug) do update
set
  is_published = excluded.is_published,
  config = excluded.config;`;
}

function normalizeDollarQuotedJson(configText) {
  const trimmed = String(configText || "{}").trim();
  const sanitized = trimmed.replace(/\$json\$/g, "$ json $");

  return indentMultiline(sanitized, 2);
}

function indentMultiline(value, spaces) {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function buildAuthenticatedHeaders() {
  return {
    apikey: SUPABASE_CONFIG.anonKey,
    Authorization: `Bearer ${state.session.access_token}`
  };
}

function getSlugValue() {
  return ui.slugInput.value.trim();
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
