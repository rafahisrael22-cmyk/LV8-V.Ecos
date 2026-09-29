import React, { useState } from 'react';
import { CharacterSheet, RulesConfig } from '../types/lv8';
import { evaluateFormula } from '../utils/characterDefaults';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Heart,
  Brain,
  Eye,
  Award,
  Plus,
  CheckCircle,
  HelpCircle,
  History,
  AlertTriangle,
  Flame,
  Swords,
  Feather
} from 'lucide-react';

interface CharacterEvolutionPanelProps {
  character: CharacterSheet;
  rulesConfig: RulesConfig;
  onUpdateCharacter: (updated: CharacterSheet) => void;
}

export function CharacterEvolutionPanel({
  character,
  rulesConfig,
  onUpdateCharacter,
}: CharacterEvolutionPanelProps) {
  const [bonusXpInput, setBonusXpInput] = useState<number>(10);
  const [awardReason, setAwardReason] = useState<string>('Recompensa de Exploração');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'attributes' | 'skills' | 'powers' | 'resources' | 'history'>('attributes');

  // New Custom Power State
  const [newPowerName, setNewPowerName] = useState('');
  const [newPowerDesc, setNewPowerDesc] = useState('');
  const [newPowerCost, setNewPowerCost] = useState(15);
  const [newPowerFlux, setNewPowerFlux] = useState(6);

  const availableXp = character.xp ?? 0;
  const totalXp = character.totalXp ?? availableXp;
  const spentXp = character.spentXp ?? (totalXp - availableXp);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Helper to recalculate derived pools after attribute change
  const recalculatePools = (attrs: Record<string, number>, base: CharacterSheet): Partial<CharacterSheet> => {
    const hpFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'hp')?.formula || '10 + (VIG * 5)';
    const fluxoFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'fluxo')?.formula || '10 + (ESS * 5)';
    const sanFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'sanidade')?.formula || '10 + (VON * 5)';
    const fadFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'fadiga')?.formula || '10 + (FOR * 5)';
    const auraFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'aura')?.formula || '10 + (PRE * 5)';
    const deslocFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'deslocamento')?.formula || 'AGI * 3';

    const newHpMax = evaluateFormula(hpFormula, attrs);
    const newFluxoMax = evaluateFormula(fluxoFormula, attrs);
    const newSanMax = evaluateFormula(sanFormula, attrs);
    const newFadMax = evaluateFormula(fadFormula, attrs);
    const newAuraMax = evaluateFormula(auraFormula, attrs);
    const newDesloc = evaluateFormula(deslocFormula, attrs);

    // Keep proportion or grant current boost
    const hpDiff = newHpMax - base.hpMax;
    const fluxoDiff = newFluxoMax - base.fluxoMax;

    return {
      hpMax: newHpMax,
      hpCurrent: Math.max(1, base.hpCurrent + hpDiff),
      fluxoMax: newFluxoMax,
      fluxoCurrent: Math.max(0, base.fluxoCurrent + fluxoDiff),
      sanidadeMax: newSanMax,
      sanidadeCurrent: Math.min(newSanMax, (base.sanidadeCurrent ?? newSanMax)),
      fadigaMax: newFadMax,
      fadigaCurrent: Math.min(newFadMax, (base.fadigaCurrent ?? newFadMax)),
      auraMax: newAuraMax,
      auraCurrent: Math.min(newAuraMax, (base.auraCurrent ?? newAuraMax)),
      deslocamento: newDesloc,
    };
  };

  // Add Bonus XP (Master reward or discovery)
  const handleAwardXp = () => {
    if (bonusXpInput <= 0) return;
    const newAvail = availableXp + bonusXpInput;
    const newTotal = totalXp + bonusXpInput;
    const history = character.advancementHistory || [];

    const updated: CharacterSheet = {
      ...character,
      xp: newAvail,
      totalXp: newTotal,
      advancementHistory: [
        {
          id: `xp_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `XP Adquirido (+${bonusXpInput})`,
          xpCost: -bonusXpInput,
          category: 'recurso',
          details: awardReason || 'Concessão manual de XP',
        },
        ...history,
      ],
    };
    onUpdateCharacter(updated);
    showToast(`+${bonusXpInput} XP concedido com sucesso!`);
  };

  // 1. Upgrade Attribute
  // Cost: (currentValue + 1) * 6 XP
  const getAttributeCost = (currentVal: number) => {
    return Math.max(1, (currentVal + 1) * 6);
  };

  const handleUpgradeAttribute = (attrKey: string, attrName: string) => {
    const currentVal = character.attributes[attrKey] || 1;
    if (currentVal >= rulesConfig.attributeMaxLegendary) {
      showToast(`Atributo já atingiu o patamar lendário máximo (${rulesConfig.attributeMaxLegendary}).`);
      return;
    }
    const cost = getAttributeCost(currentVal);
    if (availableXp < cost) {
      showToast(`XP insuficiente! Necessário ${cost} XP para aprimorar ${attrName} para ${currentVal + 1}.`);
      return;
    }

    const updatedAttrs = {
      ...character.attributes,
      [attrKey]: currentVal + 1,
    };
    const poolBoosts = recalculatePools(updatedAttrs, character);
    const history = character.advancementHistory || [];

    const updated: CharacterSheet = {
      ...character,
      ...poolBoosts,
      attributes: updatedAttrs,
      xp: availableXp - cost,
      spentXp: spentXp + cost,
      advancementHistory: [
        {
          id: `attr_${attrKey}_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `Aprimoramento de Atributo: ${attrName}`,
          xpCost: cost,
          category: 'atributo',
          details: `Elevou ${attrKey} de ${currentVal} para ${currentVal + 1}. Fórmulas derivadas recalculadas.`,
        },
        ...history,
      ],
    };

    onUpdateCharacter(updated);
    showToast(`Atributo ${attrName} elevado para ${currentVal + 1}! (-${cost} XP)`);
  };

  // 2. Upgrade Skill
  // Cost: (currentRank + 1) * 3 XP
  const getSkillCost = (currentRank: number) => {
    return Math.max(1, (currentRank + 1) * 3);
  };

  const handleUpgradeSkill = (skillId: string, skillName: string) => {
    const currentRank = character.skills[skillId] || 0;
    if (currentRank >= rulesConfig.skillMaxLegendary) {
      showToast(`Perícia já atingiu o ápice lendário (${rulesConfig.skillMaxLegendary}).`);
      return;
    }
    const cost = getSkillCost(currentRank);
    if (availableXp < cost) {
      showToast(`XP insuficiente! Necessário ${cost} XP para aprimorar ${skillName} para grau ${currentRank + 1}.`);
      return;
    }

    const updatedSkills = {
      ...character.skills,
      [skillId]: currentRank + 1,
    };
    const history = character.advancementHistory || [];

    const updated: CharacterSheet = {
      ...character,
      skills: updatedSkills,
      xp: availableXp - cost,
      spentXp: spentXp + cost,
      advancementHistory: [
        {
          id: `skill_${skillId}_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `Evolução de Perícia: ${skillName}`,
          xpCost: cost,
          category: 'pericia',
          details: `Graduação aumentada de ${currentRank} para ${currentRank + 1}.`,
        },
        ...history,
      ],
    };

    onUpdateCharacter(updated);
    showToast(`Perícia ${skillName} aprimorada para grau ${currentRank + 1}! (-${cost} XP)`);
  };

  // 3. Buy Vital Pools Boost
  const handleBoostPool = (poolType: 'hp' | 'fluxo' | 'sanidade' | 'fadiga' | 'aura', amount: number, cost: number) => {
    if (availableXp < cost) {
      showToast(`XP insuficiente! Necessário ${cost} XP.`);
      return;
    }

    const history = character.advancementHistory || [];
    let poolName = '';
    const updated: CharacterSheet = {
      ...character,
      xp: availableXp - cost,
      spentXp: spentXp + cost,
    };

    if (poolType === 'hp') {
      poolName = 'Vida Máxima (+5 HP)';
      updated.hpMax = character.hpMax + amount;
      updated.hpCurrent = character.hpCurrent + amount;
    } else if (poolType === 'fluxo') {
      poolName = 'Fluxo Vital Máximo (+5 Fluxo)';
      updated.fluxoMax = character.fluxoMax + amount;
      updated.fluxoCurrent = character.fluxoCurrent + amount;
    } else if (poolType === 'sanidade') {
      poolName = 'Sanidade Máxima (+5 Sanidade)';
      updated.sanidadeMax = (character.sanidadeMax ?? 20) + amount;
      updated.sanidadeCurrent = (character.sanidadeCurrent ?? 20) + amount;
    } else if (poolType === 'fadiga') {
      poolName = 'Resistência à Fadiga (+5 Fadiga)';
      updated.fadigaMax = (character.fadigaMax ?? 20) + amount;
      updated.fadigaCurrent = (character.fadigaCurrent ?? 20) + amount;
    } else if (poolType === 'aura') {
      poolName = 'Expansão de Aura (+5 Aura)';
      updated.auraMax = (character.auraMax ?? 15) + amount;
      updated.auraCurrent = (character.auraCurrent ?? 15) + amount;
    }

    updated.advancementHistory = [
      {
        id: `pool_${poolType}_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: `Fortalecimento Vital: ${poolName}`,
        xpCost: cost,
        category: 'recurso',
        details: `Ampliação permanente de +${amount} pontos no teto máximo da reserva.`,
      },
      ...history,
    ];

    onUpdateCharacter(updated);
    showToast(`${poolName} adquirida com sucesso! (-${cost} XP)`);
  };

  // 4. Unlock New Power
  const handleUnlockCustomPower = () => {
    if (!newPowerName.trim()) {
      showToast('Insira um nome para o novo poder ou técnica ancestral.');
      return;
    }
    if (availableXp < newPowerCost) {
      showToast(`XP insuficiente! Necessário ${newPowerCost} XP para despertar esta técnica.`);
      return;
    }

    const history = character.advancementHistory || [];
    const newPower = {
      id: `pwr_evo_${Date.now()}`,
      name: newPowerName.trim(),
      source: 'aspecto' as const,
      escala: 2,
      duracao: 'Cena' as const,
      dificuldade: 15,
      custoFluxo: newPowerFlux,
      descricao: newPowerDesc.trim() || 'Técnica ancestral despertada através da maestria de fluxo.',
    };

    const updated: CharacterSheet = {
      ...character,
      powers: [...(character.powers || []), newPower],
      xp: availableXp - newPowerCost,
      spentXp: spentXp + newPowerCost,
      advancementHistory: [
        {
          id: `pwr_${newPower.id}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `Despertar de Poder: ${newPower.name}`,
          xpCost: newPowerCost,
          category: 'poder',
          details: `Novo poder ancestral incorporado à ficha de combate e testes.`,
        },
        ...history,
      ],
    };

    onUpdateCharacter(updated);
    setNewPowerName('');
    setNewPowerDesc('');
    showToast(`Poder "${newPower.name}" despertado com sucesso! (-${newPowerCost} XP)`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{feedbackMessage}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-amber-400 hover:text-amber-100 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main XP Dashboard Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-amber-400 tracking-wide">
                  SISTEMA DE EVOLUÇÃO LV8 • GASTO DIRETO DE XP
                </h2>
                <p className="text-xs text-zinc-400">
                  Sem níveis rígidos. Toda a evolução do seu personagem ocorre através da compra individual de atributos, perícias e poderes.
                </p>
              </div>
            </div>
          </div>

          {/* XP Counters */}
          <div className="flex items-center gap-3">
            <div className="bg-zinc-950/80 border border-amber-500/40 px-4 py-2.5 rounded-xl text-center shadow-inner">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">XP Disponível</div>
              <div className="text-2xl font-black text-amber-300 font-mono">{availableXp}</div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">XP Total</div>
              <div className="text-lg font-bold text-zinc-200 font-mono">{totalXp}</div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">XP Investido</div>
              <div className="text-lg font-bold text-zinc-400 font-mono">{spentXp}</div>
            </div>
          </div>
        </div>

        {/* Quick Award XP Strip for Master / Solo Play */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Conceder XP (Recompensa de Missão / Vitória / Mestre):</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={awardReason}
              onChange={(e) => setAwardReason(e.target.value)}
              placeholder="Motivo (ex: Vitória contra Carnotauro)"
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 w-52"
            />
            <input
              type="number"
              min="1"
              max="200"
              value={bonusXpInput}
              onChange={(e) => setBonusXpInput(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono w-16 text-center"
            />
            <button
              type="button"
              onClick={handleAwardXp}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition shadow flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar XP
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('attributes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'attributes'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Atributos Primais
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'skills'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Swords className="w-4 h-4" /> 18 Perícias Oficiais
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'resources'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Heart className="w-4 h-4" /> Reservas Vitais (+HP/Fluxo)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('powers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'powers'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Zap className="w-4 h-4" /> Poderes &amp; Técnicas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <History className="w-4 h-4" /> Histórico de Despertar
        </button>
      </div>

      {/* 1. ATRIBUTOS PRIMAIS */}
      {activeTab === 'attributes' && (
        <div className="space-y-4">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Custo de Atributo:</strong> (Valor Atual + 1) × 6 XP. Aumentar atributos recalculam instantaneamente
              todas as 6 reservas derivadas (Vida, Fluxo, Sanidade, Fadiga, Aura, Deslocamento).
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rulesConfig.attributes.map((attr) => {
              const currentVal = character.attributes[attr.key] || 1;
              const cost = getAttributeCost(currentVal);
              const canAfford = availableXp >= cost && currentVal < rulesConfig.attributeMaxLegendary;

              return (
                <div
                  key={attr.key}
                  className="p-4 bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-2xl flex flex-col justify-between transition shadow-md group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">{attr.key}</span>
                      <span className="px-2 py-0.5 bg-zinc-950 rounded text-xs font-mono font-bold text-zinc-300">
                        {currentVal} / {rulesConfig.attributeMaxLegendary}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition">
                      {attr.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">{attr.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="text-xs font-mono">
                      <span className="text-zinc-500">Custo: </span>
                      <strong className={canAfford ? 'text-amber-400' : 'text-zinc-500'}>{cost} XP</strong>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleUpgradeAttribute(attr.key, attr.name)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition shadow ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 hover:brightness-110 active:scale-95'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Evoluir ({currentVal + 1})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 18 PERÍCIAS OFICIAIS */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Custo de Perícia:</strong> (Grau Atual + 1) × 3 XP. Aumenta a quantidade de dados d8 ou bônus rolados em todos os testes e combates.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rulesConfig.skills.map((sk) => {
              const currentRank = character.skills[sk.id] || 0;
              const cost = getSkillCost(currentRank);
              const canAfford = availableXp >= cost && currentRank < rulesConfig.skillMaxLegendary;

              return (
                <div
                  key={sk.id}
                  className="p-3.5 bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-xl flex items-center justify-between gap-3 transition shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-200 truncate">{sk.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-zinc-950 text-amber-400 font-mono rounded border border-zinc-800">
                        {sk.primaryAttribute}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">{sk.description}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black font-mono text-zinc-100">Grau {currentRank}</div>
                      <div className="text-[10px] text-amber-400 font-mono font-semibold">{cost} XP</div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleUpgradeSkill(sk.id, sk.name)}
                      className={`p-1.5 rounded-lg transition shadow ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                      title={`Aprimorar para Grau ${currentRank + 1} (${cost} XP)`}
                    >
                      <Plus className="w-4 h-4 font-black" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. RESERVAS VITAIS & RESILIÊNCIA */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Fortaleça o corpo físico, o reservatório de energia ancestral e a mente contra os horrores da Dobra investindo XP diretamente.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Boost HP */}
            <div className="p-4 bg-zinc-900/90 border border-rose-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400" />
                  <h4 className="text-sm font-bold text-zinc-100">Vitalidade Máxima (+5 HP)</h4>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">10 XP</span>
              </div>
              <p className="text-xs text-zinc-400">
                Aumenta em 5 pontos permanentes a reserva de Vida Máxima e Atual do personagem.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-xs text-zinc-300 font-mono">Atual: {character.hpMax} HP</span>
                <button
                  type="button"
                  disabled={availableXp < 10}
                  onClick={() => handleBoostPool('hp', 5, 10)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                    availableXp >= 10
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Adquirir (+5 HP)
                </button>
              </div>
            </div>

            {/* Boost Fluxo */}
            <div className="p-4 bg-zinc-900/90 border border-cyan-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-zinc-100">Reserva de Fluxo (+5 Fluxo)</h4>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">10 XP</span>
              </div>
              <p className="text-xs text-zinc-400">
                Amplia em 5 pontos a reserva de energia ancestral usada para conjurar poderes e técnicas de combate.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-xs text-zinc-300 font-mono">Atual: {character.fluxoMax} Fluxo</span>
                <button
                  type="button"
                  disabled={availableXp < 10}
                  onClick={() => handleBoostPool('fluxo', 5, 10)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                    availableXp >= 10
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Adquirir (+5 Fluxo)
                </button>
              </div>
            </div>

            {/* Boost Sanidade */}
            <div className="p-4 bg-zinc-900/90 border border-purple-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-bold text-zinc-100">Fortaleza Mental (+5 Sanidade)</h4>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">8 XP</span>
              </div>
              <p className="text-xs text-zinc-400">
                Protege o personagem contra o desespero e aberrações indizíveis emanadas pelas Dobras.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-xs text-zinc-300 font-mono">Atual: {character.sanidadeMax ?? 20} Sanidade</span>
                <button
                  type="button"
                  disabled={availableXp < 8}
                  onClick={() => handleBoostPool('sanidade', 5, 8)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                    availableXp >= 8
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Adquirir (+5 Sanidade)
                </button>
              </div>
            </div>

            {/* Boost Fadiga */}
            <div className="p-4 bg-zinc-900/90 border border-amber-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-zinc-100">Resistência Física (+5 Fadiga)</h4>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">8 XP</span>
              </div>
              <p className="text-xs text-zinc-400">
                Aumenta a tolerância a marchas forçadas, esforço contínuo e condições climáticas adversas.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-xs text-zinc-300 font-mono">Atual: {character.fadigaMax ?? 20} Fadiga</span>
                <button
                  type="button"
                  disabled={availableXp < 8}
                  onClick={() => handleBoostPool('fadiga', 5, 8)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                    availableXp >= 8
                      ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Adquirir (+5 Fadiga)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PODERES & TÉCNICAS */}
      {activeTab === 'powers' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Despertar Nova Técnica Ancestral
            </h3>
            <p className="text-xs text-zinc-400">
              Crie e desperte uma nova técnica de combate ou poder de fluxo gastando pontos de experiência.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome do Poder / Técnica:</label>
                <input
                  type="text"
                  value={newPowerName}
                  onChange={(e) => setNewPowerName(e.target.value)}
                  placeholder="Ex: Corte de Fenda Flamejante"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="text-xs text-zinc-400 block mb-1">Custo em XP:</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newPowerCost}
                    onChange={(e) => setNewPowerCost(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-zinc-400 block mb-1">Custo de Fluxo:</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newPowerFlux}
                    onChange={(e) => setNewPowerFlux(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-zinc-400 block mb-1">Descrição / Efeito em Jogo:</label>
                <textarea
                  rows={2}
                  value={newPowerDesc}
                  onChange={(e) => setNewPowerDesc(e.target.value)}
                  placeholder="Ex: Envolve a lâmina com resíduos de Dobra: +2d8 de dano físico e aplica condição Sangrando."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={availableXp < newPowerCost || !newPowerName.trim()}
                onClick={handleUnlockCustomPower}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                  availableXp >= newPowerCost && newPowerName.trim()
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Despertar Poder ({newPowerCost} XP)
              </button>
            </div>
          </div>

          {/* Current Powers list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Poderes Já Despertados ({character.powers?.length || 0})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(character.powers || []).map((p) => (
                <div key={p.id} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">{p.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">{p.custoFluxo} Fluxo</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{p.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. HISTÓRICO DE DESPERTAR */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Registro cronológico de todos os investimentos de XP efetuados pelo personagem.</span>
          </div>

          <div className="space-y-2">
            {(character.advancementHistory || []).length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 italic bg-zinc-900/40 rounded-xl border border-zinc-800">
                Nenhum aprimoramento registrado ainda. Gaste XP nas abas acima para iniciar sua evolução.
              </div>
            ) : (
              (character.advancementHistory || []).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">{entry.title}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{entry.timestamp}</span>
                    </div>
                    {entry.details && <p className="text-[11px] text-zinc-400">{entry.details}</p>}
                  </div>

                  <div className="font-mono font-bold text-amber-400 text-xs shrink-0">
                    {entry.xpCost > 0 ? `-${entry.xpCost} XP` : `+${Math.abs(entry.xpCost)} XP`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
