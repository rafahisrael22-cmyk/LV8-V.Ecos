import React, { useState, useEffect } from 'react';
import { SaveGamePayload, SaveSlotMeta } from '../types/lv8';
import { getSaveSlotsMeta, loadFromSlot, deleteSlot, loadAutoSave } from '../utils/storage';
import {
  FolderOpen,
  User,
  Heart,
  Zap,
  HardDrive,
  Trash2,
  Play,
  Upload,
  Calendar,
  Sparkles,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface LoadGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGame: (payload: SaveGamePayload) => void;
}

export function LoadGameModal({
  isOpen,
  onClose,
  onLoadGame,
}: LoadGameModalProps) {
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [autoSaveData, setAutoSaveData] = useState<SaveGamePayload | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshSlots = () => {
    setSlots(getSaveSlotsMeta());
    setAutoSaveData(loadAutoSave());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSlots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoadSlot = (slotId: string) => {
    const payload = loadFromSlot(slotId);
    if (!payload) {
      setNotification('Erro ao carregar o slot selecionado.');
      return;
    }
    onLoadGame(payload);
    onClose();
  };

  const handleLoadAutoSave = () => {
    if (!autoSaveData) return;
    onLoadGame(autoSaveData);
    onClose();
  };

  const handleDelete = (slotId: string) => {
    deleteSlot(slotId);
    refreshSlots();
    setNotification(`Save do Slot ${slotId} removido.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.character && parsed.rulesConfig) {
          onLoadGame(parsed as SaveGamePayload);
          onClose();
        } else {
          setNotification('Arquivo JSON não possui a estrutura válida do LV8 2.0.');
        }
      } catch (err) {
        setNotification('Erro ao processar o arquivo de save JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-amber-400">CARREGAR JOGO &amp; PERSONAGEM</h2>
              <p className="text-xs text-zinc-400">
                Selecione um personagem para restaurar seu progresso, missões e inventário particular
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 font-bold text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Feedback message */}
        {notification && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs rounded-xl flex items-center justify-between">
            <span>{notification}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-amber-400 hover:text-amber-200 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body Slots */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Auto-Save Card */}
          {autoSaveData && (
            <div className="p-4 bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border border-emerald-600/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    Auto-Save Mais Recente
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {new Date(autoSaveData.savedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-black text-zinc-100">{autoSaveData.character.name}</h3>
                  <span className="text-xs text-zinc-400">
                    ({autoSaveData.character.className} • {autoSaveData.character.race})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                  <span className="text-rose-400 font-mono">
                    {autoSaveData.character.hpCurrent}/{autoSaveData.character.hpMax} HP
                  </span>
                  <span>•</span>
                  <span className="text-cyan-400 font-mono">
                    {autoSaveData.character.fluxoCurrent}/{autoSaveData.character.fluxoMax} Fluxo
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-mono">
                    {autoSaveData.character.xp ?? 0} XP Disp
                  </span>
                  <span>•</span>
                  <span className="text-zinc-400">
                    Cena: {autoSaveData.gamebookState?.currentNode?.title || 'Terras Primais'}
                  </span>
                </div>
                {autoSaveData.character.inventory && autoSaveData.character.inventory.length > 0 && (
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1">
                    <Briefcase className="w-3 h-3 text-zinc-500" />
                    <span>Inventário: </span>
                    <span className="text-zinc-300">
                      {autoSaveData.character.inventory.slice(0, 3).map((i) => i.name).join(', ')}
                      {autoSaveData.character.inventory.length > 3 ? '...' : ''}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLoadAutoSave}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5 shrink-0"
              >
                <Play className="w-4 h-4 fill-zinc-950" /> Carregar Auto-Save
              </button>
            </div>
          )}

          {/* Slots List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Slots Salvos Manualmente ({slots.length})
            </h3>

            {slots.length === 0 && !autoSaveData ? (
              <div className="p-8 text-center bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-2">
                <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">Nenhum personagem salvo encontrado neste navegador.</p>
                <p className="text-[11px] text-zinc-500">
                  Clique em "Novo Jogo" no menu inicial para criar seu primeiro herói!
                </p>
              </div>
            ) : (
              slots.map((s) => (
                <div
                  key={s.slotId}
                  className="p-4 bg-zinc-950/90 border border-zinc-800 hover:border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">{s.name}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {new Date(s.savedAt).toLocaleDateString()} {new Date(s.savedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-bold text-zinc-100">{s.characterName}</span>
                      <span className="text-xs text-zinc-400">
                        ({s.characterClass}{s.characterRace ? ` • ${s.characterRace}` : ''})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      {s.hpSummary && <span className="text-rose-400 font-mono">{s.hpSummary}</span>}
                      {s.fluxoSummary && <span className="text-cyan-400 font-mono">• {s.fluxoSummary}</span>}
                      {s.xpSummary && <span className="text-amber-400 font-mono">• {s.xpSummary}</span>}
                      <span>• Cena: {s.currentScene}</span>
                    </div>

                    {s.inventoryPreview && s.inventoryPreview.length > 0 && (
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-0.5">
                        <Briefcase className="w-3 h-3 text-zinc-500" />
                        <span className="text-zinc-500">Bolsa: </span>
                        <span className="text-zinc-300">{s.inventoryPreview.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoadSlot(s.slotId)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-zinc-950" /> Carregar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(s.slotId)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Excluir este slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Import */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Importar Save JSON do Disco</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
