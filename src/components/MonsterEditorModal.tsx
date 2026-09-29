import React, { useState, useEffect } from 'react';
import { Combatant, Power } from '../types/lv8';
import { rollLV8Dice } from '../utils/dice';
import {
  Skull,
  Shield,
  Heart,
  Zap,
  Compass,
  Swords,
  X,
  Dices,
  Flame,
  AlertTriangle,
  Move,
  Eye,
  Activity,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Smile,
  RefreshCw
} from 'lucide-react';

interface MonsterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  monster: Combatant | null;
  onSaveMonster: (savedMonster: Combatant) => void;
  onOpenDiceRoller?: (dice: number, title: string, diff?: number, bonus?: number) => void;
}

const EMOJI_TOKEN_PRESETS = [
  { emoji: '🦖', label: 'T-Rex / Terópode' },
  { emoji: '🦅', label: 'Pterodáctilo / Alado' },
  { emoji: '🐊', label: 'Espinossauro / Réptil' },
  { emoji: '🦏', label: 'Triceratops / Chifres' },
  { emoji: '🐢', label: 'Anquilossauro / Couraçado' },
  { emoji: '🦎', label: 'Microraptor / Árbreo' },
  { emoji: '🐗', label: 'Paquicefalo / Aríete' },
  { emoji: '🐺', label: 'Predador Furtivo' },
  { emoji: '🐍', label: 'Serpente Cósmica' },
  { emoji: '🦇', label: 'Sombra Voadora' },
  { emoji: '🕷️', label: 'Aracnídeo da Dobra' },
  { emoji: '🐅', label: 'Dente-de-Sabre' },
  { emoji: '🐉', label: 'Titã Primal Apex' },
  { emoji: '👹', label: 'Xamã / Corrompido' },
  { emoji: '💀', label: 'Espectro do Véu' },
  { emoji: '🔥', label: 'Elemental de Chamas' },
  { emoji: '⚡', label: 'Besta de Choque' },
  { emoji: '🛡️', label: 'Golem de Rocha' },
];

