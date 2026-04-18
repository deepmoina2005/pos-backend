import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRole } from "../generated/client/index.js";
import { normalizeRole, toAuthorities } from "./role.util.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";

export interface JwtPayload {
  email: string;
  authorities: string;
  role?: string;
  userId?: number;
  storeId?: number;
  branchId?: number;
}

export const generateToken = (email: string, role: UserRole, userId?: number): string => {
  const normalizedRole = normalizeRole(role) || "STORE_ADMIN";
  const payload: JwtPayload = {
    email,
    authorities: toAuthorities(normalizedRole) || "ROLE_STORE_ADMIN",
    role: normalizedRole,
    userId,
  };

  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRATION as any });
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  const normalizedRole =
    normalizeRoleFromPayload(decoded) ||
    normalizeRole(decoded.role) ||
    "STORE_ADMIN";

  return {
    ...decoded,
    role: normalizedRole,
    authorities: toAuthorities(normalizedRole) || "ROLE_STORE_ADMIN",
  };
};

const normalizeRoleFromPayload = (payload: JwtPayload): string | undefined => {
  if (!payload?.authorities) return undefined;
  const rawRole = payload.authorities.replace(/^ROLE_/i, "");
  return normalizeRole(rawRole);
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
