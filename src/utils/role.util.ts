export const LEGACY_ROLE_MAP = {
  ADMIN: "STORE_ADMIN",
  STORE_MANAGER: "STORE_ADMIN",
  BRANCH_CASHIER: "CASHIER",
} as const;

export const SYSTEM_ROLES = [
  "SUPER_ADMIN",
  "STORE_ADMIN",
  "BRANCH_MANAGER",
  "CASHIER",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];
export type AppRole = SystemRole | "CUSTOMER";

export const normalizeRole = (role?: string | null): AppRole | undefined => {
  if (!role) return undefined;
  const upperRole = String(role).trim().toUpperCase();
  if (upperRole in LEGACY_ROLE_MAP) {
    return LEGACY_ROLE_MAP[upperRole as keyof typeof LEGACY_ROLE_MAP];
  }
  if (upperRole === "CUSTOMER") return "CUSTOMER";
  if (SYSTEM_ROLES.includes(upperRole as SystemRole)) {
    return upperRole as SystemRole;
  }
  return undefined;
};

export const normalizeRoleFromAuthorities = (
  authorities?: string | null
): AppRole | undefined => {
  if (!authorities) return undefined;
  const rawRole = authorities.replace(/^ROLE_/i, "");
  return normalizeRole(rawRole);
};

export const toAuthorities = (role?: string | null): string | undefined => {
  const normalized = normalizeRole(role);
  if (!normalized) return undefined;
  return `ROLE_${normalized}`;
};

export const normalizeRoleForStorage = (
  role?: string | null
): "SUPER_ADMIN" | "STORE_ADMIN" | "BRANCH_MANAGER" | "BRANCH_CASHIER" | "CUSTOMER" | undefined => {
  const normalized = normalizeRole(role);
  if (!normalized) return undefined;
  if (normalized === "CASHIER") return "BRANCH_CASHIER";
  return normalized;
};

export const buildDbRoleFilter = (
  role?: string | null
): ("SUPER_ADMIN" | "STORE_ADMIN" | "ADMIN" | "STORE_MANAGER" | "BRANCH_MANAGER" | "BRANCH_CASHIER" | "CUSTOMER")[] | undefined => {
  const normalized = normalizeRole(role);
  if (!normalized) return undefined;

  if (normalized === "STORE_ADMIN") {
    return ["STORE_ADMIN", "ADMIN", "STORE_MANAGER"];
  }
  if (normalized === "CASHIER") {
    return ["BRANCH_CASHIER"];
  }
  return [normalized];
};

export const getEffectiveRole = (user?: {
  role?: string | null;
  authorities?: string | null;
}): AppRole | undefined => {
  if (!user) return undefined;
  return normalizeRole(user.role || user.authorities?.replace(/^ROLE_/i, "") || undefined);
};
