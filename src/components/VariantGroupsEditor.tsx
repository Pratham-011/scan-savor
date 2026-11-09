import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Star, Layers } from 'lucide-react';
import type { VariantGroup, VariantOption, VariantPricingType } from '@/lib/api';
import { cn } from '@/lib/utils';

const tempId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

const newOption = (partial: Partial<VariantOption> = {}): VariantOption => ({
  _id: tempId(),
  name: '',
  description: '',
  price: '' as unknown as number,
  isDefault: false,
  isAvailable: true,
  ...partial,
});

// Quick-start templates. Purely a convenience — every field stays editable.
const PRESETS: Array<{ label: string; group: Omit<VariantGroup, '_id'> }> = [
  {
    label: 'Size',
    group: {
      name: 'Size',
      pricingType: 'replace',
      options: [
        { name: 'Small', description: '', price: '' as unknown as number, isDefault: true },
        { name: 'Medium', description: '', price: '' as unknown as number },
        { name: 'Large', description: '', price: '' as unknown as number },
      ],
    },
  },
  {
    label: 'Portion',
    group: {
      name: 'Portion',
      pricingType: 'replace',
      options: [
        { name: 'Half', description: '', price: '' as unknown as number, isDefault: true },
        { name: 'Full', description: '', price: '' as unknown as number },
      ],
    },
  },
  {
    label: 'Quantity',
    group: {
      name: 'Quantity',
      pricingType: 'replace',
      options: [
        { name: 'Regular', description: '', price: '' as unknown as number, isDefault: true },
        { name: 'Large', description: '', price: '' as unknown as number },
      ],
    },
  },
  {
    label: 'Extra choice',
    group: {
      name: '',
      pricingType: 'addon',
      options: [
        { name: '', description: '', price: 0, isDefault: true },
        { name: '', description: '', price: '' as unknown as number },
      ],
    },
  },
];

interface Props {
  value: VariantGroup[];
  onChange: (groups: VariantGroup[]) => void;
}

export function VariantGroupsEditor({ value, onChange }: Props) {
  const groups = value || [];
  const replaceIndex = groups.findIndex((g) => g.pricingType === 'replace');

  const updateGroup = (gi: number, patch: Partial<VariantGroup>) =>
    onChange(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const updateOption = (gi: number, oi: number, patch: Partial<VariantOption>) =>
    updateGroup(gi, {
      options: groups[gi].options.map((o, i) => (i === oi ? { ...o, ...patch } : o)),
    });

  const setDefaultOption = (gi: number, oi: number) =>
    updateGroup(gi, {
      options: groups[gi].options.map((o, i) => ({ ...o, isDefault: i === oi })),
    });

  const removeOption = (gi: number, oi: number) => {
    const remaining = groups[gi].options.filter((_, i) => i !== oi);
    if (remaining.length && !remaining.some((o) => o.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
    updateGroup(gi, { options: remaining });
  };

  const addGroup = (template?: Omit<VariantGroup, '_id'>) => {
    const pricingType: VariantPricingType =
      replaceIndex !== -1 ? 'addon' : template?.pricingType || 'replace';
    const group: VariantGroup = template
      ? {
          _id: tempId(),
          name: template.name,
          pricingType,
          options: template.options.map((o) => newOption(o)),
        }
      : {
          _id: tempId(),
          name: '',
          pricingType,
          options: [newOption({ isDefault: true }), newOption()],
        };
    onChange([...groups, group]);
  };

  return (
    <div className="space-y-3">
      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <Layers className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Offer this item in different sizes, portions or styles — e.g. Pizza: Small (6 inch), Medium (9 inch).
          </p>
        </div>
      )}

      {groups.map((group, gi) => {
        const isPriceSetter = group.pricingType === 'replace';
        const replaceTakenByOther = replaceIndex !== -1 && replaceIndex !== gi;
        return (
          <div key={group._id || gi} className="space-y-3 rounded-lg border bg-secondary/30 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={group.name}
                onChange={(e) => updateGroup(gi, { name: e.target.value })}
                placeholder="Group name (e.g. Size, Crust)"
                className="sm:flex-1"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={group.pricingType}
                  onValueChange={(v) => updateGroup(gi, { pricingType: v as VariantPricingType })}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace" disabled={replaceTakenByOther}>
                      Sets item price
                    </SelectItem>
                    <SelectItem value="addon">Adds to price</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => onChange(groups.filter((_, i) => i !== gi))}
                  title="Remove group"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {isPriceSetter
                ? 'Each option has its own full price (e.g. Small ₹199, Large ₹499).'
                : 'Option price is added to the item price (use 0 for no extra charge).'}
            </p>

            <div className="space-y-2">
              {group.options.map((option, oi) => (
                <div
                  key={option._id || oi}
                  className={cn(
                    'grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md bg-background p-2 sm:grid-cols-[auto_1fr_1fr_6rem_auto_auto]',
                    option.isAvailable === false && 'opacity-60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setDefaultOption(gi, oi)}
                    title={option.isDefault ? 'Default option' : 'Make default'}
                    className="p-1"
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        option.isDefault ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                      )}
                    />
                  </button>
                  <Input
                    value={option.name}
                    onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                    placeholder="Option (e.g. Small)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive sm:order-last"
                    onClick={() => removeOption(gi, oi)}
                    title="Remove option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Input
                    value={option.description || ''}
                    onChange={(e) => updateOption(gi, oi, { description: e.target.value })}
                    placeholder="Detail (e.g. 6 inch)"
                    className="col-span-3 sm:col-span-1"
                  />
                  <div className="relative col-span-2 sm:col-span-1">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {isPriceSetter ? '₹' : '+₹'}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={option.price === ('' as unknown as number) ? '' : option.price}
                      onChange={(e) =>
                        updateOption(gi, oi, {
                          price: e.target.value === '' ? ('' as unknown as number) : parseFloat(e.target.value),
                        })
                      }
                      placeholder="Price"
                      className={isPriceSetter ? 'pl-6' : 'pl-8'}
                    />
                  </div>
                  <label className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground" title="Available">
                    <Switch
                      checked={option.isAvailable !== false}
                      onCheckedChange={(checked) => updateOption(gi, oi, { isAvailable: checked })}
                    />
                    <span className="sm:hidden">Available</span>
                  </label>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateGroup(gi, { options: [...group.options, newOption({ isDefault: group.options.length === 0 })] })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add option
            </Button>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const disabled = preset.group.pricingType === 'replace' && replaceIndex !== -1;
          if (disabled) return null;
          return (
            <Button key={preset.label} type="button" variant="outline" size="sm" onClick={() => addGroup(preset.group)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> {preset.label}
            </Button>
          );
        })}
        <Button type="button" variant="ghost" size="sm" onClick={() => addGroup()}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Custom group
        </Button>
      </div>
    </div>
  );
}
