export const statusBadgeClass: Record<string, string> = {
  draft: 'badge-neutral',
  submitted: 'badge-info',
  pending_review: 'badge-warning',
  pending_approval: 'badge-warning',
  changes_requested: 'badge-warning',
  rejected: 'badge-error',
  approved: 'badge-success',
  cancelled: 'badge-neutral',
};

export const statusLabel = (status: string) => status.replace(/_/g, ' ');

export const priorityClass: Record<string, string> = {
  normal: 'text-gray-500',
  high: 'text-orange-500 font-medium',
  urgent: 'text-red-500 font-semibold',
};

export const avatarColor = (name?: string) => {
  const colors = [
    'bg-accent text-charcoal',
    'bg-charcoal text-white',
    'bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
};
