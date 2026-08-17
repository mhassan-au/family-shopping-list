export const INPUT_LIMITS = {
  familyCode: 40,
  username: 30,
  password: 128,
  itemName: 80,
  itemBatch: 20,
  itemInput: 500,
  quantity: 999,
  unitPrice: 99999.99,
  expenseDescription: 80,
  expenseAmount: 99999.99,
} as const;

const LOGIN_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const ITEM_NAME_PATTERN = /^[\p{L}\p{M}\p{N} &'()+./%\-]+$/u;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

export function isValidFamilyCode(value: string) {
  return (
    value.length >= 3 &&
    value.length <= INPUT_LIMITS.familyCode &&
    LOGIN_ID_PATTERN.test(value)
  );
}

export function isValidUsername(value: string) {
  return (
    value.length >= 1 &&
    value.length <= INPUT_LIMITS.username &&
    LOGIN_ID_PATTERN.test(value)
  );
}

export function isValidPassword(value: string) {
  return (
    value.length >= 6 &&
    value.length <= INPUT_LIMITS.password &&
    !CONTROL_CHAR_PATTERN.test(value)
  );
}

export function isValidItemName(value: string) {
  return (
    value.length >= 1 &&
    value.length <= INPUT_LIMITS.itemName &&
    ITEM_NAME_PATTERN.test(value)
  );
}

export function parseItemNames(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isValidQuantity(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= INPUT_LIMITS.quantity;
}

export function isValidUnitPrice(value: number) {
  return (
    Number.isFinite(value) &&
    value >= 0 &&
    value <= INPUT_LIMITS.unitPrice &&
    Math.round(value * 100) === value * 100
  );
}

export function isValidQuantityInput(value: string) {
  return /^\d{0,3}$/.test(value);
}

export function isValidPriceInput(value: string) {
  return /^\d{0,5}(?:\.\d{0,2})?$/.test(value);
}

export function isValidExpenseDescription(value: string) {
  return (
    value.trim().length >= 1 &&
    value.trim().length <= INPUT_LIMITS.expenseDescription &&
    ITEM_NAME_PATTERN.test(value.trim())
  );
}

export function isValidExpenseAmount(value: number) {
  return (
    Number.isFinite(value) &&
    value > 0 &&
    value <= INPUT_LIMITS.expenseAmount &&
    Math.round(value * 100) === value * 100
  );
}

export function isValidAmendmentAmount(value: number) {
  return (
    Number.isFinite(value) &&
    value !== 0 &&
    Math.abs(value) <= INPUT_LIMITS.expenseAmount &&
    Math.round(value * 100) === value * 100
  );
}

export function isValidAmendmentInput(value: string) {
  return /^-?\d{0,5}(?:\.\d{0,2})?$/.test(value);
}
