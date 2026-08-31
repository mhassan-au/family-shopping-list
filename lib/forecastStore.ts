import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { getCurrentUsername } from "./currentUser";
import type { ForecastAuditRecord, ForecastDirection, ForecastFrequency, ForecastMonth, ForecastOneOff, ForecastOverride, ForecastSchedule } from "./types";

const schedules = collection(db, "forecast_schedules");
const oneOffs = collection(db, "forecast_one_offs");
const months = collection(db, "forecast_months");
const overrides = collection(db, "forecast_overrides");
const audit = collection(db, "forecast_audit");

function subscribe<T>(ref: ReturnType<typeof collection>, callback: (items: T[]) => void, onError: (error: Error) => void) {
  return onSnapshot(ref, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)), onError);
}

export const subscribeForecastSchedules = (callback: (items: ForecastSchedule[]) => void, onError: (error: Error) => void) => subscribe(schedules, callback, onError);
export const subscribeForecastOneOffs = (callback: (items: ForecastOneOff[]) => void, onError: (error: Error) => void) => subscribe(oneOffs, callback, onError);
export const subscribeForecastMonths = (callback: (items: ForecastMonth[]) => void, onError: (error: Error) => void) => subscribe(months, callback, onError);
export const subscribeForecastOverrides = (callback: (items: ForecastOverride[]) => void, onError: (error: Error) => void) => subscribe(overrides, callback, onError);
export const subscribeForecastAudit = (callback: (items: ForecastAuditRecord[]) => void, onError: (error: Error) => void) => subscribe(audit, callback, onError);

function auditData(action: ForecastAuditRecord["action"], subject: string, oldValue: string, newValue: string, reason: string) {
  return { action, subject, oldValue, newValue, reason: reason.trim(), createdAt: serverTimestamp(), createdAtMs: Date.now(), createdBy: getCurrentUsername() };
}

export async function saveOpeningBalance(id: string, oldValue: number | null, openingBalance: number, reason: string) {
  const batch = writeBatch(db); const now = Date.now(); const by = getCurrentUsername();
  batch.set(doc(months, id), { openingBalance, updatedAt: serverTimestamp(), updatedAtMs: now, updatedBy: by });
  batch.set(doc(audit), auditData("opening_balance_changed", `Opening balance ${id}`, oldValue === null ? "Not set" : String(oldValue), String(openingBalance), reason));
  await batch.commit();
}

export async function addForecastOneOff(input: { kind: ForecastDirection; description: string; amount: number; dateKey: string; reason: string }) {
  const batch = writeBatch(db); const ref = doc(oneOffs); const now = Date.now(); const by = getCurrentUsername();
  batch.set(ref, { kind: input.kind, description: input.description.trim(), amount: input.amount, dateKey: input.dateKey, createdAt: serverTimestamp(), createdAtMs: now, createdBy: by });
  batch.set(doc(audit), auditData("one_off_created", input.description, "Not set", `${input.kind}:${input.amount}@${input.dateKey}`, input.reason));
  await batch.commit();
}

export async function saveForecastOverride(dateKey: string, oldAmount: number, amount: number, oldExcluded: boolean, excluded: boolean, reason: string) {
  const batch = writeBatch(db); const now = Date.now(); const by = getCurrentUsername();
  batch.set(doc(overrides, dateKey), { dateKey, amount, excluded, updatedAt: serverTimestamp(), updatedAtMs: now, updatedBy: by });
  if (oldAmount !== amount) batch.set(doc(audit), auditData("daily_expense_adjusted", `Expenses total ${dateKey}`, String(oldAmount), String(amount), reason));
  if (oldExcluded !== excluded) batch.set(doc(audit), auditData("daily_expense_excluded", `Expenses total ${dateKey}`, oldExcluded ? "Excluded" : "Included", excluded ? "Excluded" : "Included", reason));
  await batch.commit();
}

export async function addForecastSchedule(input: { kind: ForecastDirection; name: string; amount: number; frequency: ForecastFrequency; firstDate: string; reason: string }) {
  const batch = writeBatch(db); const ref = doc(schedules); const now = Date.now(); const by = getCurrentUsername();
  batch.set(ref, { kind: input.kind, name: input.name.trim(), amount: input.amount, frequency: input.frequency, firstDate: input.firstDate, active: true, createdAt: serverTimestamp(), createdAtMs: now, createdBy: by });
  batch.set(doc(audit), auditData("schedule_created", input.name, "Not set", `${input.kind}:${input.amount}:${input.frequency}`, input.reason));
  await batch.commit();
}

export async function inactivateForecastSchedule(schedule: ForecastSchedule, reason: string) {
  const batch = writeBatch(db); const dateKey = new Date().toISOString().slice(0, 10);
  batch.update(doc(schedules, schedule.id), { active: false, inactiveAt: dateKey, inactiveReason: reason.trim() });
  batch.set(doc(audit), auditData("schedule_inactivated", schedule.name, "Active", "Inactive", reason));
  await batch.commit();
}