export const MonsterEditorModal: React.FC<MonsterEditorModalProps> = ({
  isOpen,
  onClose,
  monster,
  onSaveMonster,
  onOpenDiceRoller,
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'attributes' | 'skills' | 'powers'>('identity');
  const [testRollResult, setTestRollResult] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Combatant>({
    id: `enemy_${Date.now()}`,
    name: 'Nova Criatura da Dobra',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Besta Predadora',
    race: 'Terópode Primal',
    avatarUrl: '',
    tokenUrl: '',
    tokenEmoji: '🦖',
    hpMax: 25,
    hpCurrent: 25,
    fluxoMax: 15,
    fluxoCurrent: 15,
    defense: 14,
    armor: 2,
    attributes: { FOR: 4, AGI: 3, VIG: 4, INT: 1, VON: 2, PRE: 2, ESS: 1, PER: 3 },
    skills: { combate: 3, atletismo: 2, vigilancia: 2, furtividade: 2 },
    powers: [
      {
        id: `pow_${Date.now()}`,
        name: 'Mordida Voraz',
        source: 'raca',
        escala: 1,
        duracao: 'Instantâneo',
        dificuldade: 10,
        custoFluxo: 0,
        descricao: 'Ataque corpo-a-corpo: causa 2d6+2 de dano perfurante.',
      },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Pequena (-1 dado num raio de 20m)',
    dangerLevel: 'Perigoso',
    size: 'Médio',
    tactics: 'Ataca alvos isolados e usa o terreno para emboscar.',
    isCustom: true,
  });

  useEffect(() => {
    if (monster) {
      setFormData({
        ...monster,
        attributes: {
          FOR: monster.attributes['FOR'] ?? 3,
          AGI: monster.attributes['AGI'] ?? 3,
          VIG: monster.attributes['VIG'] ?? 3,
          INT: monster.attributes['INT'] ?? 1,
          VON: monster.attributes['VON'] ?? 2,
          PRE: monster.attributes['PRE'] ?? 2,
          ESS: monster.attributes['ESS'] ?? monster.attributes['INS'] ?? 1,
          PER: monster.attributes['PER'] ?? 3,
        },
        skills: { ...(monster.skills || {}) },
        powers: [...(monster.powers || [])],
        tokenEmoji: monster.tokenEmoji || '🦖',
      });
    }
  }, [monster, isOpen]);

  if (!isOpen) return null;

  // Initiative calculation helper
  const per = formData.attributes['PER'] || 3;
  const vig = formData.skills['vigilancia'] || 0;
  const vigBonus = vig * 3;
  const initFALabel = `${per}d6+${vigBonus}`;
  const agi = formData.attributes['AGI'] || 3;
  const deslocamento = agi * 3;

  // Handle image upload for Bestiary Artwork
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'tokenUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Test initiative roll right inside the editor
  const handleTestInitiative = () => {
    const res = rollLV8Dice(per, undefined, vigBonus, `Iniciativa de ${formData.name}`);
    setTestRollResult(`Rolou: ${res.sum} ➔ ${res.breakdown}`);
  };

  // Auto-recalculate recommended vital stats based on LV8 core rules
  const handleAutoCalculateVitals = () => {
    const vigVal = formData.attributes['VIG'] || 3;
    const essVal = formData.attributes['ESS'] || 1;
    const agiVal = formData.attributes['AGI'] || 3;
    const defSkill = formData.skills['atletismo'] || formData.skills['combate'] || 1;

    setFormData((prev) => ({
      ...prev,
      hpMax: 10 + (vigVal * 5),
      hpCurrent: 10 + (vigVal * 5),
      fluxoMax: 10 + (essVal * 5),
      fluxoCurrent: 10 + (essVal * 5),
      defense: 10 + agiVal + defSkill,
    }));
  };

  const handleSave = () => {
    onSaveMonster({
      ...formData,
      hpCurrent: formData.hpMax,
      fluxoCurrent: formData.fluxoMax,
      isCustom: true,
    });
    onClose();
  };

  // Add power
  const handleAddPower = () => {
    const newPower: Power = {
      id: `pow_${Date.now()}`,
      name: 'Novo Ataque / Poder',
      source: 'classe',
      escala: 2,
      duracao: 'Instantâneo',
      dificuldade: 15,
      custoFluxo: 0,
      descricao: 'Descrição do ataque e dano causado.',
    };
    setFormData((prev) => ({
      ...prev,
      powers: [...prev.powers, newPower],
    }));
  };

  // Remove power
  const handleRemovePower = (powerId: string) => {
    setFormData((prev) => ({
      ...prev,
      powers: prev.powers.filter((p) => p.id !== powerId),
    }));
  };

  // Update power
  const handleUpdatePower = (index: number, updated: Partial<Power>) => {
    setFormData((prev) => {
      const copy = [...prev.powers];
      copy[index] = { ...copy[index], ...updated };
      return { ...prev, powers: copy };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-zinc-900 border border-rose-500/50 w-full max-w-4xl rounded-2xl shadow-2xl shadow-rose-950/60 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-zinc-900 to-zinc-950 p-4 sm:p-5 border-b border-rose-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-900/60 border border-rose-500/40 flex items-center justify-center text-rose-300 shadow-inner shrink-0 text-2xl">
              {formData.tokenEmoji || <Skull className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-rose-100 uppercase tracking-wide">
                  Editor de Planilha do Monstro
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Modo Desenvolvedor LV8
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure atributos, imagens, tokens para grid de combate e a fórmula balanceada de iniciativa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition"
            title="Fechar editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="bg-zinc-950 px-4 pt-2 border-b border-zinc-800 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'identity'
                ? 'border-rose-500 text-rose-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Identidade, Imagem &amp; Tokens
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attributes')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'attributes'
                ? 'border-amber-500 text-amber-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Atributos, Vigor &amp; Defesas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'skills'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Perícias &amp; Iniciativa (PERd6+Vig×3)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('powers')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'powers'
                ? 'border-purple-500 text-purple-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> Ataques, Poderes &amp; Aura
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: IDENTIDADE, IMAGEM & TOKEN */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Nome da Criatura *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 font-bold text-sm outline-none focus:border-rose-500"
                    placeholder="Ex: T-Rex Alfa da Fenda"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Espécie / Linhagem Primal
                  </label>
                  <input
                    type="text"
                    value={formData.race || ''}
                    onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 text-sm outline-none focus:border-rose-500"
                    placeholder="Ex: Tiranossaurídeo Cósmico"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Classe / Função Tática
                  </label>
                  <input
                    type="text"
                    value={formData.className || ''}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 text-sm outline-none focus:border-rose-500"
                    placeholder="Ex: Superpredador de Emboscada"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Nível de Ameaça
                    </label>
                    <select
                      value={formData.dangerLevel || 'Perigoso'}
                      onChange={(e) => setFormData({ ...formData, dangerLevel: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 outline-none"
                    >
                      <option value="Perigoso">Perigoso</option>
                      <option value="Ameaça Maior">Ameaça Maior</option>
                      <option value="Catástrofe Viva">Catástrofe Viva</option>
                      <option value="Devorador Apex">Devorador Apex</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Porte / Tamanho
                    </label>
                    <select
                      value={formData.size || 'Médio'}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 outline-none"
                    >
                      <option value="Pequeno">Pequeno</option>
                      <option value="Médio">Médio</option>
                      <option value="Grande">Grande</option>
                      <option value="Colossal">Colossal</option>
                      <option value="Apex Titânico">Apex Titânico</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Visual Assets: Bestiary Artwork & Grid Token */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-500" /> Ilustração do Bestiário &amp; Token para o Grid de Combate
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left: Bestiary Portrait Image */}
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-zinc-300">
                      1. Imagem Principal do Monstro (Bestiário)
                    </span>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                        {formData.avatarUrl ? (
                          <img
                            src={formData.avatarUrl}
                            alt={formData.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Skull className="w-8 h-8 text-zinc-600" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <input
                          type="text"
                          placeholder="URL da Imagem (https://...)"
                          value={formData.avatarUrl || ''}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
                        />

                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-rose-400" />
                          <span>Carregar Imagem Local</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'avatarUrl')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right: Grid Token (Emoji or Custom Image) */}
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <span>2. Token para o Grid Tático de Combate</span>
                      <span className="text-[10px] text-zinc-500 font-mono">(Emotion ou Imagem)</span>
                    </span>

                    <div className="flex items-center gap-3">
                      {/* Live Token Preview */}
                      <div className="w-14 h-14 rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center shadow-lg shadow-rose-950/60 shrink-0 overflow-hidden">
                        {formData.tokenUrl ? (
                          <img
                            src={formData.tokenUrl}
                            alt="Token"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl select-none">{formData.tokenEmoji || '🦖'}</span>
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">Token Atual:</span>
                          <input
                            type="text"
                            maxLength={4}
                            value={formData.tokenEmoji || '🦖'}
                            onChange={(e) => setFormData({ ...formData, tokenEmoji: e.target.value })}
                            className="w-14 text-center bg-zinc-900 border border-zinc-700 rounded-lg py-1 text-base font-bold text-zinc-100 outline-none"
                            placeholder="🦖"
                            title="Digite ou cole um emoji"
                          />

                          <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 cursor-pointer transition">
                            <Upload className="w-3 h-3 text-cyan-400" />
                            <span>Token PNG</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'tokenUrl')}
                              className="hidden"
                            />
                          </label>

                          {formData.tokenUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, tokenUrl: '' })}
                              className="text-xs text-red-400 hover:underline"
                            >
                              Remover PNG
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 block">
                          Aparecerá no Grid Tático de Combate e na fita de iniciativa.
                        </span>
                      </div>
                    </div>

                    {/* Quick Emotion Presets */}
                    <div className="pt-2 border-t border-zinc-900">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Tokens Rápidos de Emoção / Criaturas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {EMOJI_TOKEN_PRESETS.map((t) => (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => setFormData({ ...formData, tokenEmoji: t.emoji, tokenUrl: '' })}
                            className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition border ${
                              formData.tokenEmoji === t.emoji && !formData.tokenUrl
                                ? 'bg-rose-500/20 border-rose-500 text-white scale-110 shadow'
                                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                            }`}
                            title={t.label}
                          >
                            {t.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavior & Tactics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Inteligência Artificial Tática
                  </label>
                  <select
                    value={formData.aiIntelligence}
                    onChange={(e) => setFormData({ ...formData, aiIntelligence: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                  >
                    <option value="selvagem">Selvagem (Foco no alvo mais próximo / com menor vida)</option>
                    <option value="estrategica">Estratégica (Usa poderes de controle e foca alvos frágeis)</option>
                    <option value="defensiva">Defensiva (Mantém distância e prioriza sobrevivência)</option>
                    <option value="emboscador">Emboscador (Avança de surpresa e recua com mobilidade)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Diretrizes Táticas / Lore
                  </label>
                  <input
                    type="text"
                    value={formData.tactics || ''}
                    onChange={(e) => setFormData({ ...formData, tactics: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                    placeholder="Ex: Caça em bando de 2 a 3 criaturas, focando na retaguarda."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATRIBUTOS PRIMAIS & VITAIS */}
          {activeTab === 'attributes' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-black uppercase text-amber-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500" /> 8 Atributos Primais (Base para d6)
                    </h4>
                    <p className="text-xs text-zinc-400">
                      O valor do atributo define quantos dados d6 são rolados nos testes de ação.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCalculateVitals}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    title="Calcular HP (10 + VIG×5), Fluxo (10 + ESS×5) e FD (10 + AGI + Defesa)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Auto-Calcular Vitais LV8
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'FOR', name: 'Força', desc: 'Dano corpo a corpo' },
                    { key: 'AGI', name: 'Agilidade', desc: 'Deslocamento (AGI×3m)' },
                    { key: 'VIG', name: 'Vigor', desc: 'Define HP (10+VIG×5)' },
                    { key: 'INT', name: 'Inteligência', desc: 'Raciocínio & Tática' },
                    { key: 'VON', name: 'Vontade', desc: 'Resistência Mental' },
                    { key: 'PRE', name: 'Presença', desc: 'Rugidos & Ameaça' },
                    { key: 'ESS', name: 'Essência', desc: 'Fluxo (10+ESS×5)' },
                    { key: 'PER', name: 'Percepção', desc: 'Iniciativa (PER em d6)' },
                  ].map((attr) => {
                    const val = formData.attributes[attr.key] || 1;
                    return (
                      <div
                        key={attr.key}
                        className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-amber-400">{attr.key}</strong>
                          <span className="text-[10px] text-zinc-500">{attr.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                attributes: {
                                  ...formData.attributes,
                                  [attr.key]: Math.max(1, val - 1),
                                },
                              })
                            }
                            className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-xl text-zinc-100 flex-1 text-center">
                            {val}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                attributes: {
                                  ...formData.attributes,
                                  [attr.key]: Math.min(10, val + 1),
                                },
                              })
                            }
                            className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[9px] text-zinc-500 block text-center font-mono">
                          Rola {val}d6 • {attr.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Derived Vitals (HP, Fluxo, Defesa, Armadura, Deslocamento) */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-500" /> Defesas &amp; Recursos Vitais da Criatura
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* HP */}
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 mb-1">
                      Vida Máxima (HP)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={formData.hpMax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hpMax: parseInt(e.target.value) || 20,
                          hpCurrent: parseInt(e.target.value) || 20,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 font-mono font-bold text-rose-200 outline-none"
                    />
                    <span className="text-[9px] text-zinc-500 font-mono">Fórmula: 10 + (VIG×5)</span>
                  </div>

                  {/* Fluxo */}
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-400 mb-1">
                      Fluxo Máximo
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.fluxoMax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fluxoMax: parseInt(e.target.value) || 10,
                          fluxoCurrent: parseInt(e.target.value) || 10,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 font-mono font-bold text-cyan-200 outline-none"
                    />
                    <span className="text-[9px] text-zinc-500 font-mono">Fórmula: 10 + (ESS×5)</span>
                  </div>

                  {/* Defesa (FD) */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Defesa Passiva (FD)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={formData.defense}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defense: parseInt(e.target.value) || 14,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 font-mono font-bold text-zinc-100 outline-none"
                    />
                    <span className="text-[9px] text-zinc-500 font-mono">10 + AGI + Perícia</span>
                  </div>

                  {/* Armadura */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 mb-1">
                      Armadura Física
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={formData.armor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          armor: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 font-mono font-bold text-amber-300 outline-none"
                    />
                    <span className="text-[9px] text-zinc-500 font-mono">Reduz dano por ataque</span>
                  </div>

                  {/* Deslocamento */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 mb-1">
                      Deslocamento
                    </label>
                    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 font-mono font-bold text-amber-300 text-sm">
                      {deslocamento} metros
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">AGI ({agi}) × 3 metros</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERÍCIAS & FÓRMULA DE INICIATIVA */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* Highlight Box: Live Initiative Rule & Balance Checker */}
              <div className="p-4 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 rounded-2xl space-y-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-purple-200 uppercase tracking-wide flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" /> Fórmula Oficial de Iniciativa do Sistema LV8
                    </h4>
                    <p className="text-xs text-purple-300/80 mt-0.5">
                      Garante que a iniciativa permaneça tática e balanceada (nunca valores abusivos como 70+).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestInitiative}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <Dices className="w-4 h-4" /> Testar Rolagem de Iniciativa
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 rounded-xl border border-purple-800/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Cálculo Dinâmico:</span>
                    <strong className="text-purple-300 text-base">
                      FA = PER ({per}d6) + (Vigilância {vig} × 3 = +{vigBonus}) ➔ FA: {initFALabel}
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-400 block text-[10px]">Faixa Estimada de Resultado:</span>
                    <span className="text-emerald-400 font-bold">~ {10 + vigBonus} a {20 + vigBonus} pontos</span>
                  </div>
                </div>

                {testRollResult && (
                  <div className="p-2.5 bg-purple-900/40 border border-purple-700/50 rounded-xl text-xs font-mono text-purple-200">
                    🎲 {testRollResult}
                  </div>
                )}
              </div>

              {/* Skills Editor */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-500" /> Perícias Treinadas da Criatura (Grau 0 a 5)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'vigilancia', name: 'Vigilância', attr: 'PER', isInit: true },
                    { id: 'combate', name: 'Combate (Mordida / Garras)', attr: 'FOR' },
                    { id: 'armas_brancas', name: 'Armas Brancas', attr: 'FOR' },
                    { id: 'pontaria', name: 'Pontaria / Disparo', attr: 'AGI' },
                    { id: 'atletismo', name: 'Atletismo / Esquiva', attr: 'AGI' },
                    { id: 'furtividade', name: 'Furtividade', attr: 'AGI' },
                    { id: 'sobrevivencia', name: 'Sobrevivência / Caça', attr: 'PER' },
                    { id: 'canalizacao', name: 'Canalização de Fluxo', attr: 'ESS' },
                    { id: 'intimidacao', name: 'Intimidação / Rugido', attr: 'PRE' },
                  ].map((sk) => {
                    const lvl = formData.skills[sk.id] || 0;
                    const attrDice = formData.attributes[sk.attr] || 2;
                    const bonus = sk.isInit ? (lvl * 3) : (lvl * 2);
                    const faText = `${attrDice}d6+${bonus}`;

                    return (
                      <div
                        key={sk.id}
                        className={`p-3 rounded-xl border transition ${
                          sk.isInit
                            ? 'bg-purple-950/30 border-purple-500/40'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-zinc-100 flex items-center gap-1">
                            {sk.name}
                            {sk.isInit && (
                              <span className="text-[9px] px-1 bg-purple-500/20 text-purple-300 rounded font-mono">
                                Iniciativa
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-zinc-500 text-[10px]">
                            {sk.attr} ({attrDice}d6)
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  skills: {
                                    ...formData.skills,
                                    [sk.id]: Math.max(0, lvl - 1),
                                  },
                                })
                              }
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-sm text-emerald-400 w-5 text-center">
                              {lvl}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  skills: {
                                    ...formData.skills,
                                    [sk.id]: Math.min(5, lvl + 1),
                                  },
                                })
                              }
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-emerald-400">
                            FA: {faText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PODERES, ATAQUES & AURA */}
          {activeTab === 'powers' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-rose-400 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-rose-500" /> Ataques Especiais, Mordidas &amp; Técnicas
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Defina manobras de ataque, garras titânicas e poderes de fluxo da besta.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddPower}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Ataque
                </button>
              </div>

              <div className="space-y-3">
                {formData.powers.map((pow, idx) => (
                  <div
                    key={pow.id}
                    className="p-3.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={pow.name}
                        onChange={(e) => handleUpdatePower(idx, { name: e.target.value })}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-100 flex-1 outline-none"
                        placeholder="Nome do Ataque (ex: Mordida Apex)"
                      />

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-zinc-500">Escala:</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={pow.escala}
                          onChange={(e) => handleUpdatePower(idx, { escala: parseInt(e.target.value) || 1 })}
                          className="w-12 bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-0.5 text-center text-xs text-zinc-200 outline-none"
                        />

                        <span className="text-zinc-500">Fluxo:</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={pow.custoFluxo}
                          onChange={(e) => handleUpdatePower(idx, { custoFluxo: parseInt(e.target.value) || 0 })}
                          className="w-12 bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-0.5 text-center text-xs text-cyan-300 outline-none"
                        />

                        <span className="text-zinc-500">Dif:</span>
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={pow.dificuldade}
                          onChange={(e) => handleUpdatePower(idx, { dificuldade: parseInt(e.target.value) || 10 })}
                          className="w-12 bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-0.5 text-center text-xs text-rose-300 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemovePower(pow.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition"
                          title="Remover ataque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={pow.descricao}
                      onChange={(e) => handleUpdatePower(idx, { descricao: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-zinc-700 resize-none"
                      placeholder="Efeito detalhado do golpe: dano em d6, condições aplicadas (Sangrando, Atordoado)..."
                    />
                  </div>
                ))}
              </div>

              {/* Status Aura & Fold Effects */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <label className="block text-xs font-bold uppercase text-purple-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-purple-500" /> Aura de Silêncio Primal / Efeito de Dobra
                </label>
                <input
                  type="text"
                  value={formData.statusAura || ''}
                  onChange={(e) => setFormData({ ...formData, statusAura: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-purple-200 outline-none"
                  placeholder="Ex: Aura de Silêncio Primal Média (-2 dados de magia num raio de 50m)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 p-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-400 font-mono">
            Iniciativa Calculada: <strong className="text-purple-300">{initFALabel}</strong> • Deslocamento: <strong className="text-amber-300">{deslocamento}m</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-rose-950/50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Salvar Monstro no Bestiário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
