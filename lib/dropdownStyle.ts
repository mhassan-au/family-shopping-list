export function getDropdownOptionClass(index: number) {
  return index % 2 === 0
    ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
    : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
}
