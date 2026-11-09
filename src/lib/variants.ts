import type { VariantGroup, VariantOption } from '@/lib/api';

/** Option ids are optional on unsaved data, so fall back to the index. */
export const optionKey = (option: VariantOption, index: number) => option._id || `idx-${index}`;
export const groupKey = (group: VariantGroup, index: number) => group._id || `idx-${index}`;

const hasOptions = (groups?: VariantGroup[]) => (groups || []).filter((g) => g.options?.length > 0);

export const getReplaceGroup = (groups?: VariantGroup[]) =>
  hasOptions(groups).find((g) => g.pricingType === 'replace');

export const hasVariants = (groups?: VariantGroup[]) => hasOptions(groups).length > 0;

/** Lowest / highest price for the price-setting group (available options only, if any). */
export const getPriceRange = (basePrice: number, groups?: VariantGroup[]) => {
  const replaceGroup = getReplaceGroup(groups);
  if (!replaceGroup) return { min: basePrice, max: basePrice, varies: false };
  const available = replaceGroup.options.filter((o) => o.isAvailable !== false);
  const prices = (available.length ? available : replaceGroup.options).map((o) => Number(o.price) || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, varies: min !== max };
};

/** Map of groupKey → optionKey for the default (or first available) option of each group. */
export const getDefaultSelection = (groups?: VariantGroup[]) => {
  const selection: Record<string, string> = {};
  (groups || []).forEach((group, gi) => {
    if (!group.options?.length) return;
    let idx = group.options.findIndex((o) => o.isDefault && o.isAvailable !== false);
    if (idx === -1) idx = group.options.findIndex((o) => o.isAvailable !== false);
    if (idx === -1) return;
    selection[groupKey(group, gi)] = optionKey(group.options[idx], idx);
  });
  return selection;
};

/** Price for a particular combination of selected options. */
export const computeVariantPrice = (
  basePrice: number,
  groups: VariantGroup[] | undefined,
  selection: Record<string, string>
) => {
  let price = basePrice;
  let extra = 0;
  (groups || []).forEach((group, gi) => {
    const selectedKey = selection[groupKey(group, gi)];
    const option = group.options?.find((o, oi) => optionKey(o, oi) === selectedKey);
    if (!option) return;
    if (group.pricingType === 'replace') price = Number(option.price) || 0;
    else extra += Number(option.price) || 0;
  });
  return price + extra;
};

export const formatPrice = (value: number) =>
  Number.isInteger(value) ? `₹${value}` : `₹${value.toFixed(2)}`;

/** Client-side check mirroring the backend rules. Returns an error message or null. */
export function validateVariantGroups(groups: VariantGroup[] = []): string | null {
  let replaceCount = 0;
  for (const group of groups) {
    const named = group.options.filter((o) => o.name.trim());
    if (!group.name.trim() && named.length === 0) continue;
    if (!group.name.trim()) return 'Every variation group needs a name (e.g. "Size").';
    if (named.length === 0) return `Add at least one option to "${group.name}".`;
    if (named.some((o) => o.price === ('' as unknown as number) || Number.isNaN(Number(o.price)) || Number(o.price) < 0)) {
      return `Enter a valid price for every option in "${group.name}".`;
    }
    if (group.pricingType === 'replace') replaceCount += 1;
  }
  if (replaceCount > 1) return 'Only one variation group can set the item price.';
  return null;
}
