const tokenKey = "igs_token";
let clientCache = [];

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setStatus(text) {
  const el = document.querySelector("[data-status]");
  if (el) {
    el.textContent = text;
  }
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Erro inesperado");
  }
  return data;
}

function requireAuth() {
  if (!getToken() && !document.querySelector("[data-login-page]")) {
    window.location.href = "/";
    return false;
  }
  return true;
}

function isAdminPage() {
  return Boolean(document.querySelector("[data-users-page]"));
}

function isClientsPage() {
  return Boolean(document.querySelector("[data-clients-page]"));
}

async function loadEmitentes() {
  const table = document.querySelector("[data-emitentes]");
  if (!table) return;

  try {
    const { emitentes } = await api("/emitentes");
    table.innerHTML = emitentes
      .map(
        (item) => `
          <tr>
            <td>${item.razaoSocial}</td>
            <td>${item.nomeFantasia ?? "-"}</td>
            <td>${item.documento}</td>
            <td>${item.cidade ?? "-"}</td>
            <td>${item.estado ?? "-"}</td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      localStorage.removeItem(tokenKey);
      window.location.href = "/";
      return;
    }
    setStatus(error.message);
  }
}

async function loadUsers() {
  const table = document.querySelector("[data-users]");
  if (!table) return;

  try {
    const { users } = await api("/users");
    table.innerHTML = users
      .map(
        (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.username}</td>
            <td>${item.email ?? "-"}</td>
            <td>${item.role}</td>
            <td>${item.active ? "Ativo" : "Inativo"}</td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    if (error.message === "Acesso negado") {
      setStatus("Acesso restrito ao administrador.");
      window.location.href = "/emitentes.html";
      return;
    }
    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      localStorage.removeItem(tokenKey);
      window.location.href = "/";
      return;
    }
    setStatus(error.message);
  }
}

async function loadClients(search = "") {
  const grid = document.querySelector("[data-clients-list]");
  const count = document.querySelector("[data-client-results-count]");
  const filter = document.querySelector("[data-client-filter]");
  if (!grid) return;

  try {
    const filterValue = filter instanceof HTMLSelectElement ? filter.value : "all";
    const suffix = search.trim()
      ? `?search=${encodeURIComponent(search.trim())}&filter=${encodeURIComponent(filterValue)}`
      : "";
    const { clientes } = await api(`/clientes${suffix}`);
    clientCache = clientes;

    if (count) count.textContent = `${clientes.length} cliente(s)`;

    grid.innerHTML = clientes
      .map(
        (item) => `
          <tr class="client-row ${item.ativo ? "" : "inactive"}" data-client-pick="${item.id}">
            <td>${item.cpfCnpj}</td>
            <td>${item.nomeRazao}</td>
            <td>${item.nomeFantasiaDocumento || "-"}</td>
            <td>${item.email ?? "-"}</td>
            <td>${item.cidade ?? "-"}</td>
            <td>${item.uf ?? "-"}</td>
            <td>${item.telefone ?? "-"}</td>
            <td><span class="client-state ${item.ativo ? "on" : "off"}">${item.ativo ? "Ativo" : "Inativo"}</span></td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      localStorage.removeItem(tokenKey);
      window.location.href = "/";
      return;
    }
    setStatus(error.message);
  }
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function setInputValue(form, selector, value) {
  const input = form.querySelector(selector);
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    input.value = value ?? "";
  }
}

function setEditMode(clientId) {
  const form = document.querySelector("[data-client-form]");
  const submitLabel = document.querySelector("[data-submit-label]");
  const inactivateButton = document.querySelector("[data-inactivate-client]");
  if (!(form instanceof HTMLFormElement)) return;

  const hidden = form.querySelector('input[name="cliente_id"]');
  if (hidden) hidden.value = clientId || "";
  if (submitLabel) submitLabel.textContent = clientId ? "Salvar alterações" : "Salvar cliente";
  if (inactivateButton instanceof HTMLButtonElement) inactivateButton.disabled = !clientId;
}

