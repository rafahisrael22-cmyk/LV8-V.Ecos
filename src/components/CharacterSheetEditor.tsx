import React, { useState } from 'react';
import { CharacterSheet, RulesConfig, Power, InventoryItem } from '../types/lv8';
import { DEFAULT_CLASSES, DEFAULT_RACES, evaluateFormula, DEFAULT_ECOS_SKILLS } from '../utils/characterDefaults';
import { exportCharacterToPDF } from '../utils/pdfExport';
import { RulesAndCalculationsManager } from './RulesAndCalculationsManager';
import { calculateActionRule } from '../utils/rulesEngine';
import {
  FileText,
  Table,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Shield,
  Heart,
  Zap,
  Activity,
  User,
  Compass,
  Sword,
  Sliders,
  Dices,
  RefreshCw,
  Printer,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface CharacterSheetEditorProps {
  character: CharacterSheet;
  rulesConfig: RulesConfig;
  onUpdateCharacter: (char: CharacterSheet) => void;
  onUpdateRules: (rules: RulesConfig) => void;
  onOpenDiceRoller: (dice: number, title: string, diff?: number, bonus?: number) => void;
  isDevMode?: boolean;
}

export const CharacterSheetEditor: React.FC<CharacterSheetEditorProps> = ({
  character,
  rulesConfig,
  onUpdateCharacter,
  onUpdateRules,
  onOpenDiceRoller,
  isDevMode = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sheet' | 'spreadsheet' | 'rules'>('sheet');
  const [isCreationMode, setIsCreationMode] = useState<boolean>(true);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillAttr, setNewSkillAttr] = useState('FOR');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillInitialLevel, setNewSkillInitialLevel] = useState(1);
  const [isEditingSkillsSheet, setIsEditingSkillsSheet] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Recalculate derived pools whenever attributes change or formulas change
  const recalculateDerived = (updatedAttrs: Record<string, number>, currentSheet: CharacterSheet = character): CharacterSheet => {
    const updated = { ...currentSheet, attributes: updatedAttrs };
    
    // Evaluate based on configured derived formulas
    const hpFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'hp')?.formula || '10 + (VIG * 5)';
    const fluxoFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'fluxo')?.formula || '10 + (ESS * 5)';
    const deslocFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'deslocamento')?.formula || 'AGI * 3';
    const sanidadeFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'sanidade')?.formula || '10 + (VON * 5)';
    const fadigaFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'fadiga')?.formula || '10 + (FOR * 5)';
    const auraFormula = rulesConfig.derivedFormulas.find((f) => f.key === 'aura')?.formula || '10 + (PRE * 5)';

    const newHp = evaluateFormula(hpFormula, updatedAttrs);
    const newFluxo = evaluateFormula(fluxoFormula, updatedAttrs);
    const newDesloc = evaluateFormula(deslocFormula, updatedAttrs);
    const newSanidade = evaluateFormula(sanidadeFormula, updatedAttrs);
    const newFadiga = evaluateFormula(fadigaFormula, updatedAttrs);
    const newAura = evaluateFormula(auraFormula, updatedAttrs);

    return {
      ...updated,
      hpMax: newHp,
      hpCurrent: currentSheet.hpCurrent !== undefined ? Math.min(currentSheet.hpCurrent, newHp) : newHp,
      fluxoMax: newFluxo,
      fluxoCurrent: currentSheet.fluxoCurrent !== undefined ? Math.min(currentSheet.fluxoCurrent, newFluxo) : newFluxo,
      deslocamento: newDesloc,
      sanidadeMax: newSanidade,
      sanidadeCurrent: currentSheet.sanidadeCurrent !== undefined ? Math.min(currentSheet.sanidadeCurrent, newSanidade) : newSanidade,
      fadigaMax: newFadiga,
      fadigaCurrent: currentSheet.fadigaCurrent !== undefined ? Math.min(currentSheet.fadigaCurrent, newFadiga) : newFadiga,
      auraMax: newAura,
      auraCurrent: currentSheet.auraCurrent !== undefined ? Math.min(currentSheet.auraCurrent, newAura) : newAura,
    };
  };

  // Attribute points calculation:
  // Every attribute starts with 1 free point (minimum 1, cannot be zeroed).
  // Free points budget to spend is 8 points (rulesConfig.attributePointsBudget).
  // Spent points is the sum of (attribute_value - 1).
  const totalAttrPointsSpent = rulesConfig.attributes.reduce((sum, attr) => {
    const val = character.attributes[attr.key] ?? 1;
    return sum + Math.max(0, val - 1);
  }, 0);

  // Skill points: budget is dynamically calculated as 10 + (INT * 2)
  const currentInt = character.attributes['INT'] ?? 2;
  const dynamicSkillPointsBudget = 10 + (currentInt * 2);

  // Total skill points spent: sum of skill levels
  const totalSkillsPointsSpent = Object.values(character.skills).reduce((a, b) => a + (b || 0), 0);

  // Handle attribute change:
  // Cannot drop below 1 (every attribute starts with 1 free point, non-zeroable).
  // In creation mode, maximum is 3. In evolution mode, maximum is rulesConfig.attributeMaxLegendary.
  const handleAttributeChange = (key: string, value: number) => {
    const minVal = 1;
    const maxVal = isCreationMode ? 3 : rulesConfig.attributeMaxLegendary;
    const clamped = Math.max(minVal, Math.min(maxVal, value));
    const nextAttrs = { ...character.attributes, [key]: clamped };
    const nextChar = recalculateDerived(nextAttrs);
    onUpdateCharacter(nextChar);
  };

  // Handle skill level change:
  // Starts with 0. In creation mode, maximum is 2. In evolution mode, maximum is rulesConfig.skillMaxLegendary.
  const handleSkillChange = (skillId: string, value: number) => {
    const minVal = 0;
    const maxVal = isCreationMode ? 2 : rulesConfig.skillMaxLegendary;
    const clamped = Math.max(minVal, Math.min(maxVal, value));
    onUpdateCharacter({
      ...character,
      skills: {
        ...character.skills,
        [skillId]: clamped,
      },
    });
  };

  // Update existing skill properties (name, primaryAttribute, description)
  const handleUpdateSkill = (skillId: string, updates: Partial<{ name: string; primaryAttribute: string; description: string }>) => {
    const updatedSkills = rulesConfig.skills.map((s) =>
      s.id === skillId ? { ...s, ...updates } : s
    );
    onUpdateRules({
      ...rulesConfig,
      skills: updatedSkills,
    });
  };

  // Add custom skill
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const id = newSkillName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const newSkill = {
      id,
      name: newSkillName.trim(),
      primaryAttribute: newSkillAttr,
      description: newSkillDesc.trim() || 'Perícia customizada pelo jogador.',
      isCustom: true,
    };
    onUpdateRules({
      ...rulesConfig,
      skills: [...rulesConfig.skills, newSkill],
    });
    onUpdateCharacter({
      ...character,
      skills: { ...character.skills, [id]: Math.max(0, newSkillInitialLevel) },
    });
    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillInitialLevel(1);
  };

  // Remove ANY skill
  const handleRemoveSkill = (skillId: string) => {
    onUpdateRules({
      ...rulesConfig,
      skills: rulesConfig.skills.filter((s) => s.id !== skillId),
    });
    const nextSkills = { ...character.skills };
    delete nextSkills[skillId];
    onUpdateCharacter({ ...character, skills: nextSkills });
  };

  // Reset skills to official 18 Ecos skills list
  const handleResetEcosSkills = () => {
    onUpdateRules({ ...rulesConfig, skills: DEFAULT_ECOS_SKILLS });
    setStatusNotice('Perícias restauradas com sucesso para a lista oficial de 18 perícias do Ecos da Dobra!');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Add custom attribute
  const handleAddAttribute = () => {
    if (!newAttrName.trim() || !newAttrKey.trim()) return;
    const key = newAttrKey.toUpperCase().trim().slice(0, 4);
    const newAttr = {
      key,
      name: newAttrName.trim(),
      description: 'Atributo configurado pelo mestre.',
      initialMin: 1,
      initialMax: rulesConfig.attributeMaxInitial,
      legendaryMax: rulesConfig.attributeMaxLegendary,
      defaultValue: 2,
    };
    onUpdateRules({
      ...rulesConfig,
      attributes: [...rulesConfig.attributes, newAttr],
    });
    const nextAttrs = { ...character.attributes, [key]: 2 };
    onUpdateCharacter(recalculateDerived(nextAttrs));
    setNewAttrName('');
    setNewAttrKey('');
  };

  // Remove attribute
  const handleRemoveAttribute = (key: string) => {
    if (rulesConfig.attributes.length <= 4) {
      setStatusNotice('Aviso: Mínimo de 4 atributos necessários para manter as regras de testes.');
      setTimeout(() => setStatusNotice(null), 4000);
      return;
    }
    onUpdateRules({
      ...rulesConfig,
      attributes: rulesConfig.attributes.filter((a) => a.key !== key),
    });
    const nextAttrs = { ...character.attributes };
    delete nextAttrs[key];
    onUpdateCharacter(recalculateDerived(nextAttrs));
  };

  // Update formula string
  const handleFormulaChange = (key: string, formulaStr: string) => {
    const updatedFormulas = rulesConfig.derivedFormulas.map((f) =>
      f.key === key ? { ...f, formula: formulaStr } : f
    );
    const nextRules = { ...rulesConfig, derivedFormulas: updatedFormulas };
    onUpdateRules(nextRules);
    onUpdateCharacter(recalculateDerived(character.attributes));
  };

  // Handle image upload from computer
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onUpdateCharacter({ ...character, avatarUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Class Selection Handler
  const handleSelectClass = (clsName: string) => {
    const cls = DEFAULT_CLASSES.find((c) => c.name === clsName);
    if (!cls) return;
    onUpdateCharacter({
      ...character,
      className: cls.name,
      classFluxo: cls.fluxo,
      powers: [
        ...character.powers.filter((p) => p.source !== 'classe'),
        ...cls.powers,
      ],
    });
  };

  // Race Selection Handler
  const handleSelectRace = (rName: string) => {
    const rc = DEFAULT_RACES.find((r) => r.name === rName);
    if (!rc) return;
    onUpdateCharacter({
      ...character,
      race: rc.name,
      raceEco: rc.eco,
      powers: [
        ...character.powers.filter((p) => p.source !== 'raca'),
        ...rc.powers,
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Modes and PDF Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('sheet')}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
              activeSubTab === 'sheet'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <User className="w-4 h-4" /> Ficha de Jogo
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('spreadsheet')}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
              activeSubTab === 'spreadsheet'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Table className="w-4 h-4" /> Modo Planilha Excel
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('rules')}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
              activeSubTab === 'rules'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Sliders className="w-4 h-4" /> Configurar Regras & Fórmulas
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportCharacterToPDF(character, rulesConfig)}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 transition hover:scale-105 active:scale-95"
            title="Gera arquivo PDF completo pronto para impressão A4"
          >
            <FileText className="w-4 h-4" /> Baixar Ficha PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm rounded-xl border border-zinc-700 flex items-center gap-1.5 transition"
            title="Imprimir direto do navegador"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <span>{statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-amber-400 hover:text-amber-100 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* SUBTAB 1: FICHA DE JOGO */}
      {activeSubTab === 'sheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Portrait, Identity, Vitals */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="relative group rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 aspect-square flex items-center justify-center">
                {character.avatarUrl ? (
                  <img
                    src={character.avatarUrl}
                    alt={character.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <User className="w-16 h-16 text-zinc-600 mb-2" />
                    <span className="text-xs text-zinc-400 font-semibold">Avatar do Personagem</span>
                    <span className="text-[11px] text-zinc-500">Faça upload da imagem ou cole uma foto</span>
                  </div>
                )}

                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-white text-xs font-bold gap-2">
                  <Upload className="w-6 h-6 text-amber-400" />
                  Carregar Imagem (JPG/PNG)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name & Player */}
              <div className="space-y-3">
                {isDevMode ? (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-purple-400 mb-1">
                      Nome do Personagem (Modo Desenvolvedor)
                    </label>
                    <input
                      type="text"
                      value={character.name}
                      onChange={(e) => onUpdateCharacter({ ...character, name: e.target.value })}
                      className="w-full bg-zinc-950 border border-purple-500/50 rounded-xl px-3 py-2 text-zinc-100 font-bold focus:border-amber-500 outline-none"
                      placeholder="Ex: Slyra Garra-Negra"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                      Nome do Personagem
                    </label>
                    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-black text-sm flex items-center justify-between">
                      <span>{character.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">🔒 Consolidado</span>
                    </div>
                  </div>
                )}

                {isDevMode ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-purple-400 mb-1">Raça Furry</label>
                      <select
                        value={character.race}
                        onChange={(e) => handleSelectRace(e.target.value)}
                        className="w-full bg-zinc-950 border border-purple-500/50 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
                      >
                        {DEFAULT_RACES.map((r) => (
                          <option key={r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-purple-400 mb-1">Classe LV8</label>
                      <select
                        value={character.className}
                        onChange={(e) => handleSelectClass(e.target.value)}
                        className="w-full bg-zinc-950 border border-purple-500/50 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
                      >
                        {DEFAULT_CLASSES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800">
                      <span className="block text-[10px] font-semibold text-zinc-400">Raça Furry</span>
                      <strong className="block text-xs text-zinc-100 mt-0.5 truncate">{character.race}</strong>
                      <span className="text-[10px] text-cyan-400 font-mono block truncate">{character.raceEco}</span>
                    </div>

                    <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800">
                      <span className="block text-[10px] font-semibold text-zinc-400">Classe LV8</span>
                      <strong className="block text-xs text-zinc-100 mt-0.5 truncate">{character.className}</strong>
                      <span className="text-[10px] text-amber-400 font-mono block truncate">{character.classFluxo}</span>
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Fluxo Primário:</span>
                    <strong className="text-amber-400">{character.classFluxo}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Eco Ancestral:</span>
                    <strong className="text-cyan-400">{character.raceEco}</strong>
                  </div>
                </div>

                {/* XP Summary Display */}
                <div className="p-3 bg-gradient-to-r from-amber-950/40 to-zinc-950 rounded-xl border border-amber-500/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>XP para Evolução:</span>
                  </div>
                  <div className="font-mono text-sm font-black text-amber-300">
                    {character.xp ?? 0} XP <span className="text-[10px] text-zinc-500 font-normal">({character.totalXp ?? 0} Total)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vital Pools Tracker */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Recursos Vitais & Fórmulas
                </h4>
                <span className="text-[10px] text-zinc-500 font-mono">6 Pools Derivados</span>
              </div>

              {/* 1. HP Bar (10 + VIG×5) */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-500/20" /> Vida / HP (10 + VIG×5)
                  </span>
                  <span className="font-mono font-bold text-zinc-200">
                    {character.hpCurrent} / {character.hpMax}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-rose-400 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (character.hpCurrent / (character.hpMax || 1)) * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-end gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, hpCurrent: Math.max(0, character.hpCurrent - 1) })}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, hpCurrent: Math.max(0, character.hpCurrent - 5) })}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, hpCurrent: Math.min(character.hpMax, character.hpCurrent + 1) })}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, hpCurrent: character.hpMax })}
                    className="px-2 py-0.5 bg-rose-950/60 text-rose-300 hover:bg-rose-900 rounded text-[11px] font-bold border border-rose-800/40"
                  >
                    Total
                  </button>
                </div>
              </div>

              {/* 2. Fluxo Bar (10 + ESS×5) */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-400">
                    <Zap className="w-3.5 h-3.5 fill-cyan-500/20" /> Pontos de Fluxo (10 + ESS×5)
                  </span>
                  <span className="font-mono font-bold text-zinc-200">
                    {character.fluxoCurrent} / {character.fluxoMax}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (character.fluxoCurrent / (character.fluxoMax || 1)) * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-end gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, fluxoCurrent: Math.max(0, character.fluxoCurrent - 1) })}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, fluxoCurrent: Math.max(0, character.fluxoCurrent - 5) })}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, fluxoCurrent: Math.min(character.fluxoMax, character.fluxoCurrent + 1) })}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateCharacter({ ...character, fluxoCurrent: character.fluxoMax })}
                    className="px-2 py-0.5 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 rounded text-[11px] font-bold border border-cyan-800/40"
                  >
                    Total
                  </button>
                </div>
              </div>

              {/* 3. Sanidade Bar (HP Mental = 10 + VON×5) */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-purple-400">
                    <Shield className="w-3.5 h-3.5 text-purple-400" /> Sanidade (HP Mental = 10 + VON×5)
                  </span>
                  <span className="font-mono font-bold text-zinc-200">
                    {character.sanidadeCurrent ?? character.sanidadeMax ?? 20} / {character.sanidadeMax ?? 20}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-400 h-full transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((character.sanidadeCurrent ?? character.sanidadeMax ?? 20) / (character.sanidadeMax || 1)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        sanidadeCurrent: Math.max(0, (character.sanidadeCurrent ?? character.sanidadeMax ?? 20) - 1),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        sanidadeCurrent: Math.max(0, (character.sanidadeCurrent ?? character.sanidadeMax ?? 20) - 5),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        sanidadeCurrent: Math.min(
                          character.sanidadeMax || 20,
                          (character.sanidadeCurrent ?? character.sanidadeMax ?? 20) + 1
                        ),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        sanidadeCurrent: character.sanidadeMax || 20,
                      })
                    }
                    className="px-2 py-0.5 bg-purple-950/60 text-purple-300 hover:bg-purple-900 rounded text-[11px] font-bold border border-purple-800/40"
                  >
                    Total
                  </button>
                </div>
              </div>

              {/* 4. Fadiga Bar (Estamina = 10 + FOR×5) */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-orange-400">
                    <Activity className="w-3.5 h-3.5 text-orange-400" /> Fadiga (Estamina = 10 + FOR×5)
                  </span>
                  <span className="font-mono font-bold text-zinc-200">
                    {character.fadigaCurrent ?? character.fadigaMax ?? 20} / {character.fadigaMax ?? 20}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-amber-400 h-full transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((character.fadigaCurrent ?? character.fadigaMax ?? 20) / (character.fadigaMax || 1)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        fadigaCurrent: Math.max(0, (character.fadigaCurrent ?? character.fadigaMax ?? 20) - 1),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        fadigaCurrent: Math.max(0, (character.fadigaCurrent ?? character.fadigaMax ?? 20) - 5),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        fadigaCurrent: Math.min(
                          character.fadigaMax || 20,
                          (character.fadigaCurrent ?? character.fadigaMax ?? 20) + 1
                        ),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        fadigaCurrent: character.fadigaMax || 20,
                      })
                    }
                    className="px-2 py-0.5 bg-orange-950/60 text-orange-300 hover:bg-orange-900 rounded text-[11px] font-bold border border-orange-800/40"
                  >
                    Total
                  </button>
                </div>
              </div>

              {/* 5. Aura Bar (HP Social = 10 + PRE×5) */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-teal-400">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Aura (HP Social = 10 + PRE×5)
                  </span>
                  <span className="font-mono font-bold text-zinc-200">
                    {character.auraCurrent ?? character.auraMax ?? 15} / {character.auraMax ?? 15}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-600 to-cyan-400 h-full transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((character.auraCurrent ?? character.auraMax ?? 15) / (character.auraMax || 1)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        auraCurrent: Math.max(0, (character.auraCurrent ?? character.auraMax ?? 15) - 1),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        auraCurrent: Math.max(0, (character.auraCurrent ?? character.auraMax ?? 15) - 5),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        auraCurrent: Math.min(
                          character.auraMax || 15,
                          (character.auraCurrent ?? character.auraMax ?? 15) + 1
                        ),
                      })
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCharacter({
                        ...character,
                        auraCurrent: character.auraMax || 15,
                      })
                    }
                    className="px-2 py-0.5 bg-teal-950/60 text-teal-300 hover:bg-teal-900 rounded text-[11px] font-bold border border-teal-800/40"
                  >
                    Total
                  </button>
                </div>
              </div>

              {/* 6. Deslocamento (AGI × 3 metros) */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-amber-400">Deslocamento Tático</span>
                  <span className="block text-[10px] text-zinc-400">Metros por Ação Menor (AGI × 3m)</span>
                </div>
                <div className="font-mono font-black text-xl text-amber-300 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  {character.deslocamento} metros
                </div>
              </div>

              {/* 7. Iniciativa Oficial (PER em d6 + Vigilância × 3) */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-purple-400">Iniciativa Oficial LV8</span>
                  <span className="block text-[10px] text-zinc-400">
                    FA = PER ({character.attributes['PER'] || 1}d6) + Vigilância×3 (+{(character.skills['vigilancia'] || 0) * 3})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const per = character.attributes['PER'] || 1;
                    const vig = character.skills['vigilancia'] || 0;
                    const bonus = vig * 3;
                    onOpenDiceRoller(per, `Rolagem de Iniciativa Oficial (FA ${per}d6+${bonus})`, 15, bonus);
                  }}
                  className="px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition"
                  title="Rolar Iniciativa com a regra oficial"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>FA: {character.attributes['PER'] || 1}d6+{(character.skills['vigilancia'] || 0) * 3}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Attributes, Skills, Aspects & Powers */}
          <div className="lg:col-span-8 space-y-6">
            {/* Attributes Grid (Editable & Click to Roll) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" /> Atributos Primal LV8
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Começa com 1 grátis (não zerável) + 8 pontos livres para gastar. Máx 3 na criação.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-500 block">Pontos Livres Gastos:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        totalAttrPointsSpent > rulesConfig.attributePointsBudget
                          ? 'text-red-400'
                          : totalAttrPointsSpent === rulesConfig.attributePointsBudget
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                      }`}
                    >
                      {totalAttrPointsSpent} / {rulesConfig.attributePointsBudget} pts
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreationMode(!isCreationMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isCreationMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                    title="Alterna entre limite de criação (máx 3) e modo evolução (máx 10)"
                  >
                    {isCreationMode ? 'Modo Criação (Máx 3)' : 'Modo Campanha (Máx 10)'}
                  </button>
                </div>
              </div>

              {totalAttrPointsSpent < rulesConfig.attributePointsBudget && (
                <div className="mb-3 p-2 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Você ainda tem <strong>{rulesConfig.attributePointsBudget - totalAttrPointsSpent} pontos livres</strong> para distribuir entre seus atributos!
                  </span>
                </div>
              )}

              {totalAttrPointsSpent > rulesConfig.attributePointsBudget && (
                <div className="mb-3 p-2 bg-red-950/60 border border-red-800/60 rounded-xl text-[11px] text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Atenção: Você gastou {totalAttrPointsSpent} pontos livres ({totalAttrPointsSpent - rulesConfig.attributePointsBudget} a mais do que o orçamento de {rulesConfig.attributePointsBudget})!
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {rulesConfig.attributes.map((attr) => {
                  const val = character.attributes[attr.key] || 1;
                  const spentOnThis = Math.max(0, val - 1);
                  return (
                    <div
                      key={attr.key}
                      className="group bg-zinc-950 hover:bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">{attr.key}</span>
                        <span className="text-[10px] text-zinc-500 truncate max-w-[80px]" title={attr.name}>
                          {attr.name}
                        </span>
                      </div>

                      <div className="my-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={val <= 1}
                          onClick={() => handleAttributeChange(attr.key, val - 1)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 text-xs font-bold"
                          title="Não pode ser reduzido abaixo de 1 (ponto base grátis)"
                        >
                          -
                        </button>
                        <div className="text-center">
                          <span className="font-black text-2xl text-zinc-100 font-mono w-8 text-center block">
                            {val}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {spentOnThis === 0 ? 'Base 1' : `+${spentOnThis} gasto`}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isCreationMode && val >= 3}
                          onClick={() => handleAttributeChange(attr.key, val + 1)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 text-xs font-bold"
                          title={isCreationMode && val >= 3 ? 'Máximo 3 durante a criação de personagem' : '+1 ponto'}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDiceRoller(val, `Teste de Atributo: ${attr.name} (${attr.key})`, 15)}
                        className="w-full py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <Dices className="w-3.5 h-3.5" /> Rolar {val}d6
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills Matrix */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-500" /> 18 Perícias Oficiais do Ecos (0 a {isCreationMode ? 2 : rulesConfig.skillMaxLegendary})
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Pontos Iniciais: <strong>10 + (INT {currentInt} × 2) = {dynamicSkillPointsBudget} pts</strong>. Início em 0, máx 2 na criação.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-500 block">Pontos Gastos:</span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        totalSkillsPointsSpent > dynamicSkillPointsBudget
                          ? 'text-red-400'
                          : totalSkillsPointsSpent === dynamicSkillPointsBudget
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                      }`}
                    >
                      {totalSkillsPointsSpent} / {dynamicSkillPointsBudget} pts
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingSkillsSheet(!isEditingSkillsSheet)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isEditingSkillsSheet
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {isEditingSkillsSheet ? 'Salvar Edição' : 'Editar / Renomear Perícias'}
                  </button>
                </div>
              </div>

              {/* Quick Ecos Restore Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-zinc-950/70 border border-zinc-800/60 rounded-xl text-xs">
                <span className="text-zinc-400 text-[11px]">
                  Lista oficial do Ecos da Dobra (totalmente editável: você pode adicionar ou excluir perícias):
                </span>
                <button
                  type="button"
                  onClick={handleResetEcosSkills}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded-lg text-[11px] font-bold border border-zinc-700 transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Restaurar 18 Perícias Oficiais
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-2">
                {rulesConfig.skills.map((skill) => {
                  const skillLevel = character.skills[skill.id] || 0;
                  const attrVal = character.attributes[skill.primaryAttribute] || 1;
                  const flatBonus = skill.id === 'vigilancia' ? (skillLevel * 3) : (skillLevel * 2);
                  const faLabel = flatBonus > 0 ? `${attrVal}d6+${flatBonus}` : `${attrVal}d6`;

                  return (
                    <div
                      key={skill.id}
                      className={`p-3 rounded-xl border transition ${
                        isEditingSkillsSheet
                          ? 'bg-zinc-950/90 border-amber-500/50 shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Normal View */}
                      {!isEditingSkillsSheet ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-100 truncate">{skill.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-bold">
                                {skill.primaryAttribute} ({attrVal}d6)
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 truncate" title={skill.description}>
                              {skill.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-zinc-900 px-1 py-0.5 rounded-lg border border-zinc-800">
                              <button
                                type="button"
                                onClick={() => handleSkillChange(skill.id, skillLevel - 1)}
                                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-sm text-emerald-400 w-5 text-center" title={`Grau ${skillLevel} (+${flatBonus} na FA)`}>
                                {skillLevel}
                              </span>
                              <button
                                type="button"
                                disabled={isCreationMode && skillLevel >= 2}
                                onClick={() => handleSkillChange(skill.id, skillLevel + 1)}
                                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 text-xs flex items-center justify-center font-bold"
                                title={isCreationMode && skillLevel >= 2 ? 'Máximo 2 durante a criação de personagem' : '+1 nível'}
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onOpenDiceRoller(
                                  attrVal,
                                  `Teste: ${skill.name} (FA ${faLabel})`,
                                  15,
                                  flatBonus
                                )
                              }
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                              title={`FA = ${attrVal}d6 de ${skill.primaryAttribute} + (Perícia ${skillLevel} × 2) = ${faLabel}`}
                            >
                              <Dices className="w-3.5 h-3.5" />
                              <span>FA: {faLabel}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Edit Mode View */
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => handleUpdateSkill(skill.id, { name: e.target.value })}
                              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-bold focus:border-amber-400 outline-none"
                              placeholder="Nome da perícia"
                            />
                            <select
                              value={skill.primaryAttribute}
                              onChange={(e) => handleUpdateSkill(skill.id, { primaryAttribute: e.target.value })}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono outline-none"
                            >
                              {rulesConfig.attributes.map((a) => (
                                <option key={a.key} value={a.key}>
                                  {a.key} ({a.name})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill.id)}
                              className="p-1.5 bg-red-950/50 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg transition"
                              title="Excluir esta perícia da ficha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={skill.description}
                            onChange={(e) => handleUpdateSkill(skill.id, { description: e.target.value })}
                            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-2 py-0.5 text-[11px] text-zinc-400 focus:border-zinc-600 outline-none"
                            placeholder="Descrição / uso da perícia"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Skill Section */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  + Adicionar Nova Perícia
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome da perícia (ex: Navegação, Alquimia, Cavalaria)..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="flex-1 min-w-[180px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newSkillAttr}
                    onChange={(e) => setNewSkillAttr(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono outline-none"
                  >
                    {rulesConfig.attributes.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.key} ({a.name})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    max={rulesConfig.skillMaxLegendary}
                    value={newSkillInitialLevel}
                    onChange={(e) => setNewSkillInitialLevel(parseInt(e.target.value) || 0)}
                    className="w-16 bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-center font-mono text-emerald-400 outline-none"
                    title="Nível inicial"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Perícia
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Descrição opcional do uso da perícia..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1 text-[11px] text-zinc-400 outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {/* Quick Action Rules Box (Combinações de Atributos & Perícias) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Sword className="w-4 h-4 text-amber-500" /> Ações & Regras de Combate (Atributo + Perícia)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Manobras de ataque e testes criados combinando atributos e perícias (dados d6 ou bônus decimal fixo).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('rules')}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" /> + Criar Regra / Fórmulas
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(rulesConfig.customActionRules || []).map((rule) => {
                  const calc = calculateActionRule(rule, character);
                  return (
                    <div
                      key={rule.id}
                      className="p-3 bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 rounded-xl transition flex flex-col justify-between space-y-2 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition truncate">
                            {rule.name}
                          </strong>
                          <span className="font-mono font-black text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded shrink-0">
                            FA = {calc.formulaLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1" title={rule.description}>
                          {rule.description || calc.breakdownSummary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                        <span className="text-[10px] text-zinc-500 font-mono truncate" title={calc.breakdownSummary}>
                          {calc.breakdownSummary}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            onOpenDiceRoller(
                              calc.diceCount,
                              `Teste: ${rule.name} (FA = ${calc.formulaLabel})`,
                              15
                            )
                          }
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition"
                        >
                          <Dices className="w-3.5 h-3.5" /> Rolar ({calc.formulaLabel})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Powers & Dogmas */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Poderes de Fluxo & Ancestrais
                </h4>
                <span className="text-xs text-zinc-400">
                  Custo = 3 + (Escala × 2) + Duração
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {character.powers.map((power) => (
                  <div
                    key={power.id}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 hover:border-cyan-500/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-zinc-100 font-bold">{power.name}</strong>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 text-[10px] font-bold rounded border border-cyan-800/40">
                          Escala {power.escala}
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 text-[10px] font-bold rounded border border-amber-800/40">
                          {power.custoFluxo} Fluxo
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{power.descricao}</p>
                    {power.efeitoMS && (
                      <p className="text-[10px] text-emerald-400 font-semibold">
                        MS +5: {power.efeitoMS}
                      </p>
                    )}
                    <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60 text-[10px] text-zinc-500">
                      <span>Dificuldade: {power.dificuldade}</span>
                      <span>Duração: {power.duracao}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aspects (Fate Core inspired) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" /> Aspectos do Personagem
              </h4>
              <p className="text-xs text-zinc-400">
                Podem ser invocados em testes difíceis para conceder +1d6 (ou -1d6 no oponente). Custo: 1 Fluxo ou Invocação Gratuita.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Conceito Principal (Obrigatório)
                  </label>
                  <input
                    type="text"
                    value={character.concept}
                    onChange={(e) => onUpdateCharacter({ ...character, concept: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none"
                    placeholder="Ex: Ladina Felina caçadora de anomalias"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Problema / Complicação (Obrigatório)
                  </label>
                  <input
                    type="text"
                    value={character.trouble}
                    onChange={(e) => onUpdateCharacter({ ...character, trouble: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none"
                    placeholder="Ex: Odor atrai dinossauros titânicos"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MODO PLANILHA EXCEL */}
      {activeSubTab === 'spreadsheet' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald-400" /> Planilha Interativa de Criação & Cálculos
              </h3>
              <p className="text-xs text-zinc-400">
                Funciona exatamente como uma planilha: edite as células diretamente e veja os totais e fórmulas derivadas sendo calculados instantaneamente.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
              <span className="text-xs text-zinc-400">Orçamento de Atributos:</span>
              <span className={`font-mono font-bold text-sm ${totalAttrPointsSpent > rulesConfig.attributePointsBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                {totalAttrPointsSpent} / {rulesConfig.attributePointsBudget} pontos
              </span>
            </div>
          </div>

          {/* Attributes Spreadsheet Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Tabela de Atributos (Limites & Valores)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-800/80 text-zinc-300 font-bold border-b border-zinc-700">
                    <th className="p-3 border-r border-zinc-700">Cód</th>
                    <th className="p-3 border-r border-zinc-700">Nome do Atributo</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Valor Atual</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Mín Inicial</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Máx Criação</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Máx Lendário</th>
                    <th className="p-3 border-r border-zinc-700">Descrição / Efeito</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200 font-mono">
                  {rulesConfig.attributes.map((attr) => {
                    const val = character.attributes[attr.key] || 0;
                    return (
                      <tr key={attr.key} className="hover:bg-zinc-900/60 transition">
                        <td className="p-2.5 font-bold text-amber-400 border-r border-zinc-800">{attr.key}</td>
                        <td className="p-2.5 font-sans font-semibold text-zinc-100 border-r border-zinc-800">{attr.name}</td>
                        <td className="p-2.5 text-center border-r border-zinc-800 bg-zinc-900/50">
                          <input
                            type="number"
                            min={attr.initialMin}
                            max={rulesConfig.attributeMaxLegendary}
                            value={val}
                            onChange={(e) => handleAttributeChange(attr.key, parseInt(e.target.value) || 0)}
                            className="w-16 text-center font-bold text-base bg-zinc-950 border border-zinc-700 rounded py-0.5 text-amber-300"
                          />
                        </td>
                        <td className="p-2.5 text-center text-zinc-400 border-r border-zinc-800">{attr.initialMin}</td>
                        <td className="p-2.5 text-center text-zinc-400 border-r border-zinc-800">{rulesConfig.attributeMaxInitial}</td>
                        <td className="p-2.5 text-center text-zinc-400 border-r border-zinc-800">{rulesConfig.attributeMaxLegendary}</td>
                        <td className="p-2.5 font-sans text-[11px] text-zinc-400 border-r border-zinc-800">{attr.description}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(attr.key)}
                            className="text-zinc-600 hover:text-red-400 p-1"
                            title="Remover atributo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick add attribute row */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Código (ex: SOR)"
                maxLength={4}
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                className="w-24 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono uppercase"
              />
              <input
                type="text"
                placeholder="Nome do Atributo (ex: Sorte)"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                className="flex-1 min-w-[200px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Atributo
              </button>
            </div>
          </div>

          {/* Skills Spreadsheet Table (Full Excel Grid) */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-500" /> Tabela de Perícias (Edição Completa de Células &amp; Fórmulas)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Edite o nome da perícia, o atributo associado, a descrição ou o nível em cada linha. A fórmula de dados é recalculada na hora.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 font-mono">=SOMA(Perícias):</span>
                  <span className={`font-mono font-bold text-xs ${totalSkillsPointsSpent > dynamicSkillPointsBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                    {totalSkillsPointsSpent} / {dynamicSkillPointsBudget} pontos
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetEcosSkills}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded text-[11px] font-bold border border-zinc-700 transition flex items-center gap-1"
                    title="Restaurar as 18 perícias oficiais do LV8 Ecos da Dobra"
                  >
                    <RotateCcw className="w-3 h-3 inline" /> 18 Ecos da Dobra
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-800/80 text-zinc-300 font-bold border-b border-zinc-700 font-sans">
                    <th className="p-3 border-r border-zinc-700">ID</th>
                    <th className="p-3 border-r border-zinc-700">Nome da Perícia (Editável)</th>
                    <th className="p-3 border-r border-zinc-700">Atributo Base</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Nível (0-10)</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Valor Atrib.</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Fórmula Total de Dados</th>
                    <th className="p-3 border-r border-zinc-700">Descrição da Perícia</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200 font-mono">
                  {rulesConfig.skills.map((skill) => {
                    const skillLevel = character.skills[skill.id] || 0;
                    const attrVal = character.attributes[skill.primaryAttribute] || 0;
                    const totalDice = skillLevel + attrVal;

                    return (
                      <tr key={skill.id} className="hover:bg-zinc-900/60 transition">
                        <td className="p-2.5 text-zinc-500 text-[10px] border-r border-zinc-800 font-mono">{skill.id}</td>
                        <td className="p-2 border-r border-zinc-800">
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => handleUpdateSkill(skill.id, { name: e.target.value })}
                            className="w-full bg-zinc-900/80 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-sans font-semibold text-xs focus:border-emerald-400 outline-none"
                          />
                        </td>
                        <td className="p-2 border-r border-zinc-800">
                          <select
                            value={skill.primaryAttribute}
                            onChange={(e) => handleUpdateSkill(skill.id, { primaryAttribute: e.target.value })}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-amber-300 font-bold text-xs outline-none"
                          >
                            {rulesConfig.attributes.map((a) => (
                              <option key={a.key} value={a.key}>
                                {a.key} - {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center border-r border-zinc-800 bg-zinc-900/40">
                          <input
                            type="number"
                            min="0"
                            max={isCreationMode ? 2 : rulesConfig.skillMaxLegendary}
                            value={skillLevel}
                            onChange={(e) => handleSkillChange(skill.id, parseInt(e.target.value) || 0)}
                            className="w-14 text-center font-bold text-sm bg-zinc-950 border border-zinc-700 rounded py-0.5 text-emerald-400"
                          />
                        </td>
                        <td className="p-2.5 text-center text-zinc-400 border-r border-zinc-800">
                          {attrVal}
                        </td>
                        <td className="p-2.5 text-center font-bold text-cyan-400 border-r border-zinc-800 bg-cyan-950/20">
                          <span className="font-mono text-xs">
                            ={skill.primaryAttribute}({attrVal}) + Per({skillLevel}) ➔ <strong>{totalDice}d6</strong>
                          </span>
                        </td>
                        <td className="p-2 border-r border-zinc-800 font-sans">
                          <input
                            type="text"
                            value={skill.description}
                            onChange={(e) => handleUpdateSkill(skill.id, { description: e.target.value })}
                            className="w-full bg-transparent border-b border-transparent focus:border-zinc-600 rounded px-1.5 py-0.5 text-[11px] text-zinc-400 focus:text-zinc-200 outline-none"
                          />
                        </td>
                        <td className="p-2 text-center space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenDiceRoller(
                                totalDice,
                                `Teste Planilha: ${skill.name} (${skill.primaryAttribute} ${attrVal} + Perícia ${skillLevel})`,
                                15
                              )
                            }
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-bold"
                            title={`Rolar ${totalDice}d6`}
                          >
                            <Dices className="w-3.5 h-3.5 inline mr-1" />
                            {totalDice}d6
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition"
                            title="Remover perícia da planilha"
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

            {/* Quick add skill row in spreadsheet */}
            <div className="flex flex-wrap items-center gap-2 pt-2 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                + Nova Linha de Perícia:
              </span>
              <input
                type="text"
                placeholder="Nome da perícia..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="flex-1 min-w-[160px] bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-emerald-500"
              />
              <select
                value={newSkillAttr}
                onChange={(e) => setNewSkillAttr(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono outline-none"
              >
                {rulesConfig.attributes.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.key} ({a.name})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                max={rulesConfig.skillMaxLegendary}
                value={newSkillInitialLevel}
                onChange={(e) => setNewSkillInitialLevel(parseInt(e.target.value) || 0)}
                className="w-16 bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-center font-mono text-emerald-400 outline-none"
                title="Nível inicial"
              />
              <input
                type="text"
                placeholder="Descrição opcional..."
                value={newSkillDesc}
                onChange={(e) => setNewSkillDesc(e.target.value)}
                className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar à Planilha
              </button>
            </div>
          </div>

          {/* Derived Formulas Spreadsheet Table */}
          <div className="space-y-2 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Fórmulas Derivadas (Estilo Excel - Calculadas Dinamicamente)
              </h4>
              <button
                type="button"
                onClick={() => setShowFormulaHelp(!showFormulaHelp)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" /> Dicas de fórmulas
              </button>
            </div>

            {showFormulaHelp && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 leading-relaxed">
                Você pode utilizar qualquer expressão matemática com os códigos de atributo. Exemplo:
                <code> 10 + (VIG * 5)</code>, <code> 10 + (INS * 5)</code>, <code> AGI * 3</code>, <code> 10 + (VON * 5)</code>. O sistema substitui automaticamente as variáveis e calcula o resultado final.
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-zinc-800/80 text-zinc-300 font-bold border-b border-zinc-700 font-sans">
                    <th className="p-3 border-r border-zinc-700">Recurso</th>
                    <th className="p-3 border-r border-zinc-700">Fórmula Configurável</th>
                    <th className="p-3 border-r border-zinc-700 text-center">Valor Calculado</th>
                    <th className="p-3">Consequência a Zero (Regra LV8)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {rulesConfig.derivedFormulas.map((form) => {
                    const calculated = evaluateFormula(form.formula, character.attributes);
                    return (
                      <tr key={form.key} className="hover:bg-zinc-900/60 transition">
                        <td className="p-2.5 font-sans font-bold text-zinc-100 border-r border-zinc-800">{form.name}</td>
                        <td className="p-2.5 border-r border-zinc-800">
                          <input
                            type="text"
                            value={form.formula}
                            onChange={(e) => handleFormulaChange(form.key, e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-cyan-300 font-mono text-xs focus:border-cyan-400 outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-center font-bold text-base text-emerald-400 border-r border-zinc-800 bg-zinc-900/40">
                          {calculated}
                        </td>
                        <td className="p-2.5 font-sans text-[11px] text-zinc-400">{form.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CONFIGURAR REGRAS, CÁLCULOS & MOTOR DE COMBATE */}
      {activeSubTab === 'rules' && (
        <RulesAndCalculationsManager
          character={character}
          rulesConfig={rulesConfig}
          onUpdateRules={onUpdateRules}
          onUpdateCharacter={onUpdateCharacter}
          onOpenDiceRoller={onOpenDiceRoller}
        />
      )}
    </div>
  );
};
