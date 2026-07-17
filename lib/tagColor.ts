import { SHOPS, CATEGORIES } from "./config";

export function getTagColor(value: string) {

  const shop = SHOPS.find(x => x.label === value);
  const category = CATEGORIES.find(x => x.label === value);

  const color =
    shop?.color ||
    category?.color ||
    "bg-indigo-100 text-indigo-800";

  console.log("TAG DEBUG:", {
    value,
    shop,
    category,
    color
  });


  return color;

}