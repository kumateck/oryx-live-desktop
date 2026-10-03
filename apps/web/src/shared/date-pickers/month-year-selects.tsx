import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isMonthAllowed, monthYearValue } from "./date-utils";

const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Date(2000, index, 1).toLocaleDateString(undefined, { month: "long" }));

/** A month and a year, chosen from two lists. `caption` names which month this is when a picker has more than one. */
export function MonthYearSelects({ id, caption, year, month, onYear, onMonth, minYear, maxYear, minMonth, maxMonth }: {
  id: string;
  caption?: string;
  year: number;
  month: number;
  onYear: (year: number) => void;
  onMonth: (month: number) => void;
  minYear: number;
  maxYear: number;
  minMonth?: string | undefined;
  maxMonth?: string | undefined;
}) {
  const years = Array.from({ length: Math.max(0, maxYear - minYear + 1) }, (_, index) => minYear + index);
  const name = (part: string) => caption ? `${caption} ${part.toLowerCase()}` : part;
  return <div className="grid grid-cols-2 gap-2">
    <div className="grid gap-1.5"><Label htmlFor={`${id}-month`}>{name("Month")}</Label>
      <Select value={String(month)} onValueChange={(next) => onMonth(Number(next))}>
        <SelectTrigger id={`${id}-month`} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{monthNames.map((label, index) => <SelectItem key={label} value={String(index + 1)}
          disabled={!isMonthAllowed(monthYearValue(year, index + 1), minMonth, maxMonth)}>{label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="grid gap-1.5"><Label htmlFor={`${id}-year`}>{name("Year")}</Label>
      <Select value={String(year)} onValueChange={(next) => onYear(Number(next))}>
        <SelectTrigger id={`${id}-year`} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{years.map((option) => <SelectItem key={option} value={String(option)}
          disabled={!monthNames.some((_, index) => isMonthAllowed(monthYearValue(option, index + 1), minMonth, maxMonth))}>{option}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  </div>;
}
