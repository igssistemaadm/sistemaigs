import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { clientesRouter } from "./routes/clientes.js";
import { emitentesRouter } from "./routes/emitentes.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
app.use(express.json());
app.use(express.static(path.resolve("public")));

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/clientes", clientesRouter);
app.use("/emitentes", emitentesRouter);
app.use("/users", usersRouter);

app.get("/logo.png", (_req, res) => {
  res.sendFile(path.resolve("logo.png"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.resolve("public", "index.html"));
});
