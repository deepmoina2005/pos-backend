import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { normalizeRole, toAuthorities } from "./role.util.js";
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";
export const generateToken = (email, role, userId) => {
    const normalizedRole = normalizeRole(role) || "STORE_ADMIN";
    const payload = {
        email,
        authorities: toAuthorities(normalizedRole) || "ROLE_STORE_ADMIN",
        role: normalizedRole,
        userId,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};
export const verifyToken = (token) => {
    const decoded = jwt.verify(token, JWT_SECRET);
    const normalizedRole = normalizeRoleFromPayload(decoded) ||
        normalizeRole(decoded.role) ||
        "STORE_ADMIN";
    return {
        ...decoded,
        role: normalizedRole,
        authorities: toAuthorities(normalizedRole) || "ROLE_STORE_ADMIN",
    };
};
const normalizeRoleFromPayload = (payload) => {
    if (!payload?.authorities)
        return undefined;
    const rawRole = payload.authorities.replace(/^ROLE_/i, "");
    return normalizeRole(rawRole);
};
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
