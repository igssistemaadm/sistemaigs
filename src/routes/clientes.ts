import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";

export const clientesRouter = Router();

clientesRouter.use(authRequired);

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

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as CnpjPayload;
}

function mapCnpjPayload(data: CnpjPayload) {
  const razaoSocial = normalize(data.razao_social ?? data.nome ?? data.company?.legal_name);
  const nomeFantasia = normalize(data.nome_fantasia ?? data.fantasia ?? data.alias);
  const cnpj = normalize(data.cnpj ?? data.tax_id ?? data.document);
  const inscricaoEstadual = normalize(data.inscricao_estadual ?? data.ie ?? data.state_registration);
  const logradouro = normalize(data.logradouro ?? data.street ?? data.address?.street);
  const numero = normalize(data.numero ?? data.number ?? data.address?.number);
  const bairro = normalize(data.bairro ?? data.neighborhood ?? data.district ?? data.address?.district);
  const cidade = normalize(data.municipio ?? data.cidade ?? data.city ?? data.address?.city);
  const uf = normalize(data.uf ?? data.estado ?? data.state ?? data.address?.state).toUpperCase();
  const cep = normalize(data.cep ?? data.zip ?? data.zipcode ?? data.address?.zip);
  const telefone = normalize(data.ddd_telefone_1 ?? data.telefone ?? data.phone ?? data.phones?.[0]);
  const email = normalize(data.email ?? data.emails?.[0]);
  const cnae = normalize(data.cnae_fiscal ?? data.main_activity?.code ?? data.activity?.code);
  const cnaeDescricao = normalize(data.cnae_fiscal_descricao ?? data.main_activity?.text ?? data.activity?.description);

  return {
    tipo_cliente: "PJ",
    nome_razao: razaoSocial,
    nome_fantasia_documento: nomeFantasia,
    cpf_cnpj: cnpj,
    inscricao_estadual: inscricaoEstadual || "Isento",
    logradouro,
    numero,
    bairro,
    cidade,
    uf,
    cep,
    telefone,
    email,
    cnae_principal: [cnae, cnaeDescricao].filter(Boolean).join(" - "),
  };
}

clientesRouter.get("/", async (req, res) => {
  const search = normalize(req.query.search);
  const filter = normalize(req.query.filter).toLowerCase();

  const byName = filter === "nome" || filter === "all" || !filter;
  const byDocument = filter === "documento" || filter === "all" || !filter;

  const clientes = await prisma.cliente.findMany({
    where: search
      ? {
          OR: [
                ...(byName
              ? [
                  { nomeRazao: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  { nomeFantasiaDocumento: { contains: search, mode: Prisma.QueryMode.insensitive } },
                ]
              : []),
            ...(byDocument ? [{ cpfCnpj: { contains: normalizeDocument(search) } }] : []),
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return res.json({ clientes });
});

clientesRouter.post("/", async (req, res) => {
  const body = req.body ?? {};
  const cpfCnpj = normalizeDocument(body.cpf_cnpj);

  if (!body.tipo_cliente || !body.nome_razao || !cpfCnpj) {
    return res.status(400).json({ error: "tipo_cliente, nome_razao e cpf_cnpj sao obrigatorios" });
  }

  const exists = await prisma.cliente.findUnique({ where: { cpfCnpj } });
  if (exists) {
    return res.status(409).json({ error: "Cliente ja cadastrado" });
  }

  const cliente = await prisma.cliente.create({
    data: {
      tipoCliente: String(body.tipo_cliente).toUpperCase(),
      nomeRazao: normalize(body.nome_razao),
      nomeFantasiaDocumento: normalize(body.nome_fantasia_documento),
      cpfCnpj,
      inscricaoEstadual: normalize(body.inscricao_estadual) || null,
      logradouro: normalize(body.logradouro) || null,
      numero: normalize(body.numero) || null,
      bairro: normalize(body.bairro) || null,
      cidade: normalize(body.cidade) || null,
      uf: normalize(body.uf).toUpperCase() || null,
      cep: normalize(body.cep) || null,
      telefone: normalize(body.telefone) || null,
      email: normalize(body.email) || null,
      cnaePrincipal: normalize(body.cnae_principal) || null,
    },
  });

  return res.status(201).json({ cliente });
});

clientesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const cpfCnpj = normalizeDocument(body.cpf_cnpj);

  if (!body.tipo_cliente || !body.nome_razao || !cpfCnpj) {
    return res.status(400).json({ error: "tipo_cliente, nome_razao e cpf_cnpj sao obrigatorios" });
  }

  const current = await prisma.cliente.findUnique({ where: { id } });
  if (!current) {
    return res.status(404).json({ error: "Cliente nao encontrado" });
  }

  const exists = await prisma.cliente.findFirst({
    where: {
      cpfCnpj,
      NOT: { id },
    },
  });
  if (exists) {
    return res.status(409).json({ error: "Cliente ja cadastrado" });
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      tipoCliente: String(body.tipo_cliente).toUpperCase(),
      nomeRazao: normalize(body.nome_razao),
      nomeFantasiaDocumento: normalize(body.nome_fantasia_documento),
      cpfCnpj,
      inscricaoEstadual: normalize(body.inscricao_estadual) || null,
      logradouro: normalize(body.logradouro) || null,
      numero: normalize(body.numero) || null,
      bairro: normalize(body.bairro) || null,
      cidade: normalize(body.cidade) || null,
      uf: normalize(body.uf).toUpperCase() || null,
      cep: normalize(body.cep) || null,
      telefone: normalize(body.telefone) || null,
      email: normalize(body.email) || null,
      cnaePrincipal: normalize(body.cnae_principal) || null,
    },
  });

  return res.json({ cliente });
});

clientesRouter.patch("/:id/inativar", async (req, res) => {
  const { id } = req.params;

  const current = await prisma.cliente.findUnique({ where: { id } });
  if (!current) {
    return res.status(404).json({ error: "Cliente nao encontrado" });
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: { ativo: false },
  });

  return res.json({ cliente });
});

clientesRouter.get("/consulta-cnpj", async (req, res) => {
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
