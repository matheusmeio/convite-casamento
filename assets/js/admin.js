const STORAGE_KEY = "convite_admin_session";
const DEFAULT_SLUG = "camila-eduardo";
const TEMPLATE_CATALOG = window.invitationTemplateCatalog || [];
const DEFAULT_TEMPLATE_ID =
  window.defaultInvitationTemplateId ||
  TEMPLATE_CATALOG[0]?.id ||
  "classic-botanical";
const SUPABASE_CONFIG = window.publicSupabaseConfig;

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
  populateTemplateSelect();
  bindEvents();
  loadPersistedSession();
  await fillConfigWithTemplate();
  renderAuthState();
  refreshPreviewLink();
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
    "templateSelect",
    "publishedInput",
    "configInput",
    "sqlOutput",
    "previewLink",
    "loadButton",
    "fillTemplateButton",
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
  ui.fillTemplateButton?.addEventListener("click", () => {
    fillConfigWithTemplate()
      .then(() => {
        refreshSqlOutput();
        showToast("Template carregado.");
      })
      .catch((error) => {
        console.error(error);
        showToast("Nao foi possivel carregar o template.");
      });
  });
  ui.generateSqlButton?.addEventListener("click", () => {
    refreshSqlOutput();
    showToast("SQL gerado.");
  });
  ui.templateSelect?.addEventListener("change", handleTemplateSelectionChange);
  ui.copySqlButton?.addEventListener("click", handleCopySql);
  ui.logoutButton?.addEventListener("click", handleLogout);
  ui.slugInput?.addEventListener("input", () => {
    refreshPreviewLink();
    refreshSqlOutput();
  });
  ui.configInput?.addEventListener("input", refreshSqlOutput);
  ui.publishedInput?.addEventListener("change", refreshSqlOutput);
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

function populateTemplateSelect() {
  ui.templateSelect.innerHTML = TEMPLATE_CATALOG.map(
    (template) =>
      `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`
  ).join("");

  ui.templateSelect.value = DEFAULT_TEMPLATE_ID;
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
      showToast("Slug nao encontrado. Carreguei o template base.");
      await fillConfigWithTemplate();
      refreshSqlOutput();
      return;
    }

    ui.publishedInput.checked = Boolean(record.is_published);
    ui.templateSelect.value = getTemplateIdFromConfig(record.config);
    ui.configInput.value = JSON.stringify(record.config, null, 2);
    refreshPreviewLink();
    refreshSqlOutput();
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

  let parsedConfig;

  try {
    parsedConfig = JSON.parse(ui.configInput.value);
  } catch (error) {
    showToast("O JSON da configuracao esta invalido.");
    return;
  }

  try {
    parsedConfig.theme = {
      ...(parsedConfig.theme || {}),
      templateId: getSelectedTemplateId()
    };
    parsedConfig.meta = {
      ...(parsedConfig.meta || {}),
      templateName: getSelectedTemplateId()
    };

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
        config: parsedConfig
      })
    });

    if (!response.ok) {
      throw new Error(`Falha ao salvar convite (${response.status}).`);
    }

    refreshPreviewLink();
    refreshSqlOutput();
    showToast("Convite salvo com sucesso.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel salvar o convite.");
  }
}

async function handleCopySql() {
  refreshSqlOutput();

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

async function fillConfigWithTemplate() {
  try {
    const template = await loadTemplateConfig(getSelectedTemplateId());
    ui.configInput.value = JSON.stringify(template, null, 2);
  } catch (error) {
    const fallbackConfig = {
      ...window.defaultWeddingConfig,
      theme: {
        ...(window.defaultWeddingConfig.theme || {}),
        templateId: getSelectedTemplateId()
      }
    };
    ui.configInput.value = JSON.stringify(fallbackConfig, null, 2);
  }
}

async function loadTemplateConfig(templateId) {
  const response = await fetch(`assets/templates/${templateId}.json`);

  if (!response.ok) {
    throw new Error("Template nao encontrado.");
  }

  return response.json();
}

async function handleTemplateSelectionChange() {
  const currentConfig = parseEditorConfig();

  if (!currentConfig) {
    refreshSqlOutput();
    return;
  }

  try {
    const templateConfig = await loadTemplateConfig(getSelectedTemplateId());
    const mergedConfig = {
      ...currentConfig,
      meta: {
        ...(currentConfig.meta || {}),
        templateName: getSelectedTemplateId()
      },
      theme: {
        ...(currentConfig.theme || {}),
        ...(templateConfig.theme || {}),
        templateId: getSelectedTemplateId()
      }
    };

    ui.configInput.value = JSON.stringify(mergedConfig, null, 2);
    refreshSqlOutput();
    showToast("Template visual atualizado.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel atualizar o template.");
  }
}

function refreshPreviewLink() {
  const slug = getSlugValue() || DEFAULT_SLUG;
  ui.previewLink.href = `/?casal=${encodeURIComponent(slug)}`;
}

function refreshSqlOutput() {
  ui.sqlOutput.value = buildUpsertSql(
    getSlugValue() || DEFAULT_SLUG,
    ui.publishedInput.checked,
    ui.configInput.value
  );
}

function parseEditorConfig() {
  try {
    return JSON.parse(ui.configInput.value);
  } catch (error) {
    return null;
  }
}

function getSelectedTemplateId() {
  return ui.templateSelect?.value || DEFAULT_TEMPLATE_ID;
}

function getTemplateIdFromConfig(config) {
  const templateId = config?.theme?.templateId || config?.meta?.templateName;
  return TEMPLATE_CATALOG.some((template) => template.id === templateId)
    ? templateId
    : DEFAULT_TEMPLATE_ID;
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