function buildClientJson(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const tipo = String(values.tipo_cliente || "PF").toUpperCase();

  if (tipo === "PJ") {
    return {
      tipo_cliente: "PJ",
      nome_razao: normalizeText(values.pj_razao_social),
      nome_fantasia_documento: normalizeText(values.pj_nome_fantasia),
      cpf_cnpj: normalizeText(values.pj_cnpj),
      inscricao_estadual: normalizeText(values.pj_inscricao_estadual) || "Isento",
      logradouro: normalizeText(values.pj_logradouro),
      numero: normalizeText(values.pj_numero),
      bairro: normalizeText(values.pj_bairro),
      cidade: normalizeText(values.pj_cidade),
      uf: normalizeText(values.pj_uf).toUpperCase(),
      cep: normalizeText(values.pj_cep),
      telefone: normalizeText(values.pj_telefone),
      email: normalizeText(values.pj_email),
      cnae_principal: normalizeText(values.pj_cnae_principal),
    };
  }

  return {
    tipo_cliente: "PF",
    nome_razao: normalizeText(values.pf_nome_completo),
    nome_fantasia_documento: normalizeText(values.pf_rg),
    cpf_cnpj: normalizeText(values.pf_cpf),
    inscricao_estadual: "Isento",
    logradouro: normalizeText(values.pf_logradouro),
    numero: normalizeText(values.pf_numero),
    bairro: normalizeText(values.pf_bairro),
    cidade: normalizeText(values.pf_cidade),
    uf: normalizeText(values.pf_uf).toUpperCase(),
    cep: normalizeText(values.pf_cep),
    telefone: normalizeText(values.pf_telefone),
    email: normalizeText(values.pf_email),
    cnae_principal: "",
  };
}

function renderClientJson(form) {
  const data = buildClientJson(form);
  return data;
}

function fillClientFields(data) {
  const form = document.querySelector("[data-client-form]");
  if (!(form instanceof HTMLFormElement)) return;

  const target = String(data.tipo_cliente || "PF").toUpperCase();
  const hidden = form.querySelector('input[name="tipo_cliente"]');
  if (hidden) hidden.value = target;

  if (target === "PJ") {
    form.querySelector('[data-client-tab="pj"]')?.dispatchEvent(new Event("click"));
    setInputValue(form, 'input[name="pj_razao_social"]', data.nome_razao);
    setInputValue(form, 'input[name="pj_nome_fantasia"]', data.nome_fantasia_documento);
    setInputValue(form, 'input[name="pj_cnpj"]', data.cpf_cnpj);
    setInputValue(form, 'input[name="pj_inscricao_estadual"]', data.inscricao_estadual);
    setInputValue(form, 'input[name="pj_cnae_principal"]', data.cnae_principal);
    setInputValue(form, 'input[name="pj_telefone"]', data.telefone);
    setInputValue(form, 'input[name="pj_email"]', data.email);
    setInputValue(form, 'input[name="pj_logradouro"]', data.logradouro);
    setInputValue(form, 'input[name="pj_numero"]', data.numero);
    setInputValue(form, 'input[name="pj_bairro"]', data.bairro);
    setInputValue(form, 'input[name="pj_cidade"]', data.cidade);
    setInputValue(form, 'input[name="pj_uf"]', data.uf);
    setInputValue(form, 'input[name="pj_cep"]', data.cep);
    renderClientJson(form);
    return;
  }

  setInputValue(form, 'input[name="pf_nome_completo"]', data.nome_razao);
  setInputValue(form, 'input[name="pf_cpf"]', data.cpf_cnpj);
  setInputValue(form, 'input[name="pf_rg"]', data.nome_fantasia_documento);
  setInputValue(form, 'input[name="pf_telefone"]', data.telefone);
  setInputValue(form, 'input[name="pf_email"]', data.email);
  setInputValue(form, 'input[name="pf_logradouro"]', data.logradouro);
  setInputValue(form, 'input[name="pf_numero"]', data.numero);
  setInputValue(form, 'input[name="pf_bairro"]', data.bairro);
  setInputValue(form, 'input[name="pf_cidade"]', data.cidade);
  setInputValue(form, 'input[name="pf_uf"]', data.uf);
  setInputValue(form, 'input[name="pf_cep"]', data.cep);
  renderClientJson(form);
}

