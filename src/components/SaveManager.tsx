import React, { useState, useEffect } from 'react';
import {
  CharacterSheet,
  RulesConfig,
  SaveGamePayload,
  GamebookNode,
  AdventureHistoryEntry,
  SaveSlotMeta,
  AdventureSavePayload,
  Village
} from '../types/lv8';
import { exportCharacterToPDF } from '../utils/pdfExport';
import {
  getSaveSlotsMeta,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  downloadAdventureJSON,
  downloadAdventureJournalText,
  loadAutoSave,
} from '../utils/storage';
import {
  Download,
  Upload,
  FileJson,
  FileText,
  Save,
  CheckCircle,
  Copy,
  AlertCircle,
  HardDrive,
  Trash2,
  FolderOpen,
  Sparkles,
  Layers,
  Clock,
  RotateCcw
} from 'lucide-react';

interface SaveManagerProps {
  character: CharacterSheet;
  rulesConfig: RulesConfig;
  adventureState?: {
    currentNode: GamebookNode;
    history: AdventureHistoryEntry[];
    locationName: string;
  };
  villages?: Village[];
  activeVillageId?: string;
  onLoadSave: (payload: SaveGamePayload) => void;
  onLoadAdventureOnly?: (adv: AdventureSavePayload) => void;
}

