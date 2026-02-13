import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Availability, AvailabilityType } from '@/lib/api';
import { Clock, Calendar, CalendarDays, Infinity } from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AvailabilityPickerProps {
  value: Availability;
  onChange: (value: Availability) => void;
}

export default function AvailabilityPicker({ value, onChange }: AvailabilityPickerProps) {
  const handleTypeChange = (type: AvailabilityType) => {
    const base: Availability = { type };
    if (type === 'once') {
      base.startDate = new Date().toISOString().split('T')[0];
      base.endDate = new Date().toISOString().split('T')[0];
      base.startTime = '00:00';
      base.endTime = '24:00';
    } else if (type === 'daily') {
      base.startTime = '00:00';
      base.endTime = '24:00';
    } else if (type === 'weekly') {
      base.daysOfWeek = [1, 2, 3, 4, 5];
      base.startTime = '00:00';
      base.endTime = '24:00';
    }
    onChange(base);
  };

  const toggleDay = (day: number) => {
    const current = value.daysOfWeek || [];
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    onChange({ ...value, daysOfWeek: next });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm">Availability</Label>
        <Select value={value.type} onValueChange={(v) => handleTypeChange(v as AvailabilityType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="always">
              <span className="flex items-center gap-2"><Infinity className="h-3 w-3" /> Always Available</span>
            </SelectItem>
            <SelectItem value="once">
              <span className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Date Range (Once)</span>
            </SelectItem>
            <SelectItem value="daily">
              <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> Daily (Time Range)</span>
            </SelectItem>
            <SelectItem value="weekly">
              <span className="flex items-center gap-2"><CalendarDays className="h-3 w-3" /> Weekly Schedule</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.type === 'once' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <Input
              type="date"
              value={value.startDate ? value.startDate.split('T')[0] : ''}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input
              type="date"
              value={value.endDate ? value.endDate.split('T')[0] : ''}
              onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            />
          </div>
        </div>
      )}

      {value.type === 'weekly' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Days</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  (value.daysOfWeek || []).includes(i)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {(value.type === 'once' || value.type === 'daily' || value.type === 'weekly') && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Start Time</Label>
            <Input
              type="time"
              value={value.startTime || '00:00'}
              onChange={(e) => onChange({ ...value, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">End Time</Label>
            <Input
              type="time"
              value={value.endTime === '24:00' ? '23:59' : (value.endTime || '23:59')}
              onChange={(e) => onChange({ ...value, endTime: e.target.value === '23:59' ? '24:00' : e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