function fillFormFromClient(client) {
  const form = document.querySelector("[data-client-form]");
  if (!(form instanceof HTMLFormElement)) return;

  const tipo = String(client.tipoCliente || "PF").toUpperCase();
  const tab = tipo === "PJ" ? "pj" : "pf";

  document.querySelector(`[data-client-tab="${tab}"]`)?.dispatchEvent(new Event("click"));

  setEditMode(client.id);

  const data = {
    tipo_cliente: tipo,
    nome_razao: client.nomeRazao ?? "",
    nome_fantasia_documento: client.nomeFantasiaDocumento ?? "",
    cpf_cnpj: client.cpfCnpj ?? "",
    inscricao_estadual: client.inscricaoEstadual ?? "",
    logradouro: client.logradouro ?? "",
    numero: client.numero ?? "",
    bairro: client.bairro ?? "",
    cidade: client.cidade ?? "",
    uf: client.uf ?? "",
    cep: client.cep ?? "",
    telefone: client.telefone ?? "",
    email: client.email ?? "",
    cnae_principal: client.cnaePrincipal ?? "",
  };

  if (tipo === "PJ") {
    setInputValue(form, 'input[name="pj_razao_social"]', data.nome_razao);
    setInputValue(form, 'input[name="pj_nome_fantasia"]', data.nome_fantasia_documento);
    setInputValue(form, 'input[name="pj_cnpj"]', data.cpf_cnpj);
    setInputValue(form, 'input[name="pj_inscricao_estadual"]', data.inscricao_estadual);
    setInputValue(form, 'input[name="pj_cnae_principal"]', data.cnae_principal);
    setInputValue(form, 'input[name="pj_telefone"]', data.telefone);
    setInputValue(form, 'input[name="pj_email"]', data.email);
    setInputValue(form, 'input[name="pj_logradouro"]', data.logradouro);
    setInputValue(form, 'input[name="pj_numero"]', data.numero);
    setInputValue(form, 'input[name="pj_bairro"]', data.bairro);
    setInputValue(form, 'input[name="pj_cidade"]', data.cidade);
    setInputValue(form, 'input[name="pj_uf"]', data.uf);
    setInputValue(form, 'input[name="pj_cep"]', data.cep);
  } else {
    setInputValue(form, 'input[name="pf_nome_completo"]', data.nome_razao);
    setInputValue(form, 'input[name="pf_cpf"]', data.cpf_cnpj);
    setInputValue(form, 'input[name="pf_rg"]', data.nome_fantasia_documento);
    setInputValue(form, 'input[name="pf_telefone"]', data.telefone);
    setInputValue(form, 'input[name="pf_email"]', data.email);
    setInputValue(form, 'input[name="pf_logradouro"]', data.logradouro);
    setInputValue(form, 'input[name="pf_numero"]', data.numero);
    setInputValue(form, 'input[name="pf_bairro"]', data.bairro);
    setInputValue(form, 'input[name="pf_cidade"]', data.cidade);
    setInputValue(form, 'input[name="pf_uf"]', data.uf);
    setInputValue(form, 'input[name="pf_cep"]', data.cep);
  }

  renderClientJson(form);
}

function clearClientForm() {
  const form = document.querySelector("[data-client-form]");
  if (!(form instanceof HTMLFormElement)) return;

  form.reset();
  const hidden = form.querySelector('input[name="tipo_cliente"]');
  if (hidden) hidden.value = "PF";
  setEditMode("");
  document.querySelector('[data-client-tab="pf"]')?.dispatchEvent(new Event("click"));
  renderClientJson(form);
}

function openClientModal() {
  const modal = document.querySelector("[data-client-modal]");
  const searchInput = document.querySelector("[data-client-search]");
  if (modal instanceof HTMLElement) {
    modal.hidden = false;
  }
  if (searchInput instanceof HTMLInputElement) {
    searchInput.focus();
    searchInput.select();
  }
}

