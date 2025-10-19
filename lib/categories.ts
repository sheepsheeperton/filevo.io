export type CategoryKey = 'all' | 'onboarding' | 'maintenance' | 'audit';

export interface RequestLike {
  id: string;
  title: string;
  description?: string;
  request_items?: Array<{
    id: string;
    tag: string;
    status: string;
  }>;
  property_id?: string;
  due_date?: string;
  created_at?: string;
}

export function inferCategoryFromRequest(r: RequestLike): CategoryKey {
  // Use EXISTING fields like r.title, r.description, r.request_items[].tag
  // NEVER writes to DB; purely cosmetic classification
  const s = JSON.stringify(r).toLowerCase();

  const isOnboarding =
    /onboard|renewal|lease|drivers?[\s_-]?license|id|insurance|proof|tenant|move[\s_-]?in|application/.test(s);

  const isMaintenance =
    /maint(enance)?|vendor|invoice|receipt|work[\s_-]?order|repair|photo|service|contractor|plumb|electr|hvac|cleaning/.test(s);

  const isAudit =
    /audit|owner(ship)?|account(ing)?|rent[\s_-]?roll|w[-\s]?9|1099|packet|export|financial|tax|report|statement/.test(s);

  if (isOnboarding && !(isMaintenance || isAudit)) return 'onboarding';
  if (isMaintenance && !(isOnboarding || isAudit)) return 'maintenance';
  if (isAudit && !(isOnboarding || isMaintenance)) return 'audit';

  // If multiple match, prioritize by display route contexts; safe default 'onboarding'
  if (isOnboarding) return 'onboarding';
  if (isMaintenance) return 'maintenance';
  if (isAudit) return 'audit';
  return 'all';
}

export function getCategoryLabel(key: CategoryKey): string {
  switch (key) {
    case 'all':
      return 'All';
    case 'onboarding':
      return 'Onboarding & Renewals';
    case 'maintenance':
      return 'Maintenance & Vendor Receipts';
    case 'audit':
      return 'Ownership / Accounting / Audit';
    default:
      return 'All';
  }
}

export function getCategoryDescription(key: CategoryKey): string {
  switch (key) {
    case 'onboarding':
      return 'Collect ID, lease, and insurance docs without email ping-pong.';
    case 'maintenance':
      return 'Request and file vendor invoices and repair photos in one link.';
    case 'audit':
      return 'Bundle rent rolls, receipts, and insurance for owners or accountants.';
    default:
      return '';
  }
}

export function getCategoryColor(key: CategoryKey): string {
  switch (key) {
    case 'onboarding':
      return 'teal';
    case 'maintenance':
      return 'amber';
    case 'audit':
      return 'violet';
    default:
      return 'gray';
  }
}
