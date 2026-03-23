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

export type AttentionLevel = 'healthy' | 'watching' | 'warning' | 'critical' | 'resolved';
