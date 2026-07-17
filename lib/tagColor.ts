import { SHOPS, CATEGORIES, PRIORITIES } from "./config";

export function getTagColor(value: string) {
  const shop = SHOPS.find((x) => x.label === value);
  const category = CATEGORIES.find((x) => x.label === value);
  const priority = PRIORITIES.find((x) => x.label === value);

  const color =
    shop?.color ||
    category?.color ||
    priority?.color ||
    "bg-indigo-100 text-indigo-800";

  return color;
}