function closeClientModal() {
  const modal = document.querySelector("[data-client-modal]");
  if (modal instanceof HTMLElement) {
    modal.hidden = true;
  }
}

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.matches("[data-login-form]")) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());

    try {
      const { token } = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      localStorage.setItem(tokenKey, token);
      window.location.href = "/dashboard.html";
    } catch (error) {
      setStatus(error.message);
    }
  }

  if (form.matches("[data-emitente-form]")) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());

    try {
      await api("/emitentes", {
        method: "POST",
        body: JSON.stringify(body),
      });
      form.reset();
      setStatus("Emitente cadastrado com sucesso.");
      await loadEmitentes();
    } catch (error) {
      setStatus(error.message);
    }
  }

  if (form.matches("[data-user-form]")) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify(body),
      });
      form.reset();
      setStatus("Usuario cadastrado com sucesso.");
      await loadUsers();
    } catch (error) {
      setStatus(error.message);
    }
  }

  if (form.matches("[data-client-form]")) {
    event.preventDefault();
    const data = renderClientJson(form);
    const hidden = form.querySelector('input[name="cliente_id"]');
    const clientId = hidden instanceof HTMLInputElement ? hidden.value.trim() : "";

    try {
      await api(clientId ? `/clientes/${clientId}` : "/clientes", {
        method: clientId ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      setStatus(clientId ? "Cliente alterado com sucesso." : "Cliente salvo com sucesso.");
      clearClientForm();
      const searchInput = document.querySelector("[data-client-search]");
      if (searchInput instanceof HTMLInputElement) {
        await loadClients(searchInput.value);
      }
    } catch (error) {
      setStatus(error.message);
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const loginPage = document.querySelector("[data-login-page]");
  if (loginPage && getToken()) {
    window.location.href = "/dashboard.html";
    return;
  }

  if (!requireAuth()) {
    return;
  }

  if (isAdminPage()) {
    loadUsers();
    return;
  }

  if (isClientsPage()) {
    const tabs = document.querySelectorAll("[data-client-tab]");
    const form = document.querySelector("[data-client-form]");
    const searchInput = document.querySelector("[data-client-search]");
    const filterInput = document.querySelector("[data-client-filter]");
    const consultButton = document.querySelector("[data-cnpj-consult]");
    const localizarButton = document.querySelector("[data-localizar]");
    const searchRunButton = document.querySelector("[data-client-search-run]");
    const newButtons = document.querySelectorAll("[data-new-client]");
    const inactivateButton = document.querySelector("[data-inactivate-client]");

    const activateTab = (target) => {
      const hidden = form?.querySelector('input[name="tipo_cliente"]');
      if (hidden && target) hidden.value = target === "pj" ? "PJ" : "PF";

      document.querySelectorAll("[data-client-tab]").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.remove("active"));

      document.querySelector(`[data-client-tab="${target}"]`)?.classList.add("active");
      document.querySelector(`[data-panel="${target}"]`)?.classList.add("active");
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-client-tab");
        activateTab(target);
      });
    });

    localizarButton?.addEventListener("click", () => {
      openClientModal();
    });

    searchRunButton?.addEventListener("click", () => {
      if (searchInput instanceof HTMLInputElement) {
        loadClients(searchInput.value);
      }
    });

    filterInput?.addEventListener("change", () => {
      if (searchInput instanceof HTMLInputElement && searchInput.value.trim()) {
        loadClients(searchInput.value);
      }
    });

    newButtons.forEach((button) => button.addEventListener("click", clearClientForm));

    if (inactivateButton instanceof HTMLButtonElement) {
      inactivateButton.addEventListener("click", async () => {
        const hidden = form?.querySelector('input[name="cliente_id"]');
        const clientId = hidden instanceof HTMLInputElement ? hidden.value.trim() : "";
        if (!clientId) {
          setStatus("Localize e selecione um cliente para inativar.");
          return;
        }

        try {
          await api(`/clientes/${clientId}/inativar`, { method: "PATCH" });
          setStatus("Cliente inativado com sucesso.");
          clearClientForm();
          if (searchInput instanceof HTMLInputElement && searchInput.value.trim()) {
            await loadClients(searchInput.value);
          }
        } catch (error) {
          setStatus(error.message);
        }
      });
    }

    consultButton?.addEventListener("click", async () => {
      const cnpjInput = form?.querySelector('input[name="pj_cnpj"]');
      const cnpj = cnpjInput instanceof HTMLInputElement ? cnpjInput.value : "";
      if (!cnpj.trim()) {
        setStatus("Informe um CNPJ para consultar.");
        return;
      }

      try {
        activateTab("pj");
        const data = await api(`/clientes/consulta-cnpj?cnpj=${encodeURIComponent(cnpj)}`);
        fillClientFields(data);
        setStatus("CNPJ consultado com sucesso.");
      } catch (error) {
        setStatus(error.message);
      }
    });

    document.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.hasAttribute("data-client-modal-close")) {
        closeClientModal();
        return;
      }

      const pickRow = target.closest("[data-client-pick]");
      const pickId = pickRow?.getAttribute("data-client-pick");
      if (pickId) {
        const client = clientCache.find((item) => item.id === pickId);
        if (client) {
          fillFormFromClient(client);
          closeClientModal();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeClientModal();
      }
    });

    if (form) renderClientJson(form);
    return;
  }

  loadEmitentes();
});
