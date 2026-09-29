import React, { useState } from 'react';
import {
  Village,
  VillageNPC,
  NPCQuest,
  NPCQuestStep,
  CharacterSheet,
  DiceRollResult,
} from '../types/lv8';
import { createEmptyVillage, createEmptyNPC, createEmptyQuest } from '../utils/villageDefaults';
import { resolveSkillValue } from '../utils/characterDefaults';
import { rollLV8Dice } from '../utils/dice';
import { playDiceSound, playExplosionSound, playBotchSound } from '../utils/audio';
import {
  Home,
  Users,
  Compass,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Shield,
  Coins,
  MapPin,
  CheckCircle2,
  Swords,
  ChevronRight,
  Flame,
  MessageSquare,
  Gift,
  ArrowRight,
  AlertTriangle,
  Play,
  Hammer,
  ShieldAlert,
  Dices,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface VillageHubProps {
  villages: Village[];
  activeVillageId: string;
  onUpdateVillages: (villages: Village[]) => void;
  onSelectActiveVillage: (villageId: string) => void;
  character: CharacterSheet;
  onUpdateCharacter: (char: CharacterSheet) => void;
  onStartCombat: (encounter: { name: string; enemyType: string; count: number }) => void;
  onOpenDiceRoller: (dice: number, title: string, diff?: number) => void;
}

export const VillageHub: React.FC<VillageHubProps> = ({
  villages,
  activeVillageId,
  onUpdateVillages,
  onSelectActiveVillage,
  character,
  onUpdateCharacter,
  onStartCombat,
  onOpenDiceRoller,
}) => {
  const currentVillage = villages.find((v) => v.id === activeVillageId) || villages[0];

  const [selectedNpcId, setSelectedNpcId] = useState<string>(
    currentVillage?.npcs[0]?.id || ''
  );

  // Modals state
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [editingNpc, setEditingNpc] = useState<VillageNPC | null>(null);
  const [editingQuest, setEditingQuest] = useState<NPCQuest | null>(null);
  const [activeQuestRunner, setActiveQuestRunner] = useState<NPCQuest | null>(null);
  const [runnerCurrentStepIndex, setRunnerCurrentStepIndex] = useState<number>(0);
  const [runnerStepResult, setRunnerStepResult] = useState<DiceRollResult | null>(null);
  const [runnerMessage, setRunnerMessage] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [villageNotice, setVillageNotice] = useState<string | null>(null);
  const [completedQuestNotice, setCompletedQuestNotice] = useState<{
    title: string;
    rewardText: string;
    dialogue: string;
  } | null>(null);

  const selectedNpc = currentVillage?.npcs.find((n) => n.id === selectedNpcId) || currentVillage?.npcs[0];

  // Helper to save entire village state
  const saveVillage = (updated: Village) => {
    const nextList = villages.map((v) => (v.id === updated.id ? updated : v));
    onUpdateVillages(nextList);
  };

  // Village CRUD
  const handleCreateVillage = () => {
    const newV = createEmptyVillage();
    const next = [...villages, newV];
    onUpdateVillages(next);
    onSelectActiveVillage(newV.id);
    setEditingVillage(newV);
  };

  const handleDeleteVillage = (vilId: string) => {
    if (villages.length <= 1) {
      setVillageNotice('Você precisa manter ao menos uma vila no mundo do jogo.');
      setTimeout(() => setVillageNotice(null), 4000);
      return;
    }
    const filtered = villages.filter((v) => v.id !== vilId);
    onUpdateVillages(filtered);
    onSelectActiveVillage(filtered[0].id);
    setVillageNotice('Vila excluída com sucesso.');
    setTimeout(() => setVillageNotice(null), 3000);
  };

  const handleSaveVillageEdit = () => {
    if (!editingVillage) return;
    saveVillage(editingVillage);
    setEditingVillage(null);
  };

  // NPC CRUD
  const handleAddNPC = () => {
    if (!currentVillage) return;
    const newN = createEmptyNPC(currentVillage.id);
    const updatedVillage: Village = {
      ...currentVillage,
      npcs: [...currentVillage.npcs, newN],
    };
    saveVillage(updatedVillage);
    setSelectedNpcId(newN.id);
    setEditingNpc(newN);
  };

  const handleDeleteNPC = (npcId: string) => {
    if (!currentVillage) return;
    const updatedVillage: Village = {
      ...currentVillage,
      npcs: currentVillage.npcs.filter((n) => n.id !== npcId),
    };
    saveVillage(updatedVillage);
    if (selectedNpcId === npcId) {
      setSelectedNpcId(updatedVillage.npcs[0]?.id || '');
    }
    setVillageNotice('NPC excluído.');
    setTimeout(() => setVillageNotice(null), 3000);
  };

  const handleSaveNPCEdit = () => {
    if (!editingNpc || !currentVillage) return;
    const updatedNpcs = currentVillage.npcs.map((n) => (n.id === editingNpc.id ? editingNpc : n));
    saveVillage({
      ...currentVillage,
      npcs: updatedNpcs,
    });
    setEditingNpc(null);
  };

  // Quest CRUD
  const handleAddQuest = (npc: VillageNPC) => {
    if (!currentVillage) return;
    const newQ = createEmptyQuest(npc.id, npc.name);
    const updatedNpc: VillageNPC = {
      ...npc,
      quests: [...npc.quests, newQ],
    };
    const updatedVillage: Village = {
      ...currentVillage,
      npcs: currentVillage.npcs.map((n) => (n.id === npc.id ? updatedNpc : n)),
    };
    saveVillage(updatedVillage);
    setEditingQuest(newQ);
  };

  const handleDeleteQuest = (npcId: string, questId: string) => {
    if (!currentVillage) return;
    const updatedVillage: Village = {
      ...currentVillage,
      npcs: currentVillage.npcs.map((n) => {
        if (n.id !== npcId) return n;
        return {
          ...n,
          quests: n.quests.filter((q) => q.id !== questId),
        };
      }),
    };
    saveVillage(updatedVillage);
    setVillageNotice('Missão excluída.');
    setTimeout(() => setVillageNotice(null), 3000);
  };

  const handleSaveQuestEdit = () => {
    if (!editingQuest || !currentVillage || !selectedNpc) return;
    const updatedVillage: Village = {
      ...currentVillage,
      npcs: currentVillage.npcs.map((n) => {
        if (n.id !== editingQuest.giverNpcId) return n;
        const quests = n.quests.some((q) => q.id === editingQuest.id)
          ? n.quests.map((q) => (q.id === editingQuest.id ? editingQuest : q))
          : [...n.quests, editingQuest];
        return { ...n, quests };
      }),
    };
    saveVillage(updatedVillage);
    setEditingQuest(null);
  };

  // Generate Quest with AI
  const handleGenerateQuestWithAI = async (npc: VillageNPC) => {
    if (!currentVillage) return;
    setIsGeneratingAI(true);

    try {
      const response = await fetch('/api/gemini/npc-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villageName: currentVillage.name,
          villageBiome: currentVillage.biome,
          npcName: npc.name,
          npcRole: npc.role,
          difficulty: 'Médio',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newQuest: NPCQuest = {
          id: `ai_quest_${Date.now()}`,
          title: data.title || 'Caçada Misteriosa na Dobra',
          giverNpcId: npc.id,
          giverNpcName: npc.name,
          difficulty: data.difficulty || 'Médio',
          summary: data.summary || 'Uma missão desafiadora para ajudar o assentamento.',
          briefingDialogue: data.briefingDialogue || '"Preciso da sua ajuda, caçador."',
          completionDialogue: data.completionDialogue || '"Você salvou nossa tribo!"',
          targetLocation: data.targetLocation || 'Fronteiras Selvagens',
          steps: data.steps || [
            {
              id: 's1',
              description: 'Investigar os rastros.',
              testRequired: true,
              attribute: 'PER',
              skill: 'rastreio',
              difficulty: 12,
            },
          ],
          reward: data.reward || {
            xp: 20,
            fluxReward: 5,
            item: {
              name: 'Amuleto de Osso Fóssil',
              type: 'item',
              description: 'Concede +1 dado em Sobrevivência.',
            },
            narrativeReward: 'A vila prospera com sua conquista.',
          },
          status: 'disponivel',
        };

        const updatedVillage: Village = {
          ...currentVillage,
          npcs: currentVillage.npcs.map((n) =>
            n.id === npc.id ? { ...n, quests: [...n.quests, newQuest] } : n
          ),
        };
        saveVillage(updatedVillage);
      }
    } catch (e) {
      console.warn('AI Quest Generation fallback:', e);
      handleAddQuest(npc);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Quest Runner: Start Mission
  const handleStartQuestRunner = (quest: NPCQuest) => {
    setActiveQuestRunner(quest);
    setRunnerCurrentStepIndex(0);
    setRunnerStepResult(null);
    setRunnerMessage(null);
  };

  // Execute Step Test
  const handleExecuteStepTest = (step: NPCQuestStep) => {
    if (!step.testRequired) return;
    const attr = step.attribute || 'AGI';
    const diff = step.difficulty || 12;

    const attrVal = character.attributes[attr] || 3;
    const resolved = resolveSkillValue(step.skill, character);
    const skillVal = resolved.level;
    const dice = Math.max(1, attrVal + skillVal);

    playDiceSound();
    const roll = rollLV8Dice(dice, diff, 0, `Missão: ${step.description}`);
    setRunnerStepResult(roll);

    if (roll.isBotch) {
      playBotchSound();
      setRunnerMessage('💥 PÍFIO BRUTAL! Você cometeu um erro crítico e sofre 3 de dano!');
      onUpdateCharacter({
        ...character,
        hpCurrent: Math.max(0, character.hpCurrent - 3),
      });
    } else if (roll.success) {
      playExplosionSound();
      setRunnerMessage(`✨ SUCESSO! Você superou o desafio com margem de +${roll.marginOfSuccess}!`);
    } else {
      setRunnerMessage('⚠️ FALHA! Você não atingiu a dificuldade, sofrendo 1 de dano de desgaste.');
      onUpdateCharacter({
        ...character,
        hpCurrent: Math.max(0, character.hpCurrent - 1),
      });
    }
  };

  // Launch Combat from Quest Step
  const handleLaunchCombatFromStep = (step: NPCQuestStep) => {
    if (step.combatTrigger) {
      onStartCombat({
        name: step.combatTrigger.enemyName,
        enemyType: step.combatTrigger.enemyType,
        count: step.combatTrigger.count,
      });
      setActiveQuestRunner(null);
    }
  };

  // Advance Quest Step or Claim Reward
  const handleAdvanceStepOrComplete = () => {
    if (!activeQuestRunner || !currentVillage) return;

    if (runnerCurrentStepIndex < activeQuestRunner.steps.length - 1) {
      setRunnerCurrentStepIndex((idx) => idx + 1);
      setRunnerStepResult(null);
      setRunnerMessage(null);
    } else {
      // Completed! Deliver rewards to character!
      const reward = activeQuestRunner.reward;
      let updatedChar = { ...character };

      if (reward.fluxReward) {
        updatedChar.fluxoCurrent = Math.min(
          updatedChar.fluxoMax,
          updatedChar.fluxoCurrent + reward.fluxReward
        );
      }

      if (reward.xp) {
        const curXp = updatedChar.xp ?? 0;
        const totXp = updatedChar.totalXp ?? curXp;
        updatedChar.xp = curXp + reward.xp;
        updatedChar.totalXp = totXp + reward.xp;
        updatedChar.advancementHistory = [
          {
            id: `adv_qst_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            title: `Missão Concluída: ${activeQuestRunner.title}`,
            xpCost: -reward.xp,
            category: 'recurso',
            details: `Recompensa concedida por ${activeQuestRunner.giverNpcName} (+${reward.xp} XP).`,
          },
          ...(updatedChar.advancementHistory || []),
        ];
      }

      if (reward.item) {
        updatedChar.inventory = [
          ...(updatedChar.inventory || []),
          {
            id: `item_${Date.now()}`,
            name: reward.item.name,
            type: reward.item.type,
            bonusDamage: reward.item.bonusDamage,
            armorReduction: reward.item.armorReduction,
            description: reward.item.description,
          },
        ];
      }

      onUpdateCharacter(updatedChar);

      // Update quest status
      const updatedVillage: Village = {
        ...currentVillage,
        npcs: currentVillage.npcs.map((n) => {
          if (n.id !== activeQuestRunner.giverNpcId) return n;
          return {
            ...n,
            quests: n.quests.map((q) =>
              q.id === activeQuestRunner.id ? { ...q, status: 'concluida' } : q
            ),
          };
        }),
      };
      saveVillage(updatedVillage);
      setActiveQuestRunner(null);
      setCompletedQuestNotice({
        title: activeQuestRunner.title,
        rewardText: [
          reward.item ? `Item: ${reward.item.name}` : null,
          reward.fluxReward ? `Fluxo: +${reward.fluxReward}` : null,
          reward.xp ? `XP: +${reward.xp}` : null,
        ]
          .filter(Boolean)
          .join(' • '),
        dialogue: activeQuestRunner.completionDialogue || 'As bençãos dos ancestrais o acompanham.',
      });
    }
  };

  if (!currentVillage) {
    return (
      <div className="p-12 text-center text-zinc-500 bg-zinc-900 rounded-2xl border border-zinc-800">
        Nenhuma vila encontrada. Clique para criar uma nova vila!
        <div className="mt-4">
          <button
            type="button"
            onClick={handleCreateVillage}
            className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-xl"
          >
            Criar Primeira Vila
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Village Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Village Selector & Identity */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* Switcher dropdown */}
                <select
                  value={currentVillage.id}
                  onChange={(e) => onSelectActiveVillage(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1 text-sm font-black uppercase text-zinc-100 outline-none"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-bold border border-emerald-800/60">
                  {currentVillage.biome}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl line-clamp-1">
                {currentVillage.description}
              </p>
            </div>
          </div>

          {/* Village Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingVillage(currentVillage)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Editar Vila
            </button>

            <button
              type="button"
              onClick={handleCreateVillage}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Vila
            </button>

            <button
              type="button"
              onClick={() => handleDeleteVillage(currentVillage.id)}
              className="p-2 bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded-xl transition border border-zinc-800"
              title="Excluir Vila"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Village Stats & Danger Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Defesa:</span>
              <strong className="text-cyan-400 font-mono">{currentVillage.defenseLevel}/10</strong>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Prosperidade:</span>
              <strong className="text-amber-400 font-mono">{currentVillage.prosperity}/10</strong>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-300">
              <Users className="w-4 h-4 text-purple-400" />
              <span>NPCs:</span>
              <strong className="text-purple-400 font-mono">{currentVillage.npcs.length}</strong>
            </div>
          </div>

          {currentVillage.dangerZone && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{currentVillage.dangerZone}</span>
            </div>
          )}
        </div>
      </div>

      {villageNotice && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center justify-between">
          <span>{villageNotice}</span>
          <button
            type="button"
            onClick={() => setVillageNotice(null)}
            className="text-emerald-400 hover:text-emerald-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {completedQuestNotice && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/80 to-zinc-900 border border-emerald-500/50 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                Missão Concluída: {completedQuestNotice.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setCompletedQuestNotice(null)}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition"
            >
              Confirmar
            </button>
          </div>
          {completedQuestNotice.rewardText && (
            <p className="text-xs text-amber-300 font-semibold">
              Recompensas: {completedQuestNotice.rewardText}
            </p>
          )}
          <p className="text-xs text-zinc-300 italic border-l-2 border-emerald-500/40 pl-3 py-1">
            "{completedQuestNotice.dialogue}"
          </p>
        </div>
      )}

      {/* Main Grid: Left NPCs list, Right NPC details & Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: NPCs in the Village */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" /> Habitantes &amp; Mestres da Tribo
              </h4>

              <button
                type="button"
                onClick={handleAddNPC}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar NPC
              </button>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {currentVillage.npcs.map((npc) => {
                const isSelected = npc.id === selectedNpc?.id;
                const activeQuestsCount = npc.quests.filter((q) => q.status === 'disponivel').length;

                return (
                  <div
                    key={npc.id}
                    onClick={() => setSelectedNpcId(npc.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-zinc-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/40 text-zinc-100'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold truncate block">{npc.name}</strong>
                        {activeQuestsCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-mono font-bold border border-amber-500/40 shrink-0">
                            {activeQuestsCount} {activeQuestsCount === 1 ? 'Missão' : 'Missões'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{npc.role}</p>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {npc.race} • {npc.locationInVillage}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNpc(npc);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-zinc-900 transition"
                        title="Editar NPC"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNPC(npc.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition"
                        title="Excluir NPC"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {currentVillage.npcs.length === 0 && (
                <div className="text-center py-10 text-zinc-600 text-xs">
                  Nenhum NPC nesta aldeia. Crie habitantes para receber missões!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected NPC Lore, Dialogues & Quests */}
        <div className="lg:col-span-8 space-y-5">
          {selectedNpc ? (
            <>
              {/* NPC Showcase Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-zinc-100 uppercase tracking-wide">
                        {selectedNpc.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">
                        {selectedNpc.role}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {selectedNpc.race} ({selectedNpc.eco}) • Local: {selectedNpc.locationInVillage}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNpc(selectedNpc)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Editar NPC
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddQuest(selectedNpc)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase rounded-xl flex items-center gap-1.5 transition shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> Criar Missão
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateQuestWithAI(selectedNpc)}
                      disabled={isGeneratingAI}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow"
                      title="Gerar missão temática com Gemini AI"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAI ? 'Criando...' : 'Gerar com IA'}</span>
                    </button>
                  </div>
                </div>

                {/* NPC Dialogue Quote */}
                <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Fala do Habitante:
                  </span>
                  <p className="text-xs text-zinc-300 italic leading-relaxed">
                    {selectedNpc.dialogueGreeting}
                  </p>
                </div>

                {/* NPC Lore */}
                {selectedNpc.lore && (
                  <p className="text-xs text-zinc-400 leading-relaxed">{selectedNpc.lore}</p>
                )}
              </div>

              {/* Quests Offered by this NPC */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-400" />
                    Missões &amp; Aventuras de {selectedNpc.name} ({selectedNpc.quests.length})
                  </h4>
                </div>

                <div className="space-y-3">
                  {selectedNpc.quests.map((quest) => {
                    const isCompleted = quest.status === 'concluida';

                    return (
                      <div
                        key={quest.id}
                        className={`p-4 rounded-2xl border transition shadow-lg ${
                          isCompleted
                            ? 'bg-zinc-950/60 border-zinc-800/80 opacity-75'
                            : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/40'
                        }`}
                      >
                        {/* Header of Quest */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-black text-zinc-100">
                              {quest.title}
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                quest.difficulty === 'Brutal' || quest.difficulty === 'Heroico'
                                  ? 'bg-red-950/60 border-red-800/60 text-red-300'
                                  : quest.difficulty === 'Difícil'
                                    ? 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                                    : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                              }`}
                            >
                              Dificuldade: {quest.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isCompleted
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                              }`}
                            >
                              {isCompleted ? '✓ Concluída' : '● Disponível'}
                            </span>

                            <button
                              type="button"
                              onClick={() => setEditingQuest(quest)}
                              className="p-1 text-zinc-500 hover:text-amber-400"
                              title="Editar Missão"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuest(selectedNpc.id, quest.id)}
                              className="p-1 text-zinc-500 hover:text-red-400"
                              title="Excluir Missão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Summary & Location */}
                        <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
                          {quest.summary}
                        </p>

                        <div className="text-[11px] text-zinc-500 flex items-center gap-2 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Local: <strong className="text-zinc-300">{quest.targetLocation}</strong></span>
                        </div>

                        {/* Briefing quote */}
                        <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850 text-xs text-zinc-400 italic mb-3">
                          {quest.briefingDialogue}
                        </div>

                        {/* Steps List */}
                        <div className="space-y-1.5 mb-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Etapas da Aventura:
                          </span>
                          {quest.steps.map((st, i) => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between text-xs text-zinc-300"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-amber-400 text-[10px]">#{i + 1}</span>
                                <span>{st.description}</span>
                              </div>
                              {st.testRequired && (
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-amber-400 font-mono">
                                  {st.attribute} + {st.skill} (Dif {st.difficulty})
                                </span>
                              )}
                              {st.combatTrigger && (
                                <span className="px-2 py-0.5 rounded bg-rose-950 text-[10px] text-rose-300 border border-rose-800/40 font-bold flex items-center gap-1">
                                  <Swords className="w-3 h-3" /> {st.combatTrigger.count}x {st.combatTrigger.enemyName}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Reward info & Action */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                          <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Gift className="w-3.5 h-3.5" /> Recompensa:
                            </span>
                            {quest.reward.item && (
                              <span className="text-zinc-200 font-semibold">
                                {quest.reward.item.name}
                              </span>
                            )}
                            {quest.reward.fluxReward && (
                              <span className="text-cyan-400 font-mono font-bold">
                                +{quest.reward.fluxReward} Fluxo
                              </span>
                            )}
                            {quest.reward.xp && (
                              <span className="text-purple-400 font-mono font-bold">
                                +{quest.reward.xp} XP
                              </span>
                            )}
                          </div>

                          {!isCompleted ? (
                            <button
                              type="button"
                              onClick={() => handleStartQuestRunner(quest)}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 shadow transition hover:scale-105 active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-zinc-950" /> Jogar Missão
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartQuestRunner(quest)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold rounded-xl transition"
                            >
                              Rejogar Missão
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {selectedNpc.quests.length === 0 && (
                    <div className="p-8 text-center text-zinc-500 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs space-y-2">
                      <p>Este habitante ainda não possui nenhuma missão.</p>
                      <button
                        type="button"
                        onClick={() => handleAddQuest(selectedNpc)}
                        className="px-3 py-1.5 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs"
                      >
                        Criar Primeira Missão
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-zinc-500 bg-zinc-900 rounded-2xl border border-zinc-800">
              Selecione um NPC na lista ao lado para ver seus detalhes e missões.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Edit Village */}
      {editingVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" />
                Editar Vila / Assentamento
              </h3>
              <button
                type="button"
                onClick={() => setEditingVillage(null)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Nome da Vila:</label>
                <input
                  type="text"
                  value={editingVillage.name}
                  onChange={(e) => setEditingVillage({ ...editingVillage, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Bioma / Região:</label>
                <input
                  type="text"
                  value={editingVillage.biome}
                  onChange={(e) => setEditingVillage({ ...editingVillage, biome: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  placeholder="Ex: Floresta Primal, Ravina Vulcânica, Pântano dos Titãs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Descrição do Assentamento:</label>
                <textarea
                  value={editingVillage.description}
                  onChange={(e) =>
                    setEditingVillage({ ...editingVillage, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Defesa (1 a 10):</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editingVillage.defenseLevel}
                    onChange={(e) =>
                      setEditingVillage({
                        ...editingVillage,
                        defenseLevel: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Prosperidade (1 a 10):</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editingVillage.prosperity}
                    onChange={(e) =>
                      setEditingVillage({
                        ...editingVillage,
                        prosperity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Aura de Perigo Próxima:</label>
                <input
                  type="text"
                  value={editingVillage.dangerZone}
                  onChange={(e) =>
                    setEditingVillage({ ...editingVillage, dangerZone: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  placeholder="Ex: Aura de Silêncio Menor (30 metros)"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingVillage(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveVillageEdit}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase rounded-xl"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit NPC */}
      {editingNpc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Editar NPC / Habitante
              </h3>
              <button
                type="button"
                onClick={() => setEditingNpc(null)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Nome do NPC:</label>
                <input
                  type="text"
                  value={editingNpc.name}
                  onChange={(e) => setEditingNpc({ ...editingNpc, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Papel / Profissão:</label>
                  <input
                    type="text"
                    value={editingNpc.role}
                    onChange={(e) => setEditingNpc({ ...editingNpc, role: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    placeholder="Ex: Ferreiro, Xamã, Batedor"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Raça / Povo:</label>
                  <input
                    type="text"
                    value={editingNpc.race}
                    onChange={(e) => setEditingNpc({ ...editingNpc, race: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    placeholder="Ex: Povo Felino, Povo Canino"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Eco da Linhagem:</label>
                  <input
                    type="text"
                    value={editingNpc.eco}
                    onChange={(e) => setEditingNpc({ ...editingNpc, eco: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    placeholder="Ex: Eco do Fogo, Eco da Sombra"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Local na Vila:</label>
                  <input
                    type="text"
                    value={editingNpc.locationInVillage}
                    onChange={(e) =>
                      setEditingNpc({ ...editingNpc, locationInVillage: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    placeholder="Ex: Forja, Altar, Portão Sul"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Fala / Saudação do NPC:</label>
                <textarea
                  value={editingNpc.dialogueGreeting}
                  onChange={(e) =>
                    setEditingNpc({ ...editingNpc, dialogueGreeting: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-zinc-100 italic outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">História &amp; Lore do NPC:</label>
                <textarea
                  value={editingNpc.lore}
                  onChange={(e) => setEditingNpc({ ...editingNpc, lore: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-zinc-100 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingNpc(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNPCEdit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase rounded-xl"
              >
                Salvar NPC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Quest */}
      {editingQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                Editar Missão do NPC ({editingQuest.giverNpcName})
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuest(null)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Título da Missão:</label>
                <input
                  type="text"
                  value={editingQuest.title}
                  onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Dificuldade:</label>
                  <select
                    value={editingQuest.difficulty}
                    onChange={(e) =>
                      setEditingQuest({
                        ...editingQuest,
                        difficulty: e.target.value as NPCQuest['difficulty'],
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                    <option value="Heroico">Heroico</option>
                    <option value="Brutal">Brutal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Local Alvo:</label>
                  <input
                    type="text"
                    value={editingQuest.targetLocation}
                    onChange={(e) =>
                      setEditingQuest({ ...editingQuest, targetLocation: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Resumo do Objetivo:</label>
                <textarea
                  value={editingQuest.summary}
                  onChange={(e) => setEditingQuest({ ...editingQuest, summary: e.target.value })}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Falas de Instrução do NPC:</label>
                <textarea
                  value={editingQuest.briefingDialogue}
                  onChange={(e) =>
                    setEditingQuest({ ...editingQuest, briefingDialogue: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-zinc-100 italic outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Falas de Conclusão / Agradecimento:</label>
                <textarea
                  value={editingQuest.completionDialogue}
                  onChange={(e) =>
                    setEditingQuest({ ...editingQuest, completionDialogue: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-zinc-100 italic outline-none"
                />
              </div>

              {/* Recompensa */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
                  Recompensas da Missão:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Fluxo Bônus:</label>
                    <input
                      type="number"
                      value={editingQuest.reward.fluxReward || 0}
                      onChange={(e) =>
                        setEditingQuest({
                          ...editingQuest,
                          reward: {
                            ...editingQuest.reward,
                            fluxReward: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 text-xs text-zinc-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block">XP Concedido:</label>
                    <input
                      type="number"
                      value={editingQuest.reward.xp || 0}
                      onChange={(e) =>
                        setEditingQuest({
                          ...editingQuest,
                          reward: {
                            ...editingQuest.reward,
                            xp: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 text-xs text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block">Item / Butim Concedido:</label>
                  <input
                    type="text"
                    value={editingQuest.reward.item?.name || ''}
                    onChange={(e) =>
                      setEditingQuest({
                        ...editingQuest,
                        reward: {
                          ...editingQuest.reward,
                          item: {
                            name: e.target.value,
                            type: editingQuest.reward.item?.type || 'item',
                            bonusDamage: editingQuest.reward.item?.bonusDamage || 0,
                            armorReduction: editingQuest.reward.item?.armorReduction || 0,
                            description: editingQuest.reward.item?.description || 'Item concedido pela tribo.',
                          },
                        },
                      })
                    }
                    placeholder="Nome do item recebido..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 text-xs text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingQuest(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuestEdit}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase rounded-xl"
              >
                Salvar Missão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Interactive Quest Runner (Playing the Quest) */}
      {activeQuestRunner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Missão do NPC: {activeQuestRunner.giverNpcName}
                </span>
                <h3 className="text-base font-black text-zinc-100">{activeQuestRunner.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuestRunner(null)}
                className="text-zinc-400 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Briefing dialogue */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 italic">
              {activeQuestRunner.briefingDialogue}
            </div>

            {/* Current Step Tracker */}
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold uppercase tracking-wider text-amber-400">
                  Etapa {runnerCurrentStepIndex + 1} de {activeQuestRunner.steps.length}
                </span>
                <span>Local: {activeQuestRunner.targetLocation}</span>
              </div>

              {(() => {
                const currentStep = activeQuestRunner.steps[runnerCurrentStepIndex];
                if (!currentStep) return null;

                return (
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                    <p className="text-xs font-bold text-zinc-200">{currentStep.description}</p>

                    {/* Skill Test Action */}
                    {currentStep.testRequired && (
                      <div className="space-y-2 pt-2 border-t border-zinc-850">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">
                            Teste Exigido: <strong className="text-amber-400">{currentStep.attribute}</strong> +{' '}
                            <strong className="text-amber-400">{currentStep.skill}</strong>
                          </span>
                          <span className="font-mono text-zinc-400">Dificuldade: {currentStep.difficulty}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteStepTest(currentStep)}
                          className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-zinc-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow"
                        >
                          <Dices className="w-4 h-4" /> Rolar Dados Explosivos do Teste
                        </button>
                      </div>
                    )}

                    {/* Combat Action Trigger */}
                    {currentStep.combatTrigger && (
                      <div className="space-y-2 pt-2 border-t border-zinc-850">
                        <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <Swords className="w-4 h-4" /> Emboscada:{' '}
                            {currentStep.combatTrigger.count}x {currentStep.combatTrigger.enemyName}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLaunchCombatFromStep(currentStep)}
                          className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow"
                        >
                          <Swords className="w-4 h-4" /> Ir para a Arena de Combate Tático
                        </button>
                      </div>
                    )}

                    {/* Feedback message */}
                    {runnerMessage && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-bold ${
                          runnerMessage.includes('PÍFIO')
                            ? 'bg-red-950/60 border-red-800 text-red-200'
                            : runnerMessage.includes('SUCESSO')
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        {runnerMessage}
                        {runnerStepResult && (
                          <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                            Rolagem: {runnerStepResult.breakdown} (Soma: {runnerStepResult.sum} vs Dif{' '}
                            {runnerStepResult.difficulty})
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Advance or Conclude */}
            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveQuestRunner(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl"
              >
                Suspender Missão
              </button>

              <button
                type="button"
                onClick={handleAdvanceStepOrComplete}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase rounded-xl flex items-center gap-1.5 shadow"
              >
                {runnerCurrentStepIndex < activeQuestRunner.steps.length - 1 ? (
                  <>
                    Próxima Etapa <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluir e Coletar Recompensa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
