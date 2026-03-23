export const StaffRole = {
  LINE_COOK: 'line_cook',
  HEAD_CHEF: 'head_chef',
  LOCATION_MANAGER: 'location_manager',
  ORG_OWNER: 'org_owner',
  CUSTOMER: 'customer',
  DELIVERY_PARTNER: 'delivery_partner',
  SUPPLIER: 'supplier',
  SUPPLIER_API: 'supplier_api',
  SYSTEM_ADMIN: 'system_admin',
} as const;

export type StaffRoleType = (typeof StaffRole)[keyof typeof StaffRole];

export const ROLE_HIERARCHY: Record<StaffRoleType, StaffRoleType[]> = {
  [StaffRole.SYSTEM_ADMIN]: [
    StaffRole.ORG_OWNER,
    StaffRole.LOCATION_MANAGER,
    StaffRole.HEAD_CHEF,
    StaffRole.LINE_COOK,
    StaffRole.CUSTOMER,
    StaffRole.DELIVERY_PARTNER,
    StaffRole.SUPPLIER,
    StaffRole.SUPPLIER_API,
  ],
  [StaffRole.ORG_OWNER]: [
    StaffRole.LOCATION_MANAGER,
    StaffRole.HEAD_CHEF,
    StaffRole.LINE_COOK,
  ],
  [StaffRole.LOCATION_MANAGER]: [StaffRole.HEAD_CHEF, StaffRole.LINE_COOK],
  [StaffRole.HEAD_CHEF]: [StaffRole.LINE_COOK],
  [StaffRole.LINE_COOK]: [],
  [StaffRole.CUSTOMER]: [],
  [StaffRole.DELIVERY_PARTNER]: [],
  [StaffRole.SUPPLIER]: [StaffRole.SUPPLIER_API],
  [StaffRole.SUPPLIER_API]: [],
};

export function hasRole(
  userRole: StaffRoleType,
  requiredRoles: StaffRoleType[],
): boolean {
  if (requiredRoles.includes(userRole)) return true;
  const inherited = ROLE_HIERARCHY[userRole] ?? [];
  return requiredRoles.some((r) => inherited.includes(r));
}
