import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ImprovementLogEntry, ImprovementStatus, ImprovementType } from "@/lib/types";

const improvementLogs = collection(db, "improvement_logs");

export function subscribeToImprovementLogs(
  onData: (entries: ImprovementLogEntry[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(query(improvementLogs, orderBy("createdAtMs", "desc")), (snapshot) => {
    onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as ImprovementLogEntry));
  }, onError);
}

export async function addImprovementLog(type: ImprovementType, title: string, notes: string, actor: string) {
  const now = Date.now();
  await addDoc(improvementLogs, {
    type,
    title,
    notes,
    status: "inbox",
    createdAt: serverTimestamp(),
    createdAtMs: now,
    createdBy: actor,
    updatedAt: serverTimestamp(),
    updatedAtMs: now,
    updatedBy: actor,
  });
}

export async function editImprovementLog(id: string, type: ImprovementType, title: string, notes: string, actor: string) {
  await updateDoc(doc(improvementLogs, id), {
    type,
    title,
    notes,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now(),
    updatedBy: actor,
  });
}

export async function changeImprovementStatus(id: string, status: ImprovementStatus, actor: string, resolutionSummary?: string) {
  const now = Date.now();
  const update: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
    updatedAtMs: now,
    updatedBy: actor,
  };
  if (["done", "not_doing", "duplicate"].includes(status)) {
    update.resolutionSummary = resolutionSummary?.trim();
    update.resolvedAt = serverTimestamp();
    update.resolvedAtMs = now;
  }
  await updateDoc(doc(improvementLogs, id), update);
}

export async function deleteImprovementLog(id: string) {
  await deleteDoc(doc(improvementLogs, id));
}
