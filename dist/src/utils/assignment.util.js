import { getEffectiveRole } from "./role.util.js";
export const hasValidStoreAssignment = (user) => {
    return Boolean(user?.storeId);
};
export const hasValidBranchAssignment = (user) => {
    return Boolean(user?.storeId && user?.branchId);
};
export const isOrphanUser = (user) => {
    const role = getEffectiveRole(user);
    if (!role || role === "SUPER_ADMIN" || role === "CUSTOMER")
        return false;
    if (role === "STORE_ADMIN") {
        return !hasValidStoreAssignment(user);
    }
    if (role === "BRANCH_MANAGER" || role === "CASHIER") {
        return !hasValidBranchAssignment(user);
    }
    return false;
};
export const ensureActiveAssignment = (user) => {
    const role = getEffectiveRole(user);
    if (!role || role === "SUPER_ADMIN" || role === "CUSTOMER") {
        return { ok: true };
    }
    if (role === "STORE_ADMIN" && !hasValidStoreAssignment(user)) {
        return {
            ok: false,
            message: "Your account is not assigned to an active store.",
        };
    }
    if ((role === "BRANCH_MANAGER" || role === "CASHIER") && !hasValidStoreAssignment(user)) {
        return {
            ok: false,
            message: "Your account is not assigned to an active store.",
        };
    }
    if ((role === "BRANCH_MANAGER" || role === "CASHIER") && !user?.branchId) {
        return {
            ok: false,
            message: "Your branch assignment is missing. Please contact administrator.",
        };
    }
    return { ok: true };
};
