import { type ReactNode } from 'react';
import { Field } from '@chemicalluck/engine/components/ui/field';
import { Input } from '@chemicalluck/engine/components/ui/input';
import { Label } from '@chemicalluck/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/engine/components/ui/select';

export function TwoCol({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
    </Field>
  );
}

export function IdSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  if (options.length > 0) {
    return (
      <Field>
        <Label>{label}</Label>
        <Select
          value={value || '__none__'}
          onValueChange={(v) => {
            onChange(v === '__none__' ? '' : v);
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder={placeholder ?? 'Select…'} />
          </SelectTrigger>
          <SelectContent>
            {!value && <SelectItem value="__none__">— select —</SelectItem>}
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  }
  return (
    <Field>
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
      />
    </Field>
  );
}