export const SaveManager: React.FC<SaveManagerProps> = ({
  character,
  rulesConfig,
  adventureState,
  villages,
  activeVillageId,
  onLoadSave,
  onLoadAdventureOnly,
}) => {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlotMeta[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'slots' | 'export' | 'import'>('slots');

  useEffect(() => {
    refreshSlots();
  }, []);

  const refreshSlots = () => {
    setSaveSlots(getSaveSlotsMeta());
  };

  // Generate full state payload
  const createFullPayload = (): SaveGamePayload => {
    return {
      version: 'LV8-2.0-Full',
      savedAt: new Date().toISOString(),
      character,
      rulesConfig,
      gamebookState: {
        currentNode: adventureState?.currentNode || {
          id: 'node_default',
          title: 'Clareira das Dobras',
          narrative: 'Início da jornada primal.',
          dangerLevel: 'Médio',
          choices: [],
        },
        history: adventureState?.history || [],
        locationName: adventureState?.locationName || 'Selva das Dobras',
      },
      villages,
      activeVillageId,
    };
  };

  // Generate adventure only payload
  const createAdventurePayload = (): AdventureSavePayload => {
    return {
      version: 'LV8-2.0-Adventure',
      adventureTitle: adventureState?.currentNode?.title || 'Aventura na Dobra',
      savedAt: new Date().toISOString(),
      locationName: adventureState?.locationName || 'Selva Primal',
      currentNode: adventureState?.currentNode || {
        id: 'node_1',
        title: 'Clareira das Dobras',
        narrative: '',
        dangerLevel: 'Médio',
        choices: [],
      },
      history: adventureState?.history || [],
      characterSnapshot: {
        name: character.name,
        className: character.className,
        race: character.race,
        hpCurrent: character.hpCurrent,
        hpMax: character.hpMax,
        fluxoCurrent: character.fluxoCurrent,
        fluxoMax: character.fluxoMax,
      },
    };
  };

  // Save to slot
  const handleSaveToSlot = (slotId: string, customName?: string) => {
    const payload = createFullPayload();
    const name = customName || `${character.name} - ${adventureState?.currentNode?.title || 'Capítulo'}`;
    const success = saveToSlot(slotId, name, payload);
    if (success) {
      refreshSlots();
      setSuccessMsg(`Jogo salvo com sucesso no Slot ${slotId}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Load from slot
  const handleLoadFromSlot = (slotId: string) => {
    const data = loadFromSlot(slotId);
    if (data && data.character && data.rulesConfig) {
      onLoadSave(data);
      setSuccessMsg(`Save do Slot ${slotId} carregado com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(`Falha ao carregar o Slot ${slotId}.`);
    }
  };

  // Delete slot
  const handleDeleteSlot = (slotId: string) => {
    deleteSlot(slotId);
    refreshSlots();
    setSuccessMsg(`Save do Slot ${slotId} apagado com sucesso.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Download Full Save JSON
  const handleDownloadFullJSON = () => {
    const payload = createFullPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `SaveCompleto_${character.name.replace(/\s+/g, '_') || 'Personagem'}_LV8_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download Adventure JSON
  const handleDownloadAdventure = () => {
    const adv = createAdventurePayload();
    downloadAdventureJSON(adv);
  };

  // Download Journal MD
  const handleDownloadJournal = () => {
    const adv = createAdventurePayload();
    downloadAdventureJournalText(adv);
  };

  // Copy JSON to clipboard
  const handleCopyJSON = () => {
    const payload = createFullPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopyFeedback('JSON completo copiado para a área de transferência!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // File Upload handler (can be full save, adventure save, or character sheet)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        processImportedText(text);
      } catch (err: any) {
        setErrorMsg('Erro ao ler arquivo: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Process text import
  const processImportedText = (text: string) => {
    try {
      const parsed = JSON.parse(text);

      // Check if it's full game save
      if (parsed.character && parsed.rulesConfig) {
        onLoadSave(parsed);
        setErrorMsg(null);
        setSuccessMsg('Save completo do LV8 importado com sucesso!');
        setTimeout(() => setSuccessMsg(null), 4000);
        return;
      }

      // Check if it's adventure save
      if (parsed.currentNode && Array.isArray(parsed.history)) {
        if (onLoadAdventureOnly) {
          onLoadAdventureOnly(parsed);
          setSuccessMsg(`Aventura "${parsed.adventureTitle || 'Importada'}" carregada com sucesso!`);
          setTimeout(() => setSuccessMsg(null), 4000);
          return;
        }
      }

      setErrorMsg('O formato JSON não corresponde a um savegame ou aventura válida do LV8.');
    } catch (err: any) {
      setErrorMsg('JSON inválido: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-100 uppercase tracking-wide">
              Gerenciador de Saves &amp; Exportação de Aventuras
            </h3>
            <p className="text-xs text-zinc-400">
              Slots no navegador (LocalStorage), arquivos JSON completos, diários de aventura e exportação para PDF.
            </p>
          </div>
        </div>

        {/* Quick PDF Export */}
        <button
          type="button"
          onClick={() => exportCharacterToPDF(character, rulesConfig)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 transition hover:scale-105 active:scale-95"
        >
          <FileText className="w-4 h-4" /> Exportar Ficha em PDF
        </button>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-950/80 border border-red-700 text-red-200 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('slots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'slots'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
              : 'text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Slots no Navegador (LocalStorage)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('export')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'export'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Download className="w-4 h-4" /> Exportar JSON &amp; Relatórios
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('import')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'import'
              ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
              : 'text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Upload className="w-4 h-4" /> Importar Arquivos / Colar JSON
        </button>
      </div>

      {/* TAB 1: Slots in LocalStorage */}
      {activeSubTab === 'slots' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Saves Rápidos do Navegador
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              O progresso é salvo no seu dispositivo localmente. Não é necessária nenhuma conexão com a internet.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['1', '2', '3', '4', '5'].map((slotId) => {
                const meta = saveSlots.find((s) => s.slotId === slotId);

                return (
                  <div
                    key={slotId}
                    className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          SLOT #{slotId}
                        </span>
                        {meta ? (
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(meta.savedAt).toLocaleDateString()}{' '}
                            {new Date(meta.savedAt).toLocaleTimeString().slice(0, 5)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-600 italic">Vazio</span>
                        )}
                      </div>

                      {meta ? (
                        <div className="space-y-0.5">
                          <strong className="text-xs text-zinc-200 block truncate">
                            {meta.name}
                          </strong>
                          <p className="text-[11px] text-zinc-400">
                            {meta.characterName} ({meta.characterClass})
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            Cena: {meta.currentScene}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 py-2">Nenhum save gravado neste slot.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => handleSaveToSlot(slotId)}
                        className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition text-center"
                      >
                        Salvar Aqui
                      </button>

                      {meta && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleLoadFromSlot(slotId)}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-black rounded-lg transition text-center"
                          >
                            Carregar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slotId)}
                            className="p-1.5 bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded-lg transition"
                            title="Apagar slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Export Files */}
      {activeSubTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Full Savegame JSON */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <FileJson className="w-5 h-5 text-amber-500" />
                <span>Save Completo do Jogo (.JSON)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Inclui a ficha completa do personagem, fórmulas e regras da planilha, estado do combate e crônica de decisões no Gamebook.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={handleDownloadFullJSON}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <Download className="w-4 h-4" /> Baixar Save JSON
              </button>

              <button
                type="button"
                onClick={handleCopyJSON}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-zinc-700"
                title="Copiar JSON"
              >
                <Copy className="w-4 h-4" />
                {copyFeedback ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Card 2: Adventure Module JSON */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Layers className="w-5 h-5 text-cyan-500" />
                <span>Módulo de Aventura (.JSON)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Exporta exclusivamente a história, narrativa atual, galhos de decisão e histórico para ser compartilhado ou continuado.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadAdventure}
              className="py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Download className="w-4 h-4" /> Baixar Aventura JSON
            </button>
          </div>

          {/* Card 3: Adventure Journal Text/Markdown */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <FileText className="w-5 h-5 text-purple-500" />
                <span>Diário da Jornada (.MD / Texto)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Gera um relatório legível com a crônica de todas as escolhas, sucessos, pífios e acontecimentos para leitura ou impressão.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadJournal}
              className="py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <FileText className="w-4 h-4" /> Baixar Diário Markdown
            </button>
          </div>

          {/* Card 4: Character Sheet PDF */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <FileText className="w-5 h-5 text-rose-500" />
                <span>Ficha LV8 em PDF (Impressão)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Documento formatado em folha A4 com tabelas de atributos, perícias customizadas, poderes de Fluxo e inventário.
              </p>
            </div>

            <button
              type="button"
              onClick={() => exportCharacterToPDF(character, rulesConfig)}
              className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <FileText className="w-4 h-4" /> Gerar PDF A4
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Import Files & Paste JSON */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          {/* File Upload Box */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Carregar Arquivo JSON (.json)
            </h4>
            <p className="text-xs text-zinc-400">
              Selecione um arquivo de save completo ou um módulo de aventura salvo anteriormente:
            </p>

            <label className="border-2 border-dashed border-zinc-700 hover:border-cyan-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-zinc-950/60 group">
              <FolderOpen className="w-8 h-8 text-zinc-500 group-hover:text-cyan-400 transition mb-2" />
              <span className="text-xs font-bold text-zinc-300 group-hover:text-white">
                Clique para selecionar o arquivo .json do seu computador
              </span>
              <span className="text-[10px] text-zinc-500 mt-1">Saves LV8 e Aventuras da Dobra</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Paste JSON Box */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-400" />
              Ou Cole o Conteúdo JSON Diretamente
            </h4>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Cole aqui o texto JSON do save ou da aventura..."
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => processImportedText(jsonInput)}
                disabled={!jsonInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Importar Dados Colados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
