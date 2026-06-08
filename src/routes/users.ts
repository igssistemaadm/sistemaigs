import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";
import { hashPassword } from "../lib/auth.js";

export const usersRouter = Router();

usersRouter.use(authRequired);

function isAdmin(role: string) {
  return role === UserRole.ADMIN;
}

function normalizeUsername(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

usersRouter.get("/", async (req, res) => {
  if (!isAdmin(req.user!.role)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

  return res.json({ users });
});

usersRouter.post("/", async (req, res) => {
  if (!isAdmin(req.user!.role)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const { name, username, email, password, role } = req.body ?? {};

  if (!name || !username || !password) {
    return res.status(400).json({ error: "name, username e password sao obrigatorios" });
  }

  const normalizedUsername = normalizeUsername(username);
  const exists = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizedUsername,
        mode: "insensitive",
      },
    },
  });

  if (exists) {
    return res.status(409).json({ error: "Usuario ja cadastrado" });
  }

  const user = await prisma.user.create({
    data: {
      name,
      username: normalizedUsername,
      email: email || null,
      passwordHash: await hashPassword(password),
      role: Object.values(UserRole).includes(role) ? role : UserRole.USER,
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

  return res.status(201).json({ user });
});
