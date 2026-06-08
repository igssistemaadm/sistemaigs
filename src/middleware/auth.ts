import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

export type AuthUser = {
  userId: string;
  role: string;
  username: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    req.user = {
      userId: String(decoded.sub),
      role: String(decoded.role),
      username: String(decoded.username),
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
