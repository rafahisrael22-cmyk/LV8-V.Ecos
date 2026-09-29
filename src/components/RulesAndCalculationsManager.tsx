import React, { useState } from 'react';
import { RulesConfig, CharacterSheet, CustomActionRule, DerivedFormulaConfig, Combatant } from '../types/lv8';
import { calculateActionRule } from '../utils/rulesEngine';
import { evaluateFormula, DEFAULT_ECOS_SKILLS, PREMADE_ENEMIES, DINOSAUR_BESTIARY } from '../utils/characterDefaults';
import { MonsterSheetModal } from './MonsterSheetModal';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Dices,
  Swords,
  Shield,
  Zap,
  Compass,
  Info,
  Check,
  X,
  Sparkles,
  Calculator,
  RotateCcw,
  Skull,
  Eye,
  FileText,
  Heart,
  Move
} from 'lucide-react';

interface RulesAndCalculationsManagerProps {
  character: CharacterSheet;
  rulesConfig: RulesConfig;
  onUpdateRules: (rules: RulesConfig) => void;
  onUpdateCharacter: (char: CharacterSheet) => void;
  onOpenDiceRoller: (dice: number, title: string, diff?: number) => void;
}

export const RulesAndCalculationsManager: React.FC<RulesAndCalculationsManagerProps> = ({
  character,
  rulesConfig,
  onUpdateRules,
  onUpdateCharacter,
  onOpenDiceRoller,
}) => {
  // Sub-tabs inside Rules Manager
  const [activeSection, setActiveSection] = useState<'rules' | 'formulas' | 'parameters' | 'bestiary'>('rules');
  const [selectedMonsterForModal, setSelectedMonsterForModal] = useState<Combatant | null>(null);
  const [isMonsterModalOpen, setIsMonsterModalOpen] = useState(false);

  // Rule Form Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFormData, setRuleFormData] = useState<CustomActionRule>({
    id: '',
    name: '',
    type: 'attack',
    primaryAttribute: 'FOR',
    attributeFormat: 'd6',
    skillId: 'combate',
    skillFormat: 'd6',
    extraDice: 0,
    extraFlatBonus: 0,
    bonusDamage: 2,
    fluxCost: 0,
    description: '',
  });

  // Formula Form Modal State
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [editingFormulaKey, setEditingFormulaKey] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [formulaFormData, setFormulaFormData] = useState<DerivedFormulaConfig>({
    key: '',
    name: '',
    formula: '10 + (VIG * 5)',
    attributeDependency: ['VIG'],
    description: '',
    isCustom: true,
  });

  // Open Create Rule Modal
  const handleOpenCreateRule = () => {
    setEditingRuleId(null);
    setRuleFormData({
      id: `rule_custom_${Date.now()}`,
      name: '',
      type: 'attack',
      primaryAttribute: 'FOR',
      attributeFormat: 'd6',
      skillId: rulesConfig.skills[0]?.id || 'combate',
      skillFormat: 'd6',
      extraDice: 0,
      extraFlatBonus: 0,
      bonusDamage: 2,
      fluxCost: 0,
      description: '',
      isCustom: true,
    });
    setIsRuleModalOpen(true);
  };

  // Open Edit Rule Modal
  const handleOpenEditRule = (rule: CustomActionRule) => {
    setEditingRuleId(rule.id);
    setRuleFormData({ ...rule });
    setIsRuleModalOpen(true);
  };

  // Save Rule
  const handleSaveRule = () => {
    if (!ruleFormData.name.trim()) return;

    const existingRules = rulesConfig.customActionRules || [];
    let updatedRules: CustomActionRule[];

    if (editingRuleId) {
      updatedRules = existingRules.map((r) => (r.id === editingRuleId ? { ...ruleFormData } : r));
    } else {
      updatedRules = [...existingRules, { ...ruleFormData, id: ruleFormData.id || `rule_${Date.now()}` }];
    }

    onUpdateRules({
      ...rulesConfig,
      customActionRules: updatedRules,
    });
    setIsRuleModalOpen(false);
  };

  // Delete Rule
  const handleDeleteRule = (ruleId: string) => {
    const existingRules = rulesConfig.customActionRules || [];
    onUpdateRules({
      ...rulesConfig,
      customActionRules: existingRules.filter((r) => r.id !== ruleId),
    });
    setActionNotice('Regra de ação excluída.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Open Create Formula Modal
  const handleOpenCreateFormula = () => {
    setEditingFormulaKey(null);
    setFormulaFormData({
      key: `stat_${Date.now().toString().slice(-4)}`,
      name: '',
      formula: '10 + (FOR * 2)',
      attributeDependency: ['FOR'],
      description: 'Cálculo customizado.',
      isCustom: true,
    });
    setIsFormulaModalOpen(true);
  };

  // Open Edit Formula Modal
  const handleOpenEditFormula = (form: DerivedFormulaConfig) => {
    setEditingFormulaKey(form.key);
    setFormulaFormData({ ...form });
    setIsFormulaModalOpen(true);
  };

  // Save Formula
  const handleSaveFormula = () => {
    if (!formulaFormData.name.trim() || !formulaFormData.formula.trim()) return;

    let updatedFormulas: DerivedFormulaConfig[];
    if (editingFormulaKey) {
      updatedFormulas = rulesConfig.derivedFormulas.map((f) =>
        f.key === editingFormulaKey ? { ...formulaFormData } : f
      );
    } else {
      const safeKey = formulaFormData.key.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      updatedFormulas = [...rulesConfig.derivedFormulas, { ...formulaFormData, key: safeKey }];
    }

    onUpdateRules({
      ...rulesConfig,
      derivedFormulas: updatedFormulas,
    });
    setIsFormulaModalOpen(false);
  };

  // Delete Formula
  const handleDeleteFormula = (key: string) => {
    onUpdateRules({
      ...rulesConfig,
      derivedFormulas: rulesConfig.derivedFormulas.filter((f) => f.key !== key),
    });
    setActionNotice(`Fórmula "${key}" excluída.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Reset to 18 official Ecos skills
  const handleResetEcosSkills = () => {
    onUpdateRules({
      ...rulesConfig,
      skills: DEFAULT_ECOS_SKILLS,
    });
    setActionNotice('Perícias restauradas com sucesso para a lista oficial de 18 perícias do Ecos da Dobra!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Preview the formula of the rule currently being created/edited
  const modalRulePreview = calculateActionRule(ruleFormData, character);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-indigo-400 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" /> Motor de Regras, Cálculos & Fórmulas
          </h3>
          <p className="text-xs text-zinc-400">
            Crie regras personalizadas combinando atributos e perícias (dados d6 ou bônus decimal fixo) e edite fórmulas de recursos.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveSection('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSection === 'rules'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> Regras de Combate & FA
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('formulas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSection === 'formulas'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Fórmulas Derivadas
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('parameters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSection === 'parameters'
                ? 'bg-amber-600 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Parâmetros & Orçamentos
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('bestiary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSection === 'bestiary'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Skull className="w-3.5 h-3.5" /> Bestiário &amp; Planilhas
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-indigo-400 hover:text-indigo-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: REGRAS ESPECÍFICAS DE COMBATE & FA */}
      {activeSection === 'rules' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Regras Customizadas de Ataque & Teste
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                Configure a combinação de Atributo + Perícia para cada manobra. Defina se cada componente concede <strong>dados d6</strong> ou <strong>bônus decimal fixo</strong> (+X ou dobro da perícia).
                <br />
                <span className="text-amber-400/90 font-mono text-[11px]">
                  Exemplos: AGI 3 (d6) + Pontaria 2 (×2 decimal) = FA 3d6 + 4 | FOR 2 (d6) + Escudo 2 (d6) = FA 4d6
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateRule}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Criar Nova Regra / Ação
            </button>
          </div>

          {/* List of Custom Action Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(rulesConfig.customActionRules || []).map((rule) => {
              const calc = calculateActionRule(rule, character);
              const isAttack = rule.type === 'attack';
              const isPower = rule.type === 'power';
              const isDefense = rule.type === 'defense';

              return (
                <div
                  key={rule.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-4 transition space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-zinc-100 text-sm font-bold group-hover:text-indigo-300 transition">
                            {rule.name}
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isAttack
                                ? 'bg-red-950 text-red-300 border border-red-800/60'
                                : isPower
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                                  : isDefense
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                    : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {rule.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{rule.description}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRule(rule)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                          title="Editar Regra"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 rounded-lg text-xs"
                          title="Excluir Regra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown & FA Formula Badge */}
                    <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-zinc-400 font-semibold">FA Calculada (Personagem Atual):</span>
                        <span className="font-mono font-black text-sm text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
                          FA = {calc.formulaLabel}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate" title={calc.breakdownSummary}>
                        Composição: {calc.breakdownSummary}
                      </div>
                    </div>
                  </div>

                  {/* Test button & details */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      {rule.bonusDamage ? (
                        <span className="text-rose-400 font-mono font-bold">+{rule.bonusDamage} dano arma</span>
                      ) : null}
                      {rule.fluxCost ? (
                        <span className="text-cyan-400 font-mono font-bold">{rule.fluxCost} Fluxo</span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenDiceRoller(
                          calc.diceCount,
                          `Teste de Regra: ${rule.name} (FA = ${calc.formulaLabel})`,
                          15
                        )
                      }
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Dices className="w-3.5 h-3.5" /> Testar ({calc.formulaLabel})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: FÓRMULAS DERIVADAS (CÁLCULOS) */}
      {activeSection === 'formulas' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <div>
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" /> Gerenciador de Cálculos & Estatísticas Derivadas
              </h4>
              <p className="text-xs text-zinc-400">
                Inclua, edite ou exclua fórmulas matemáticas dinâmicas baseadas nos atributos do personagem.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateFormula}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Incluir Novo Cálculo
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-zinc-800/80 text-zinc-300 font-bold border-b border-zinc-700 font-sans">
                  <th className="p-3 border-r border-zinc-700">Chave</th>
                  <th className="p-3 border-r border-zinc-700">Nome da Estatística</th>
                  <th className="p-3 border-r border-zinc-700">Fórmula de Cálculo</th>
                  <th className="p-3 border-r border-zinc-700 text-center">Valor Atual</th>
                  <th className="p-3 border-r border-zinc-700">Descrição / Efeito</th>
                  <th className="p-3 text-center font-sans">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-200">
                {rulesConfig.derivedFormulas.map((form) => {
                  const calculated = evaluateFormula(form.formula, character.attributes);
                  return (
                    <tr key={form.key} className="hover:bg-zinc-900/60 transition">
                      <td className="p-2.5 font-bold text-amber-400 border-r border-zinc-800">{form.key}</td>
                      <td className="p-2.5 font-sans font-bold text-zinc-100 border-r border-zinc-800">
                        {form.name}
                      </td>
                      <td className="p-2.5 text-cyan-300 border-r border-zinc-800 font-mono font-bold">
                        {form.formula}
                      </td>
                      <td className="p-2.5 text-center font-bold text-base text-emerald-400 border-r border-zinc-800 bg-zinc-900/40">
                        {calculated}
                      </td>
                      <td className="p-2.5 font-sans text-[11px] text-zinc-400 border-r border-zinc-800">
                        {form.description}
                      </td>
                      <td className="p-2.5 text-center space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFormula(form)}
                          className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
                          title="Editar Fórmula"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFormula(form.key)}
                          className="p-1 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded text-xs"
                          title="Excluir Fórmula"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: PARÂMETROS DO SISTEMA & ORÇAMENTOS */}
      {activeSection === 'parameters' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Pontos Livres de Atributos (Criação)
              </label>
              <input
                type="number"
                min="4"
                max="20"
                value={rulesConfig.attributePointsBudget}
                onChange={(e) =>
                  onUpdateRules({
                    ...rulesConfig,
                    attributePointsBudget: parseInt(e.target.value) || 8,
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 font-mono font-bold text-amber-400 text-lg outline-none"
              />
              <span className="text-[11px] text-zinc-400 leading-tight block">
                Regra oficial: <strong>8 pontos livres</strong> (cada atributo já inicia com 1 grátis não zerável).
              </span>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Limite Máximo na Criação (Atributo)
              </label>
              <input
                type="number"
                min="2"
                max="6"
                value={rulesConfig.attributeMaxInitial}
                onChange={(e) =>
                  onUpdateRules({
                    ...rulesConfig,
                    attributeMaxInitial: parseInt(e.target.value) || 3,
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 font-mono font-bold text-amber-400 text-lg outline-none"
              />
              <span className="text-[11px] text-zinc-400 leading-tight block">
                Regra oficial: <strong>Máximo 3</strong> durante a criação de personagem.
              </span>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Limite Máximo na Criação (Perícias)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={rulesConfig.skillMaxInitial}
                onChange={(e) =>
                  onUpdateRules({
                    ...rulesConfig,
                    skillMaxInitial: parseInt(e.target.value) || 2,
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 text-lg outline-none"
              />
              <span className="text-[11px] text-zinc-400 leading-tight block">
                Regra oficial: <strong>Máximo 2</strong> em cada perícia na criação (iniciam em 0).
              </span>
            </div>
          </div>

          {/* Quick restore skills banner */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong className="text-xs font-bold text-zinc-200 block">Lista Oficial: 18 Perícias do Ecos da Dobra</strong>
              <span className="text-[11px] text-zinc-400">
                Apenas as 18 perícias do Ecos. O jogador pode adicionar ou remover qualquer perícia a qualquer momento.
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetEcosSkills}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar 18 Perícias Oficiais
            </button>
          </div>
        </div>
      )}

      {/* SEÇÃO 4: BESTIÁRIO & PLANILHAS DOS MONSTROS */}
      {activeSection === 'bestiary' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div>
              <h4 className="text-sm font-black text-rose-400 uppercase tracking-wide flex items-center gap-2">
                <Skull className="w-4 h-4 text-rose-500" /> Planilhas Oficiais das Criaturas &amp; Bestiário LV8
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Consulte e inspecione a planilha completa de qualquer criatura: Atributos, Perícias, FA de ataque, Armadura, Deslocamento e a fórmula oficial de Iniciativa: <strong>PER (d6) + (Vigilância × 3)</strong>.
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-950/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-mono font-bold">
              {Object.keys(PREMADE_ENEMIES).length} Criaturas Catalogadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PREMADE_ENEMIES).map(([key, monster]) => {
              const per = monster.attributes['PER'] || 3;
              const vig = monster.skills?.['vigilancia'] ?? (monster.skills?.['sobrevivencia'] ? Math.min(2, monster.skills['sobrevivencia']) : 1);
              const vigBonus = vig * 3;
              const initFA = `${per}d6+${vigBonus}`;
              const desloc = (monster.attributes['AGI'] || 3) * 3;

              return (
                <div
                  key={key}
                  className="bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 group shadow-lg"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-zinc-100 group-hover:text-rose-300 transition">
                            {monster.name}
                          </strong>
                        </div>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          {monster.race} • {monster.className}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800/60 rounded-full text-[10px] font-mono font-bold shrink-0">
                        IA {monster.aiIntelligence}
                      </span>
                    </div>

                    {/* Vitals summary */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
                      <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-rose-400 block font-sans font-bold">Vida</span>
                        <strong className="text-zinc-200">{monster.hpMax} HP</strong>
                      </div>
                      <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-sans font-bold">Defesa</span>
                        <strong className="text-zinc-200">FD {monster.defense}</strong>
                      </div>
                      <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-amber-400 block font-sans font-bold">Armadura</span>
                        <strong className="text-amber-300">-{monster.armor || 0}</strong>
                      </div>
                    </div>

                    {/* Initiative & Speed formula badge */}
                    <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 space-y-1 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-[11px] font-sans">Iniciativa Oficial:</span>
                        <strong className="text-purple-300 font-bold">FA: {initFA}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>Deslocamento:</span>
                        <span>{desloc} metros (AGI×3)</span>
                      </div>
                    </div>

                    {/* Powers preview */}
                    <div className="text-[11px] text-zinc-400 space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                        Poderes &amp; Ataques:
                      </span>
                      {monster.powers?.slice(0, 2).map((p) => (
                        <div key={p.id} className="truncate text-zinc-300">
                          • <strong className="text-rose-300">{p.name}</strong> (Dif {p.dificuldade})
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenDiceRoller(
                          per,
                          `Iniciativa: ${monster.name} (FA ${initFA})`,
                          15
                        )
                      }
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-zinc-700"
                      title="Rolar iniciativa oficial deste monstro"
                    >
                      <Dices className="w-3.5 h-3.5 text-purple-400" />
                      <span>Rolar Inic ({initFA})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonsterForModal(monster);
                        setIsMonsterModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-rose-950/40"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver Planilha</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR REGRA DE AÇÃO */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-500" />
                {editingRuleId ? 'Editar Regra de Combate' : 'Criar Nova Regra de Combate / Ação'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Nome da Ação / Regra *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ataque com Escudo"
                    value={ruleFormData.name}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Tipo de Ação
                  </label>
                  <select
                    value={ruleFormData.type}
                    onChange={(e) =>
                      setRuleFormData({
                        ...ruleFormData,
                        type: e.target.value as 'attack' | 'defense' | 'power' | 'utility',
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
                  >
                    <option value="attack">Ataque Marcial (Dano vs FD)</option>
                    <option value="defense">Defesa / Esquiva / Bloqueio</option>
                    <option value="power">Poder / Magia de Fluxo</option>
                    <option value="utility">Perícia Geral / Outro Teste</option>
                  </select>
                </div>
              </div>

              {/* Primary Attribute Selection & Format */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 block uppercase">
                  1. Atributo Base & Formato
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Atributo Utilizado:</label>
                    <select
                      value={ruleFormData.primaryAttribute}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, primaryAttribute: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 outline-none"
                    >
                      <option value="none">Nenhum Atributo</option>
                      {rulesConfig.attributes.map((attr) => (
                        <option key={attr.key} value={attr.key}>
                          {attr.key} ({attr.name} - Atual: {character.attributes[attr.key] || 1})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Formato do Atributo:</label>
                    <select
                      value={ruleFormData.attributeFormat}
                      onChange={(e) =>
                        setRuleFormData({
                          ...ruleFormData,
                          attributeFormat: e.target.value as 'd6' | 'decimal' | 'none',
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-semibold outline-none"
                    >
                      <option value="d6">Dados d6 (Ex: FOR 2 = 2d6)</option>
                      <option value="decimal">Bônus Decimal Fixo (+Valor normal)</option>
                      <option value="none">Não somar ao teste</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Linked Skill Selection & Format */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block uppercase">
                  2. Perícia Vinculada & Tipo de Bônus
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Perícia:</label>
                    <select
                      value={ruleFormData.skillId}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, skillId: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 outline-none"
                    >
                      <option value="none">Nenhuma Perícia</option>
                      {rulesConfig.skills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name} (Nível Atual: {character.skills[skill.id] || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Tipo de Bônus / Redutor da Perícia:</label>
                    <select
                      value={ruleFormData.skillFormat}
                      onChange={(e) =>
                        setRuleFormData({
                          ...ruleFormData,
                          skillFormat: e.target.value as 'd6' | 'decimal_x1' | 'decimal_x2' | 'none',
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-semibold outline-none"
                    >
                      <option value="d6">Dados d6 (Ex: Escudo 2 = +2d6)</option>
                      <option value="decimal_x1">Bônus Decimal Normal (+Nível da perícia)</option>
                      <option value="decimal_x2">Bônus Decimal Dobrado (+Nível × 2) — Ex: Pontaria 2 = +4</option>
                      <option value="none">Nenhum bônus de perícia</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modifiers & Damage */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Extra d6:</label>
                  <input
                    type="number"
                    value={ruleFormData.extraDice || 0}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, extraDice: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1 text-xs text-center font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Extra Decimal:</label>
                  <input
                    type="number"
                    value={ruleFormData.extraFlatBonus || 0}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, extraFlatBonus: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1 text-xs text-center font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Dano Base:</label>
                  <input
                    type="number"
                    value={ruleFormData.bonusDamage || 0}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, bonusDamage: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1 text-xs text-center font-mono text-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Custo Fluxo:</label>
                  <input
                    type="number"
                    min="0"
                    value={ruleFormData.fluxCost || 0}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, fluxCost: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1 text-xs text-center font-mono text-cyan-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Descrição & Efeito Especial</label>
                <textarea
                  rows={2}
                  placeholder="Explique o impacto narrativo ou tático..."
                  value={ruleFormData.description}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-200 outline-none"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-indigo-950/40 border border-indigo-700/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-300 font-bold block uppercase">
                    Prévia da Fórmula no Combate (FA):
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {modalRulePreview.breakdownSummary}
                  </span>
                </div>
                <div className="font-mono font-black text-lg text-amber-400 px-3 py-1 bg-zinc-950 border border-amber-500/40 rounded-xl">
                  FA = {modalRulePreview.formulaLabel}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                disabled={!ruleFormData.name.trim()}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-40 text-zinc-950 font-black text-xs uppercase rounded-xl shadow-lg transition"
              >
                Salvar Regra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR FÓRMULA DERIVADA */}
      {isFormulaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-500" />
                {editingFormulaKey ? 'Editar Fórmula Derivada' : 'Incluir Novo Cálculo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormulaModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                  Chave / Identificador (ex: defesa_passiva)
                </label>
                <input
                  type="text"
                  disabled={!!editingFormulaKey}
                  placeholder="ex: defesa_passiva"
                  value={formulaFormData.key}
                  onChange={(e) => setFormulaFormData({ ...formulaFormData, key: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                  Nome da Estatística (ex: Defesa Passiva)
                </label>
                <input
                  type="text"
                  placeholder="ex: Defesa Passiva"
                  value={formulaFormData.name}
                  onChange={(e) => setFormulaFormData({ ...formulaFormData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                  Expressão Matemática (Ex: 10 + (VIG * 5), AGI * 3, 10 + (FOR * 2))
                </label>
                <input
                  type="text"
                  placeholder="10 + (VIG * 5)"
                  value={formulaFormData.formula}
                  onChange={(e) => setFormulaFormData({ ...formulaFormData, formula: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                  Descrição & Efeito no Jogo
                </label>
                <textarea
                  rows={2}
                  placeholder="Explique para que serve esta estatística..."
                  value={formulaFormData.description}
                  onChange={(e) => setFormulaFormData({ ...formulaFormData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-200 outline-none"
                />
              </div>

              {/* Evaluation Preview */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Resultado Calculado Agora:</span>
                <span className="font-mono font-black text-emerald-400 text-lg">
                  {evaluateFormula(formulaFormData.formula, character.attributes)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsFormulaModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFormula}
                disabled={!formulaFormData.name.trim() || !formulaFormData.formula.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-zinc-950 font-black text-xs uppercase rounded-xl transition shadow-md"
              >
                Salvar Cálculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monster Sheet Inspection Modal */}
      <MonsterSheetModal
        isOpen={isMonsterModalOpen}
        onClose={() => setIsMonsterModalOpen(false)}
        monster={selectedMonsterForModal}
        onOpenDiceRoller={(dice, title, diff) => onOpenDiceRoller(dice, title, diff)}
      />
    </div>
  );
};
