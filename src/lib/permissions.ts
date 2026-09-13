export const PERMISSIONS = [
  "dashboard.view", "products.view", "products.create", "products.edit", "products.archive", "products.delete",
  "prices.view", "prices.edit", "stock.view", "stock.edit", "images.manage",
  "models.view", "models.create", "models.edit", "models.delete", "models.manage", "brands.manage", "categories.manage",
  "content.manage", "seo.manage", "promotions.manage", "stores.view", "stores.manage", "messages.manage",
  "users.view", "users.create", "users.edit", "users.delete", "roles.manage", "settings.manage", "settings.critical", "audit.view",
  "orders.view", "orders.edit", "payments.manage",
] as const;
export type Permission = typeof PERMISSIONS[number];
export type StaffRole = "SUPER_ADMIN" | "ADMIN" | "GESTIONNAIRE" | "COMMERCIAL" | "MARKETING" | "DEVELOPER";
export const ROLE_LABELS: Record<StaffRole,string> = { SUPER_ADMIN: "Super administrateur", ADMIN: "Administrateur", GESTIONNAIRE: "Gestionnaire", COMMERCIAL: "Commercial", MARKETING: "Marketing", DEVELOPER: "Développeur (historique)" };
export const DEFAULT_PERMISSIONS: Record<StaffRole,readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  DEVELOPER: PERMISSIONS,
  ADMIN: PERMISSIONS.filter((p) => !["roles.manage", "settings.critical", "payments.manage"].includes(p)),
  GESTIONNAIRE: ["dashboard.view", "products.view", "products.create", "products.edit", "products.archive", "prices.view", "prices.edit", "stock.view", "stock.edit", "images.manage", "models.view", "models.create", "models.edit", "models.manage", "brands.manage", "categories.manage", "promotions.manage", "stores.view", "orders.view", "orders.edit", "audit.view"],
  COMMERCIAL: ["dashboard.view", "products.view", "products.create", "products.edit", "prices.view", "prices.edit", "stock.view", "stock.edit", "images.manage", "models.view", "models.create", "models.edit", "models.manage"],
  MARKETING: ["dashboard.view", "products.view", "products.edit", "models.view", "images.manage", "content.manage", "seo.manage"],
};
export type PermissionUser = { role: string; permissions?: readonly string[] };
export function isSystemAdmin(user: PermissionUser) { return user.role === "SUPER_ADMIN" || user.role === "DEVELOPER"; }
export function can(user: PermissionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (isSystemAdmin(user)) return true;
  const permissions = user.permissions ?? DEFAULT_PERMISSIONS[user.role as StaffRole] ?? [];
  if (permission === "models.view" || permission === "models.create" || permission === "models.edit") {
    return permissions.includes(permission) || permissions.includes("models.manage");
  }
  if (permission === "models.manage") {
    return permissions.includes(permission) || permissions.includes("models.edit");
  }
  return permissions.includes(permission);
}
export function resolvePermissions(role: StaffRole, policy?: readonly string[] | null, overrides?: unknown): Permission[] {
  if (isSystemAdmin({role})) return [...PERMISSIONS];
  const set = new Set<string>(policy ?? DEFAULT_PERMISSIONS[role] ?? []);
  if (overrides && typeof overrides === "object" && !Array.isArray(overrides)) {
    for (const [key, value] of Object.entries(overrides)) if (PERMISSIONS.includes(key as Permission)) { if (value === true) set.add(key); else if (value === false) set.delete(key); }
  }
  return PERMISSIONS.filter((p) => set.has(p));
}
