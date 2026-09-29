import { SaveGamePayload, AdventureSavePayload, SaveSlotMeta, Combatant } from '../types/lv8';

const AUTOSAVE_KEY = 'lv8_autosave_v2';
const SLOTS_META_KEY = 'lv8_slots_meta_v2';
const SLOT_PREFIX = 'lv8_slot_v2_';
const BESTIARY_KEY = 'lv8_bestiary_v1';

/**
 * Loads custom bestiary from localStorage.
 */
export function loadStoredBestiary(): Record<string, Combatant> | null {
  try {
    const raw = localStorage.getItem(BESTIARY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load bestiary:', err);
    return null;
  }
}

/**
 * Saves custom bestiary to localStorage.
 */
export function saveStoredBestiary(bestiary: Record<string, Combatant>): boolean {
  try {
    localStorage.setItem(BESTIARY_KEY, JSON.stringify(bestiary));
    return true;
  } catch (err) {
    console.warn('Failed to save bestiary:', err);
    return false;
  }
}

/**
 * Loads autosave payload from browser localStorage.
 */
export function loadAutoSave(): SaveGamePayload | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.character && parsed.rulesConfig) {
      return parsed as SaveGamePayload;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load autosave:', err);
    return null;
  }
}

/**
 * Saves game payload to autosave key.
 */
export function saveAutoSave(payload: SaveGamePayload): boolean {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Failed to save autosave:', err);
    return false;
  }
}

/**
 * Gets list of saved slot metadata.
 */
export function getSaveSlotsMeta(): SaveSlotMeta[] {
  try {
    const raw = localStorage.getItem(SLOTS_META_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SaveSlotMeta[];
  } catch (err) {
    return [];
  }
}

/**
 * Saves game payload to a specific named slot.
 */
export function saveToSlot(
  slotId: string,
  slotName: string,
  payload: SaveGamePayload
): boolean {
  try {
    localStorage.setItem(`${SLOT_PREFIX}${slotId}`, JSON.stringify(payload));

    const currentMetas = getSaveSlotsMeta().filter((m) => m.slotId !== slotId);
    const newMeta: SaveSlotMeta = {
      slotId,
      name: slotName || `Slot ${slotId}`,
      savedAt: new Date().toISOString(),
      characterName: payload.character.name || 'Sem Nome',
      characterClass: payload.character.className || 'Aventureiro',
      characterRace: payload.character.race || 'Povo Primal',
      currentScene: payload.gamebookState?.currentNode?.title || 'Terras Primais',
      hpSummary: `${payload.character.hpCurrent}/${payload.character.hpMax} HP`,
      fluxoSummary: `${payload.character.fluxoCurrent}/${payload.character.fluxoMax} Fluxo`,
      xpSummary: `${payload.character.xp ?? 0} XP Disp (${payload.character.totalXp ?? 0} Tot)`,
      inventoryCount: payload.character.inventory?.length || 0,
      inventoryPreview: payload.character.inventory?.slice(0, 4).map((i) => i.name) || [],
      avatarUrl: payload.character.avatarUrl,
    };

    localStorage.setItem(SLOTS_META_KEY, JSON.stringify([...currentMetas, newMeta]));
    return true;
  } catch (err) {
    console.warn('Failed to save to slot:', err);
    return false;
  }
}

/**
 * Loads payload from a specific slot.
 */
export function loadFromSlot(slotId: string): SaveGamePayload | null {
  try {
    const raw = localStorage.getItem(`${SLOT_PREFIX}${slotId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SaveGamePayload;
  } catch (err) {
    console.warn('Failed to load slot:', err);
    return null;
  }
}

/**
 * Deletes a slot.
 */
export function deleteSlot(slotId: string): boolean {
  try {
    localStorage.removeItem(`${SLOT_PREFIX}${slotId}`);
    const currentMetas = getSaveSlotsMeta().filter((m) => m.slotId !== slotId);
    localStorage.setItem(SLOTS_META_KEY, JSON.stringify(currentMetas));
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Download an Adventure Save Payload as JSON
 */
export function downloadAdventureJSON(adventure: AdventureSavePayload) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(adventure, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  const cleanTitle = (adventure.adventureTitle || 'Aventura_LV8').replace(/\s+/g, '_');
  a.setAttribute('download', `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Export Adventure Journal as formatted Markdown / Text
 */
export function downloadAdventureJournalText(adventure: AdventureSavePayload) {
  let md = `# DIÁRIO DE AVENTURA — SISTEMA LV8 (ECOS DA DOBRA)\n`;
  md += `**Aventura:** ${adventure.adventureTitle}\n`;
  md += `**Data:** ${new Date(adventure.savedAt).toLocaleString()}\n`;
  md += `**Protagonista:** ${adventure.characterSnapshot.name} (${adventure.characterSnapshot.className} • ${adventure.characterSnapshot.race})\n`;
  md += `**Status:** HP ${adventure.characterSnapshot.hpCurrent}/${adventure.characterSnapshot.hpMax} | Fluxo ${adventure.characterSnapshot.fluxoCurrent}/${adventure.characterSnapshot.fluxoMax}\n`;
  md += `**Localização Atual:** ${adventure.currentNode.title}\n\n`;
  md += `---\n\n`;
  md += `## CRÔNICA DOS FATOS & DECISÕES\n\n`;

  adventure.history.forEach((h, idx) => {
    md += `### ${idx + 1}. ${h.title}\n`;
    if (h.timestamp) md += `*${h.timestamp}*\n\n`;
    md += `> **Escolha Tomada:** ${h.chosenText}\n\n`;
    if (h.outcome) md += `**Desfecho:** ${h.outcome}\n\n`;
    if (h.rollSummary) md += `*Resultado da Rolagem:* \`${h.rollSummary}\`\n\n`;
    md += `---\n\n`;
  });

  md += `## CENA ATUAL\n\n`;
  md += `### ${adventure.currentNode.title} [Perigo: ${adventure.currentNode.dangerLevel}]\n\n`;
  md += `${adventure.currentNode.narrative}\n\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Diario_${adventure.characterSnapshot.name.replace(/\s+/g, '_')}_LV8.md`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
