import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";

export const emitentesRouter = Router();

emitentesRouter.use(authRequired);

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeDocument(value: unknown) {
  return normalize(value).replace(/\D/g, "");
}

type CnpjPayload = any;

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "IGS-Automacao-Comercial/1.0",
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as CnpjPayload;
}

function mapCnpjPayload(data: CnpjPayload) {
  return {
    documento: normalize(data.cnpj ?? data.tax_id ?? data.document),
    razaoSocial: normalize(data.razao_social ?? data.nome ?? data.company?.legal_name),
    nomeFantasia: normalize(data.nome_fantasia ?? data.fantasia ?? data.alias),
    inscricaoEstadual: normalize(data.inscricao_estadual ?? data.ie ?? data.state_registration) || "Isento",
    inscricaoMunicipal: normalize(data.inscricao_municipal ?? data.im ?? data.city_registration),
    cnaePrincipal: `${normalize(data.cnae_fiscal ?? data.main_activity?.code ?? data.activity?.code)}${
      normalize(data.cnae_fiscal_descricao ?? data.main_activity?.text ?? data.activity?.description)
        ? ` - ${normalize(data.cnae_fiscal_descricao ?? data.main_activity?.text ?? data.activity?.description)}`
        : ""
    }`.trim(),
    email: normalize(data.email ?? data.emails?.[0]),
    telefone: normalize(data.ddd_telefone_1 ?? data.telefone ?? data.phone ?? data.phones?.[0]),
    cep: normalize(data.cep ?? data.zip ?? data.zipcode ?? data.address?.zip),
    logradouro: normalize(data.logradouro ?? data.street ?? data.address?.street),
    numero: normalize(data.numero ?? data.number ?? data.address?.number),
    complemento: normalize(data.complemento ?? data.address?.complement),
    bairro: normalize(data.bairro ?? data.neighborhood ?? data.district ?? data.address?.district),
    cidade: normalize(data.municipio ?? data.cidade ?? data.city ?? data.address?.city),
    estado: normalize(data.uf ?? data.estado ?? data.state ?? data.address?.state).toUpperCase(),
    regimeTributario: normalize(data.regime_tributario ?? data.regime ?? data.tax_regime),
  };
}

emitentesRouter.get("/", async (_req, res) => {
  const emitentes = await prisma.emitente.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res.json({ emitentes });
});

emitentesRouter.get("/consulta-cnpj", async (req, res) => {
  const cnpj = normalizeDocument(req.query.cnpj);

  if (!cnpj) {
    return res.status(400).json({ error: "cnpj e obrigatorio" });
  }

  const sources = [
    `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
    `https://www.receitaws.com.br/v1/cnpj/${cnpj}`,
  ];

  let data: CnpjPayload | null = null;
  for (const url of sources) {
    data = await fetchJson(url);
    if (data) break;
  }

  if (!data) {
    return res.status(404).json({ error: "CNPJ nao encontrado nas consultas" });
  }

  return res.json(mapCnpjPayload(data));
});

emitentesRouter.post("/", async (req, res) => {
  const {
    razaoSocial,
    nomeFantasia,
    documento,
    inscricaoEstadual,
    inscricaoMunicipal,
    regimeTributario,
    cnaePrincipal,
    email,
    telefone,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    logoDataUrl,
  } = req.body ?? {};

  if (!razaoSocial || !documento) {
    return res.status(400).json({ error: "razaoSocial e documento sao obrigatorios" });
  }

  const exists = await prisma.emitente.findUnique({ where: { documento } });
  if (exists) {
    return res.status(409).json({ error: "Emitente ja cadastrado" });
  }

  const emitente = await prisma.emitente.create({
    data: {
      razaoSocial,
      nomeFantasia,
      documento,
      inscricaoEstadual: inscricaoEstadual || null,
      inscricaoMunicipal: inscricaoMunicipal || null,
      regimeTributario: regimeTributario || null,
      cnaePrincipal: cnaePrincipal || null,
      email,
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      logoDataUrl: logoDataUrl || null,
    },
  });

  return res.status(201).json({ emitente });
});
