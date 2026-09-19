export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const idleClass =
  "border-line bg-card text-foreground hover:border-primary/40";
const activeClass = "border-primary bg-primary text-primary-foreground";

export const DAYS_OF_WEEK: {
  value: DayOfWeek;
  short: string;
  full: string;
  activeClass: string;
  idleClass: string;
}[] = [
  { value: 0, short: "Pon", full: "Poniedziałek", activeClass, idleClass },
  { value: 1, short: "Wt", full: "Wtorek", activeClass, idleClass },
  { value: 2, short: "Śr", full: "Środa", activeClass, idleClass },
  { value: 3, short: "Czw", full: "Czwartek", activeClass, idleClass },
  { value: 4, short: "Pt", full: "Piątek", activeClass, idleClass },
  { value: 5, short: "Sob", full: "Sobota", activeClass, idleClass },
  { value: 6, short: "Ndz", full: "Niedziela", activeClass, idleClass },
];

export function getDay(value: number | null | undefined) {
  return DAYS_OF_WEEK.find((day) => day.value === value);
}

export function todayAsDayOfWeek(): DayOfWeek {
  const jsDay = new Date().getDay(); // 0 = Sunday .. 6 = Saturday
  return ((jsDay + 6) % 7) as DayOfWeek;
}
