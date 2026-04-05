import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRole } from "../generated/client/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";

export interface JwtPayload {
  email: string;
  authorities: string;
  userId?: number;
}

export const generateToken = (email: string, role: UserRole, userId?: number): string => {
  const payload: JwtPayload = {
    email,
    authorities: `ROLE_${role}`,
    userId,
  };

  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRATION as any });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
