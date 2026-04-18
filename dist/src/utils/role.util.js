export const LEGACY_ROLE_MAP = {
    ADMIN: "STORE_ADMIN",
    STORE_MANAGER: "STORE_ADMIN",
    BRANCH_CASHIER: "CASHIER",
};
export const SYSTEM_ROLES = [
    "SUPER_ADMIN",
    "STORE_ADMIN",
    "BRANCH_MANAGER",
    "CASHIER",
];
export const normalizeRole = (role) => {
    if (!role)
        return undefined;
    const upperRole = String(role).trim().toUpperCase();
    if (upperRole in LEGACY_ROLE_MAP) {
        return LEGACY_ROLE_MAP[upperRole];
    }
    if (upperRole === "CUSTOMER")
        return "CUSTOMER";
    if (SYSTEM_ROLES.includes(upperRole)) {
        return upperRole;
    }
    return undefined;
};
export const normalizeRoleFromAuthorities = (authorities) => {
    if (!authorities)
        return undefined;
    const rawRole = authorities.replace(/^ROLE_/i, "");
    return normalizeRole(rawRole);
};
export const toAuthorities = (role) => {
    const normalized = normalizeRole(role);
    if (!normalized)
        return undefined;
    return `ROLE_${normalized}`;
};
export const normalizeRoleForStorage = (role) => {
    const normalized = normalizeRole(role);
    if (!normalized)
        return undefined;
    if (normalized === "CASHIER")
        return "BRANCH_CASHIER";
    return normalized;
};
export const buildDbRoleFilter = (role) => {
    const normalized = normalizeRole(role);
    if (!normalized)
        return undefined;
    if (normalized === "STORE_ADMIN") {
        return ["STORE_ADMIN", "ADMIN", "STORE_MANAGER"];
    }
    if (normalized === "CASHIER") {
        return ["BRANCH_CASHIER"];
    }
    return [normalized];
};
export const getEffectiveRole = (user) => {
    if (!user)
        return undefined;
    return normalizeRole(user.role || user.authorities?.replace(/^ROLE_/i, "") || undefined);
};
