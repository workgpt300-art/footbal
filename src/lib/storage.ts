import type { CareerSave } from "../types";
const STORAGE_KEY = "football-career-2027:saves:v1";
const ACTIVE_KEY = "football-career-2027:active:v1";
export function loadSaves(): CareerSave[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CareerSave[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id && item.player && Array.isArray(item.fixtures)) : [];
  } catch { return []; }
}
export function persistSaves(saves: CareerSave[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saves)); }
  catch { throw new Error("Не вдалося зберегти кар'єру в браузері. Перевір вільне місце або налаштування приватності."); }
}
export function getActiveSaveId(): string | null { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } }
export function setActiveSaveId(id: string | null): void {
  try { if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY); } catch { /* Non-fatal selected-slot cache failure. */ }
}
export function exportSave(save: CareerSave): void {
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "football-career-" + save.name.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, "-") + ".json";
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
export async function importSave(file: File): Promise<CareerSave> {
  const parsed = JSON.parse(await file.text()) as CareerSave;
  if (!parsed || typeof parsed.id !== "string" || !parsed.player || !Array.isArray(parsed.fixtures)) throw new Error("Це не схоже на файл збереження FOOTBALL CAREER 2027.");
  return { ...parsed, id: "save-" + Date.now(), name: (parsed.name || "Імпортована кар'єра").slice(0, 60), updatedAt: new Date().toISOString() };
}