import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";

export const emitentesRouter = Router();

emitentesRouter.use(authRequired);

emitentesRouter.get("/", async (_req, res) => {
  const emitentes = await prisma.emitente.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res.json({ emitentes });
});

emitentesRouter.post("/", async (req, res) => {
  const {
    razaoSocial,
    nomeFantasia,
    documento,
    email,
    telefone,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
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
      email,
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    },
  });

  return res.status(201).json({ emitente });
});
