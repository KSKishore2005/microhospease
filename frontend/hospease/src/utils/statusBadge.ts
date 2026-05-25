export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'purple';

export function statusBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    CLEAN: 'success', DIRTY: 'danger', INSPECTING: 'warning', OUT_OF_ORDER: 'gray', OCCUPIED: 'info',
    AVAILABLE: 'success', MAINTENANCE: 'warning', CLEANING: 'info',
    CONFIRMED: 'info', PENDING: 'warning', CHECKED_IN: 'success', CHECKED_OUT: 'gray', CANCELLED: 'danger',
    PAID: 'success', PARTIAL: 'warning', REFUNDED: 'gray', OVERDUE: 'danger',
    OPEN: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', RESOLVED: 'success', CLOSED: 'gray',
    ACTIVE: 'success', ON_LEAVE: 'warning', OFF_DUTY: 'gray', INACTIVE: 'gray',
    DELIVERED: 'success', PREPARING: 'warning', READY: 'info',
    APPROVED: 'success', REJECTED: 'danger', PROCESSED: 'success',
    GENERATED: 'success', FAILED: 'danger', PAUSED: 'warning', DISABLED: 'gray',
    HIGH: 'danger', MEDIUM: 'warning', LOW: 'gray', URGENT: 'danger',
    POSTED: 'success', VOIDED: 'gray',
    UNREAD: 'danger', READ: 'gray', REPLIED: 'info',
    EARN: 'success', REDEEM: 'info', EXPIRE: 'danger', BONUS: 'warning',
    SCHEDULED: 'info', SWAPPED: 'warning', ABSENT: 'danger',
    NO_SHOW: 'danger',
    FORWARDED_TO_MANAGER: 'info', STAFF_ASSIGNED: 'info',
    STAFF_COMPLETED: 'warning', MANAGER_VERIFIED: 'purple',
    UNPAID: 'danger',
  };
  return map[status] ?? 'default';
}
