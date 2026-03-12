import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import type { AddOn } from '@/lib/api';

interface AddOnSelectorProps {
  addOns: AddOn[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function AddOnSelector({ addOns, selectedIds, onChange }: AddOnSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedAddOns = addOns.filter((a) => selectedIds.includes(a._id));
  const filtered = addOns.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (addOns.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
        No add-ons available.{' '}
        <a
          href="/dashboard/add-ons"
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Create add-ons first
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length === 0
              ? 'Select add-ons...'
              : `${selectedIds.length} add-on${selectedIds.length > 1 ? 's' : ''} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search add-ons..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No add-ons found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((addOn) => {
                  const isSelected = selectedIds.includes(addOn._id);
                  return (
                    <CommandItem key={addOn._id} onSelect={() => toggle(addOn._id)}>
                      <div
                        className={`mr-2 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-input'
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className={isSelected ? 'font-medium' : ''}>
                        {addOn.name}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        +₹{addOn.price}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedAddOns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAddOns.map((addOn) => (
            <Badge key={addOn._id} variant="secondary" className="gap-1 pr-1">
              {addOn.name}
              <span className="text-xs text-muted-foreground ml-1">+₹{addOn.price}</span>
              <button
                type="button"
                onClick={() => toggle(addOn._id)}
                className="ml-1 rounded-full hover:bg-black/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
