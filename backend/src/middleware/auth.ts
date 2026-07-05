import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthedRequestUser } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthedRequest extends Request {
  user?: AuthedRequestUser;
}

// Required auth: rejects the request if there's no valid token.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  try {
    const token = header.slice("Bearer ".length);
    req.user = jwt.verify(token, JWT_SECRET) as AuthedRequestUser;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional auth: attaches user if present, but never blocks the request.
// Useful for read routes where logged-in users see extra data (e.g. "did I react?").
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice("Bearer ".length), JWT_SECRET) as AuthedRequestUser;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function signToken(user: AuthedRequestUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}
