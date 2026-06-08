import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, signToken, verifyPassword } from "../lib/auth.js";
import { authRequired } from "../middleware/auth.js";

export const authRouter = Router();

function normalizeUsername(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

authRouter.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body ?? {};

  if (!name || !username || !password) {
    return res.status(400).json({ error: "name, username e password sao obrigatorios" });
  }

  const normalizedUsername = normalizeUsername(username);

  const exists = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (exists) {
    return res.status(409).json({ error: "Usuario ja cadastrado" });
  }

  const user = await prisma.user.create({
    data: {
      name,
      username: normalizedUsername,
      email: email || null,
      passwordHash: await hashPassword(password),
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  const token = signToken({ sub: user.id, role: String(user.role), username: user.username });

  return res.status(201).json({ user, token });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "username e password sao obrigatorios" });
  }

  const normalizedUsername = normalizeUsername(username);
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizedUsername,
        mode: "insensitive",
      },
    },
  });
  if (!user || !user.active) {
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  const token = signToken({ sub: user.id, role: user.role, username: user.username });

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
    },
    token,
  });
});

authRouter.get("/me", authRequired, async (req: any, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "Usuario nao encontrado" });
  }

  return res.json({ user });
});
