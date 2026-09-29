import React, { useState } from 'react';
import {
  CharacterSheet,
  RulesConfig,
  Village,
  VillageNPC,
  NPCQuest,
  InventoryItem,
  GamebookNode,
  AdventureHistoryEntry,
  Combatant
} from '../types/lv8';
import { RulesAndCalculationsManager } from './RulesAndCalculationsManager';
import { SaveManager } from './SaveManager';
import { RulesReference } from './RulesReference';
import { MonsterEditorModal } from './MonsterEditorModal';
import { MonsterSheetModal } from './MonsterSheetModal';
import { PREMADE_ENEMIES } from '../utils/characterDefaults';
import { saveStoredBestiary } from '../utils/storage';
import {
  Code,
  Users,
  UserPlus,
  Home,
  Sliders,
  Shield,
  BookOpen,
  Save,
  Play,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Check,
  Package,
  Sparkles,
  HelpCircle,
  Eye,
  Award,
  Zap,
  Heart,
  Skull,
  Dices,
  Search,
  RotateCcw,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface DeveloperModeProps {
  character: CharacterSheet;
  rulesConfig: RulesConfig;
  villages: Village[];
  activeVillageId: string;
  bestiary: Record<string, Combatant>;
  onUpdateBestiary: (bestiary: Record<string, Combatant>) => void;
  adventureState: {
    currentNode: GamebookNode;
    history: AdventureHistoryEntry[];
    locationName: string;
  };
  onUpdateCharacter: (c: CharacterSheet) => void;
  onUpdateRules: (r: RulesConfig) => void;
  onUpdateVillages: (v: Village[]) => void;
  onSelectActiveVillage: (id: string) => void;
  onUpdateAdventureState: (adv: {
    currentNode: GamebookNode;
    history: AdventureHistoryEntry[];
    locationName: string;
  }) => void;
  onSwitchToPlayerMode: () => void;
  onReturnToMainMenu: () => void;
  onOpenDiceRoller?: (dice: number, title: string, diff?: number) => void;
}

export function DeveloperMode({
  character,
  rulesConfig,
  villages,
  activeVillageId,
  bestiary,
  onUpdateBestiary,
  adventureState,
  onUpdateCharacter,
  onUpdateRules,
  onUpdateVillages,
  onSelectActiveVillage,
  onUpdateAdventureState,
  onSwitchToPlayerMode,
  onReturnToMainMenu,
  onOpenDiceRoller = () => {},
}: DeveloperModeProps) {
  const [activeDevTab, setActiveDevTab] = useState<'npcs' | 'characters' | 'villages' | 'bestiary' | 'rules' | 'gamebook' | 'saves'>('npcs');
  const [feedback, setFeedback] = useState<string | null>(null);

  // --- BESTIARY & MONSTER SHEETS STATE ---
  const [selectedMonsterToEdit, setSelectedMonsterToEdit] = useState<Combatant | null>(null);
  const [isMonsterEditorOpen, setIsMonsterEditorOpen] = useState(false);
  const [selectedMonsterToView, setSelectedMonsterToView] = useState<Combatant | null>(null);
  const [isMonsterSheetOpen, setIsMonsterSheetOpen] = useState(false);
  const [monsterSearchQuery, setMonsterSearchQuery] = useState('');

  const handleOpenCreateMonster = () => {
    setSelectedMonsterToEdit(null);
    setIsMonsterEditorOpen(true);
  };

  const handleOpenEditMonster = (m: Combatant) => {
    setSelectedMonsterToEdit(m);
    setIsMonsterEditorOpen(true);
  };

  const handleOpenViewMonster = (m: Combatant) => {
    setSelectedMonsterToView(m);
    setIsMonsterSheetOpen(true);
  };

  const handleSaveMonster = (saved: Combatant) => {
    const updated = {
      ...bestiary,
      [saved.id]: saved,
    };
    onUpdateBestiary(updated);
    saveStoredBestiary(updated);
    showToast(`Planilha do monstro "${saved.name}" salva com sucesso no Bestiário!`);
  };

  const handleDeleteMonster = (id: string) => {
    const copy = { ...bestiary };
    delete copy[id];
    onUpdateBestiary(copy);
    saveStoredBestiary(copy);
    showToast('Monstro removido do Bestiário.');
  };

  const handleResetBestiary = () => {
    onUpdateBestiary(PREMADE_ENEMIES);
    saveStoredBestiary(PREMADE_ENEMIES);
    showToast('Bestiário restaurado para o padrão original!');
  };

  // --- NPC CREATOR STATE ---
  const [selectedVillageId, setSelectedVillageId] = useState<string>(activeVillageId || villages[0]?.id || '');
  const [editingNpc, setEditingNpc] = useState<VillageNPC | null>(null);
  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);

  // New Quest inside NPC Creator state
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestDifficulty, setNewQuestDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil' | 'Heroico' | 'Brutal'>('Médio');
  const [newQuestBriefing, setNewQuestBriefing] = useState('');
  const [newQuestCompletion, setNewQuestCompletion] = useState('');
  const [newQuestXp, setNewQuestXp] = useState(25);
  const [newQuestItemName, setNewQuestItemName] = useState('');

  // Character Editor Sub-state
  const [charEditItemName, setCharEditItemName] = useState('');
  const [charEditItemType, setCharEditItemType] = useState<'arma' | 'armadura' | 'item'>('arma');
  const [charEditItemBonus, setCharEditItemBonus] = useState(2);
  const [charBonusXp, setCharBonusXp] = useState(20);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const targetVillage = villages.find((v) => v.id === selectedVillageId) || villages[0];

  // Open NPC Creation
  const handleOpenCreateNPC = () => {
    const newNpc: VillageNPC = {
      id: `npc_dev_${Date.now()}`,
      name: 'Novo NPC Primal',
      role: 'Caçador de Anomalias',
      race: 'Povo Felino',
      eco: 'Eco da Sombra',
      affinity: 'amigavel',
      dialogueGreeting: 'Que as névoas da Dobra não embacem seus olhos, viajante.',
      lore: 'Veterano das fendas sombrias que patrulha as fronteiras da vila.',
      locationInVillage: 'Posto de Vigia Leste',
      quests: [],
    };
    setEditingNpc(newNpc);
    setIsNpcModalOpen(true);
  };

  // Save NPC to Village
  const handleSaveNPC = () => {
    if (!editingNpc) return;
    if (!targetVillage) return;

    const exists = targetVillage.npcs.some((n) => n.id === editingNpc.id);
    const updatedNpcs = exists
      ? targetVillage.npcs.map((n) => (n.id === editingNpc.id ? editingNpc : n))
      : [...targetVillage.npcs, editingNpc];

    const updatedVillage: Village = {
      ...targetVillage,
      npcs: updatedNpcs,
    };

    onUpdateVillages(villages.map((v) => (v.id === updatedVillage.id ? updatedVillage : v)));
    setIsNpcModalOpen(false);
    setEditingNpc(null);
    showToast(`NPC "${editingNpc.name}" salvo com sucesso na vila ${targetVillage.name}!`);
  };

  // Delete NPC
  const handleDeleteNPC = (npcId: string) => {
    if (!targetVillage) return;
    const updatedVillage: Village = {
      ...targetVillage,
      npcs: targetVillage.npcs.filter((n) => n.id !== npcId),
    };
    onUpdateVillages(villages.map((v) => (v.id === updatedVillage.id ? updatedVillage : v)));
    showToast('NPC removido da vila.');
  };

  // Add Quest to NPC being edited
  const handleAddQuestToNpc = () => {
    if (!editingNpc) return;
    if (!newQuestTitle.trim()) {
      showToast('Insira um título para a missão.');
      return;
    }

    const quest: NPCQuest = {
      id: `qst_dev_${Date.now()}`,
      title: newQuestTitle.trim(),
      giverNpcId: editingNpc.id,
      giverNpcName: editingNpc.name,
      difficulty: newQuestDifficulty,
      summary: newQuestBriefing.slice(0, 100) || 'Missão nas terras da Dobra',
      briefingDialogue: newQuestBriefing || 'Precisamos da sua ajuda para lidar com uma anomalia.',
      completionDialogue: newQuestCompletion || 'Excelente trabalho! Os ancestrais honram sua coragem.',
      targetLocation: targetVillage.name,
      status: 'disponivel',
      steps: [
        {
          id: `step_1`,
          description: 'Investigar os rastros de corrupção da Dobra',
          testRequired: true,
          skill: 'sobrevivencia',
          difficulty: 14,
        },
      ],
      reward: {
        xp: newQuestXp,
        fluxReward: 5,
        item: newQuestItemName
          ? {
              name: newQuestItemName,
              type: 'arma',
              bonusDamage: 2,
              description: 'Item lendário entregue como recompensa de missão.',
            }
          : undefined,
      },
    };

    setEditingNpc({
      ...editingNpc,
      quests: [...editingNpc.quests, quest],
    });

    setIsQuestModalOpen(false);
    setNewQuestTitle('');
    setNewQuestBriefing('');
    setNewQuestCompletion('');
    setNewQuestItemName('');
    showToast(`Missão "${quest.title}" vinculada ao NPC!`);
  };

  // Add Item to Character's Particular Inventory
  const handleAddItemToCharacter = () => {
    if (!charEditItemName.trim()) return;
    const newItem: InventoryItem = {
      id: `item_dev_${Date.now()}`,
      name: charEditItemName.trim(),
      type: charEditItemType,
      bonusDamage: charEditItemType === 'arma' ? charEditItemBonus : undefined,
      armorReduction: charEditItemType === 'armadura' ? charEditItemBonus : undefined,
      weight: 1,
      description: 'Item concedido ou forjado via Modo Desenvolvedor.',
    };

    onUpdateCharacter({
      ...character,
      inventory: [...(character.inventory || []), newItem],
    });
    setCharEditItemName('');
    showToast(`Item "${newItem.name}" adicionado ao inventário particular do personagem!`);
  };

  // Remove Item from Character
  const handleRemoveItemFromCharacter = (itemId: string) => {
    onUpdateCharacter({
      ...character,
      inventory: (character.inventory || []).filter((i) => i.id !== itemId),
    });
    showToast('Item removido do inventário.');
  };

  // Grant Free XP in Developer Mode
  const handleGrantDevXp = () => {
    const curXp = character.xp ?? 0;
    const curTot = character.totalXp ?? curXp;
    onUpdateCharacter({
      ...character,
      xp: curXp + charBonusXp,
      totalXp: curTot + charBonusXp,
    });
    showToast(`+${charBonusXp} XP adicionado ao personagem.`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Developer Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-purple-500/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/40">
              <Code className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-purple-300 tracking-wider uppercase">
                  MODO DESENVOLVEDOR • CENTRAL DE CONFIGURAÇÃO
                </h1>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[10px] font-mono font-bold">
                  ADMIN / WORLD BUILDER
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Edite NPCs, missões, fichas de personagens, fórmulas de cálculo, vilas e encontros de aventura
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onReturnToMainMenu}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Menu Principal
            </button>

            <button
              type="button"
              onClick={onSwitchToPlayerMode}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-zinc-950" /> Testar no Modo Jogador
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar pb-2">
          <button
            type="button"
            onClick={() => setActiveDevTab('npcs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeDevTab === 'npcs'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-4 h-4" /> Criador &amp; Gerenciador de NPCs
          </button>

          <button
            type="button"
            onClick={() => setActiveDevTab('characters')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeDevTab === 'characters'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" /> Editor de Personagens Criados
          </button>

          <button
            type="button"
            onClick={() => setActiveDevTab('villages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeDevTab === 'villages'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Home className="w-4 h-4" /> Editor de Vilas &amp; Locais
          </button>

          <button
            type="button"
            onClick={() => setActiveDevTab('bestiary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeDevTab === 'bestiary'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Skull className="w-4 h-4 text-rose-300" /> Planilhas de Monstros &amp; Bestiário
          </button>

          <button
            type="button"
            onClick={() => setActiveDevTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeDevTab === 'rules'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Shield className="w-4 h-4" /> Regras, Fórmulas &amp; Bestiário
          </button>

          <button
            type="button"
            onClick={() => setActiveDevTab('saves')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeDevTab === 'saves'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Save className="w-4 h-4" /> Central de Saves &amp; Backup
          </button>
        </div>
      </header>

      {/* Feedback Toast */}
      {feedback && (
        <div className="max-w-7xl mx-auto px-4 pt-3 w-full">
          <div className="p-3 bg-purple-950/80 border border-purple-600 text-purple-200 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-purple-400 hover:text-purple-100 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: CRIADOR & GERENCIADOR DE NPCS */}
        {activeDevTab === 'npcs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-black text-purple-300">
                  MODO DE CRIAÇÃO E EDIÇÃO DE NPCS
                </h2>
                <p className="text-xs text-zinc-400">
                  Crie NPCs que aparecerão nas vilas, configure seus diálogos, lore e crie missões com recompensas de XP e itens.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedVillageId}
                  onChange={(e) => {
                    setSelectedVillageId(e.target.value);
                    onSelectActiveVillage(e.target.value);
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      Vila: {v.name} ({v.npcs.length} NPCs)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleOpenCreateNPC}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> Criar Novo NPC
                </button>
              </div>
            </div>

            {/* List of NPCs in selected village */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {targetVillage?.npcs.map((npc) => (
                <div
                  key={npc.id}
                  className="p-4 bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 rounded-2xl space-y-3 transition shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-purple-300 transition">
                        {npc.name}
                      </h3>
                      <p className="text-xs text-purple-400 font-mono">
                        {npc.role} • {npc.race}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 bg-zinc-950 text-zinc-400 text-[10px] font-mono rounded border border-zinc-800">
                      {npc.affinity}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 italic">"{npc.dialogueGreeting}"</p>

                  <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span>Local: {npc.locationInVillage}</span>
                    <span className="text-amber-400 font-semibold">{npc.quests.length} Missões</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNpc({ ...npc });
                        setIsNpcModalOpen(true);
                      }}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNPC(npc.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Excluir NPC"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EDITOR DE PERSONAGENS CRIADOS */}
        {activeDevTab === 'characters' && (
          <div className="space-y-6">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-amber-400">
                  EDITOR DE PERSONAGENS CRIADOS
                </h2>
                <p className="text-xs text-zinc-400">
                  Inspecione e ajuste diretamente atributos, perícias, inventário particular e pontos de XP do personagem ativo.
                </p>
              </div>

              {/* Quick XP Grant */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Conceder XP:</span>
                <input
                  type="number"
                  value={charBonusXp}
                  onChange={(e) => setCharBonusXp(parseInt(e.target.value) || 0)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono w-20 text-center"
                />
                <button
                  type="button"
                  onClick={handleGrantDevXp}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition"
                >
                  + Conceder
                </button>
              </div>
            </div>

            {/* Character Basic Info Editor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Identidade &amp; Arquétipo</h3>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nome:</label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => onUpdateCharacter({ ...character, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Raça Bestial:</label>
                  <input
                    type="text"
                    value={character.race}
                    onChange={(e) => onUpdateCharacter({ ...character, race: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Classe / Vocação:</label>
                  <input
                    type="text"
                    value={character.className}
                    onChange={(e) => onUpdateCharacter({ ...character, className: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100"
                  />
                </div>
              </div>

              {/* Attributes Editor */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Atributos Base</h3>
                <div className="grid grid-cols-2 gap-2">
                  {rulesConfig.attributes.map((attr) => (
                    <div key={attr.key} className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <span className="text-xs font-bold text-amber-400">{attr.key}:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={character.attributes[attr.key] || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          onUpdateCharacter({
                            ...character,
                            attributes: { ...character.attributes, [attr.key]: val },
                          });
                        }}
                        className="w-12 bg-zinc-900 border border-zinc-700 text-center text-xs font-mono font-bold text-zinc-100 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pools Editor */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Reservas Vitais</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400">Vida (HP):</span>
                    <div className="flex gap-1 items-center font-mono">
                      <input
                        type="number"
                        value={character.hpCurrent}
                        onChange={(e) => onUpdateCharacter({ ...character, hpCurrent: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-zinc-950 border border-zinc-800 text-center rounded p-1 text-zinc-200"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        value={character.hpMax}
                        onChange={(e) => onUpdateCharacter({ ...character, hpMax: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-zinc-950 border border-zinc-800 text-center rounded p-1 text-zinc-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400">Fluxo Vital:</span>
                    <div className="flex gap-1 items-center font-mono">
                      <input
                        type="number"
                        value={character.fluxoCurrent}
                        onChange={(e) => onUpdateCharacter({ ...character, fluxoCurrent: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-zinc-950 border border-zinc-800 text-center rounded p-1 text-zinc-200"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        value={character.fluxoMax}
                        onChange={(e) => onUpdateCharacter({ ...character, fluxoMax: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-zinc-950 border border-zinc-800 text-center rounded p-1 text-zinc-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">XP Disponível:</span>
                    <input
                      type="number"
                      value={character.xp ?? 0}
                      onChange={(e) => onUpdateCharacter({ ...character, xp: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-zinc-950 border border-zinc-800 text-center font-mono font-bold text-amber-300 rounded p-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Particular Inventory Management */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Inventário Particular do Personagem ({character.inventory?.length || 0} itens)
                </h3>

                {/* Add Item form */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome do item..."
                    value={charEditItemName}
                    onChange={(e) => setCharEditItemName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 w-48"
                  />
                  <select
                    value={charEditItemType}
                    onChange={(e) => setCharEditItemType(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300"
                  >
                    <option value="arma">Arma</option>
                    <option value="armadura">Armadura</option>
                    <option value="item">Consumível/Item</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={charEditItemBonus}
                    onChange={(e) => setCharEditItemBonus(parseInt(e.target.value) || 1)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono w-14 text-center"
                    title="Bônus de dano ou redução de dano"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemToCharacter}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition"
                  >
                    + Adicionar Item
                  </button>
                </div>
              </div>

              {/* Inventory items grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(character.inventory || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-200">{item.name}</div>
                      <div className="text-[11px] text-zinc-500 capitalize">
                        {item.type} {item.bonusDamage ? `• Dano +${item.bonusDamage}` : ''}{' '}
                        {item.armorReduction ? `• Armadura ${item.armorReduction}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemFromCharacter(item.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                      title="Remover item da bolsa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EDITOR DE VILAS & LOCAIS */}
        {activeDevTab === 'villages' && (
          <div className="space-y-6">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-emerald-400">
                  EDITOR DE VILAS &amp; BIOMAS PRIMAIS
                </h2>
                <p className="text-xs text-zinc-400">
                  Gerencie as vilas do mundo, níveis de prosperidade, defesas e zonas de perigo da Dobra.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newVil: Village = {
                    id: `vil_${Date.now()}`,
                    name: 'Nova Vila da Dobra',
                    biome: 'Florestas Cristalinas',
                    description: 'Assentamento recente erguido em torno de uma fonte pura de seiva.',
                    defenseLevel: 3,
                    prosperity: 2,
                    dangerZone: 'Zona Cinzenta',
                    facilities: [
                      { id: 'f1', name: 'Forja Rúnica', type: 'forja', level: 1, description: 'Reparo e confecção de armas' },
                    ],
                    npcs: [],
                  };
                  onUpdateVillages([...villages, newVil]);
                  showToast('Nova vila adicionada ao mundo!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Criar Nova Vila
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {villages.map((v) => (
                <div key={v.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{v.name}</h3>
                      <p className="text-xs text-emerald-400 font-mono">{v.biome} • {v.dangerZone}</p>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">{v.npcs.length} NPCs</span>
                  </div>

                  <p className="text-xs text-zinc-400">{v.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                    <span>Defesa: Nível {v.defenseLevel}</span>
                    <span>Prosperidade: Nível {v.prosperity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: BESTIÁRIO & PLANILHAS DE MONSTROS */}
        {activeDevTab === 'bestiary' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-rose-950/60 to-zinc-900 border border-rose-800/40 rounded-2xl shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-rose-200 uppercase tracking-wide flex items-center gap-2">
                    <Skull className="w-5 h-5 text-rose-400" /> Bestiário Primal &amp; Planilhas de Monstros LV8
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {Object.keys(bestiary).length} Criaturas
                  </span>
                </div>
                <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                  Crie, edite e personalize monstros com atributos balanceados, fotos para o Bestiário, tokens (emojis ou imagens personalizadas) para o grid de combate tático e a fórmula oficial de iniciativa: <strong>PER (d6) + (Vigilância × 3)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetBestiary}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700"
                  title="Restaurar bestiário para os monstros padrão"
                >
                  <RotateCcw className="w-4 h-4" /> Restaurar Padrão
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateMonster}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-rose-950/50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Criar Novo Monstro
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Filtrar por nome da criatura, espécie ou porte..."
                value={monsterSearchQuery}
                onChange={(e) => setMonsterSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-zinc-100 placeholder-zinc-500 outline-none w-full"
              />
              {monsterSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMonsterSearchQuery('')}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Monsters Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(bestiary)
                .filter((m) => {
                  if (!monsterSearchQuery.trim()) return true;
                  const q = monsterSearchQuery.toLowerCase();
                  return (
                    m.name.toLowerCase().includes(q) ||
                    (m.race || '').toLowerCase().includes(q) ||
                    (m.className || '').toLowerCase().includes(q) ||
                    (m.dangerLevel || '').toLowerCase().includes(q)
                  );
                })
                .map((m) => {
                  const per = m.attributes['PER'] || 3;
                  const vig = m.skills?.['vigilancia'] ?? (m.skills?.['sobrevivencia'] ? Math.min(2, m.skills['sobrevivencia']) : 1);
                  const vigBonus = vig * 3;
                  const initFA = `${per}d6+${vigBonus}`;
                  const desloc = (m.attributes['AGI'] || 3) * 3;

                  return (
                    <div
                      key={m.id}
                      className="bg-zinc-900/90 border border-zinc-800 hover:border-rose-500/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-4 group shadow-xl"
                    >
                      <div className="space-y-3">
                        {/* Header with portrait and token */}
                        <div className="flex items-start gap-3">
                          {/* Portrait or Token */}
                          <div className="relative w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : m.tokenUrl ? (
                              <img src={m.tokenUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl select-none">{m.tokenEmoji || '🦖'}</span>
                            )}

                            {/* Token Badge */}
                            <div
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-950 border border-rose-500 flex items-center justify-center text-xs shadow"
                              title="Token do Grid de Combate"
                            >
                              {m.tokenUrl ? (
                                <img src={m.tokenUrl} alt="Token" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span>{m.tokenEmoji || '🦖'}</span>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-sm font-bold text-zinc-100 group-hover:text-rose-300 transition truncate">
                                {m.name}
                              </strong>
                            </div>
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {m.race || 'Predador'} • {m.className || 'Besta'}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {m.dangerLevel || 'Perigoso'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400">
                                {m.size || 'Médio'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400">
                                IA: {m.aiIntelligence}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Vitals Grid */}
                        <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                          <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                            <span className="text-[9px] text-rose-400 block font-sans font-bold">Vida</span>
                            <strong className="text-zinc-200">{m.hpMax} HP</strong>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                            <span className="text-[9px] text-cyan-400 block font-sans font-bold">Fluxo</span>
                            <strong className="text-zinc-200">{m.fluxoMax}</strong>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                            <span className="text-[9px] text-zinc-400 block font-sans font-bold">Defesa</span>
                            <strong className="text-zinc-200">FD {m.defense}</strong>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                            <span className="text-[9px] text-amber-400 block font-sans font-bold">Armadura</span>
                            <strong className="text-amber-300">-{m.armor || 0}</strong>
                          </div>
                        </div>

                        {/* Initiative & Speed formula badge */}
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-purple-900/40 space-y-1 text-xs font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300 font-sans font-bold flex items-center gap-1 text-[11px]">
                              <Eye className="w-3 h-3 text-purple-400" /> Iniciativa Oficial:
                            </span>
                            <strong className="text-purple-200 font-black">FA: {initFA}</strong>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-zinc-500">
                            <span>Deslocamento:</span>
                            <span className="text-amber-300">{desloc} metros (AGI×3)</span>
                          </div>
                        </div>

                        {/* Powers list */}
                        <div className="text-[11px] text-zinc-400 space-y-0.5">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                            Ataques &amp; Manobras:
                          </span>
                          {(m.powers || []).slice(0, 2).map((p) => (
                            <div key={p.id} className="truncate text-zinc-300">
                              • <strong className="text-rose-300">{p.name}</strong> (Dif {p.dificuldade})
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenViewMonster(m)}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-zinc-700 flex-1 justify-center"
                          title="Ver planilha completa oficial com todos os atributos e testes"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-400" />
                          <span>Planilha</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditMonster(m)}
                          className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold rounded-xl transition flex items-center gap-1 flex-1 justify-center"
                          title="Editar atributos, foto, tokens e poderes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onOpenDiceRoller(
                              per,
                              `Iniciativa: ${m.name} (FA ${initFA})`,
                              15
                            )
                          }
                          className="p-1.5 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/40 text-purple-300 rounded-xl transition"
                          title="Rolar iniciativa oficial deste monstro"
                        >
                          <Dices className="w-4 h-4" />
                        </button>

                        {m.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMonster(m.id)}
                            className="p-1.5 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 rounded-xl transition"
                            title="Excluir este monstro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: REGRAS, FÓRMULAS & BESTIÁRIO */}
        {activeDevTab === 'rules' && (
          <div className="space-y-6">
            <RulesAndCalculationsManager
              rulesConfig={rulesConfig}
              onUpdateRules={onUpdateRules}
              character={character}
              onUpdateCharacter={onUpdateCharacter}
              onOpenDiceRoller={onOpenDiceRoller}
            />
          </div>
        )}

        {/* TAB 5: CENTRAL DE SAVES & BACKUP */}
        {activeDevTab === 'saves' && (
          <div className="space-y-6">
            <SaveManager
              character={character}
              rulesConfig={rulesConfig}
              adventureState={adventureState}
              villages={villages}
              activeVillageId={activeVillageId}
              onLoadSave={() => {}}
              onLoadAdventureOnly={() => {}}
            />
          </div>
        )}
      </main>

      {/* NPC CREATE / EDIT MODAL */}
      {isNpcModalOpen && editingNpc && (
        <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-purple-500/40 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-purple-950/40 flex items-center justify-between">
              <h3 className="text-base font-black text-purple-300">
                EDITAR / CRIAR NPC NA VILA: {targetVillage?.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsNpcModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nome do NPC:</label>
                  <input
                    type="text"
                    value={editingNpc.name}
                    onChange={(e) => setEditingNpc({ ...editingNpc, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Função / Ocupação:</label>
                  <input
                    type="text"
                    value={editingNpc.role}
                    onChange={(e) => setEditingNpc({ ...editingNpc, role: e.target.value })}
                    placeholder="Ex: Armeiro, Xamã, Ancião, Guarda"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Raça / Espécie Bestial:</label>
                  <input
                    type="text"
                    value={editingNpc.race}
                    onChange={(e) => setEditingNpc({ ...editingNpc, race: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Localização na Vila:</label>
                  <input
                    type="text"
                    value={editingNpc.locationInVillage}
                    onChange={(e) => setEditingNpc({ ...editingNpc, locationInVillage: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Frase de Saudação Inicial:</label>
                <input
                  type="text"
                  value={editingNpc.dialogueGreeting}
                  onChange={(e) => setEditingNpc({ ...editingNpc, dialogueGreeting: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Histórico / Lore do NPC:</label>
                <textarea
                  rows={2}
                  value={editingNpc.lore}
                  onChange={(e) => setEditingNpc({ ...editingNpc, lore: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200"
                />
              </div>

              {/* Quests linked to this NPC */}
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider">
                    Missões Atribuídas a este NPC ({editingNpc.quests.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsQuestModalOpen(true)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition"
                  >
                    + Nova Missão
                  </button>
                </div>

                <div className="space-y-2">
                  {editingNpc.quests.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-zinc-200">{q.title}</div>
                        <div className="text-[11px] text-zinc-500">
                          Dificuldade: {q.difficulty} • Recompensa: {q.reward.xp} XP{' '}
                          {q.reward.item ? `• Item: ${q.reward.item.name}` : ''}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingNpc({
                            ...editingNpc,
                            quests: editingNpc.quests.filter((x) => x.id !== q.id),
                          })
                        }
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsNpcModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveNPC}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow"
              >
                Salvar NPC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE QUEST MODAL */}
      {isQuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-amber-400 uppercase tracking-wide">
              CRIAR MISSÃO PARA O NPC
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Título da Missão:</label>
              <input
                type="text"
                value={newQuestTitle}
                onChange={(e) => setNewQuestTitle(e.target.value)}
                placeholder="Ex: O Ninho do Raptor de Fenda"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Dificuldade:</label>
                <select
                  value={newQuestDifficulty}
                  onChange={(e) => setNewQuestDifficulty(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Médio">Médio</option>
                  <option value="Difícil">Difícil</option>
                  <option value="Heroico">Heroico</option>
                  <option value="Brutal">Brutal</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Recompensa em XP:</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={newQuestXp}
                  onChange={(e) => setNewQuestXp(parseInt(e.target.value) || 20)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Item Recompensa (Opcional):</label>
              <input
                type="text"
                value={newQuestItemName}
                onChange={(e) => setNewQuestItemName(e.target.value)}
                placeholder="Ex: Lança de Dente de Raptor"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Diálogo de Briefing:</label>
              <textarea
                rows={2}
                value={newQuestBriefing}
                onChange={(e) => setNewQuestBriefing(e.target.value)}
                placeholder="O que o NPC diz quando passa a missão..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuestModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddQuestToNpc}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition"
              >
                Salvar Missão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
