/**
 * Core domain types shared across all packages.
 */

export type OrderStatus = 'received' | 'preparing' | 'plating' | 'served' | 'completed';

export type StationStatus = 'ready' | 'active' | 'warning' | 'critical';

export type SubscriptionTier = 'indie' | 'growth' | 'enterprise';

export type UserRole =
  | 'line_cook'
  | 'head_chef'
  | 'location_manager'
  | 'org_owner'
  | 'customer'
  | 'delivery_partner'
  | 'supplier'
  | 'supplier_api'
  | 'system_admin';

export type SupplierOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered';

export interface TierLimits {
  maxLocations: number;
  maxStaff: number;
  supplierApi: boolean;
  supplierPortal: boolean;
  sso: boolean;
}

export type TierFeature =
  | 'SUPPLIER_API'
  | 'SUPPLIER_PORTAL'
  | 'SSO'
  | 'UNLIMITED_LOCATIONS'
  | 'UNLIMITED_STAFF';

export type AttentionLevel = 'healthy' | 'watching' | 'warning' | 'critical' | 'resolved';

export type StaffRole = UserRole;

// Database entity types (matching Drizzle schema)

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: SubscriptionTier;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NewOrganization {
  name: string;
  slug: string;
  subscription_tier?: SubscriptionTier;
  is_active?: boolean;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  timezone: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NewLocation {
  organization_id: string;
  name: string;
  address?: string | null;
  timezone?: string;
  is_active?: boolean;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NewUser {
  email: string;
  display_name: string;
  is_active?: boolean;
}

export interface Staff {
  id: string;
  user_id: string;
  tenant_id: string;
  role: StaffRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NewStaff {
  user_id: string;
  tenant_id: string;
  role: StaffRole;
  is_active?: boolean;
}
