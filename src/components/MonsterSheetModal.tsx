import React from 'react';
import { Combatant, RulesConfig } from '../types/lv8';
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
  Layers
} from 'lucide-react';

interface MonsterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  monster: Combatant | null;
  onOpenDiceRoller?: (dice: number, title: string, diff?: number, bonus?: number) => void;
}

export const MonsterSheetModal: React.FC<MonsterSheetModalProps> = ({
  isOpen,
  onClose,
  monster,
  onOpenDiceRoller,
}) => {
  if (!isOpen || !monster) return null;

  const per = monster.attributes['PER'] || 3;
  const vig = monster.skills?.['vigilancia'] ?? (monster.skills?.['sobrevivencia'] ? Math.min(2, monster.skills['sobrevivencia']) : 1);
  const vigBonus = vig * 3;
  const initFALabel = `${per}d6+${vigBonus}`;

  const agi = monster.attributes['AGI'] || 3;
  const deslocamento = agi * 3;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-zinc-900 border border-rose-500/40 w-full max-w-4xl rounded-2xl shadow-2xl shadow-rose-950/50 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-zinc-900 to-zinc-950 p-4 sm:p-5 border-b border-rose-800/40 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-rose-900/60 border border-rose-500/40 flex items-center justify-center text-rose-300 shadow-inner shrink-0 overflow-hidden text-2xl">
              {monster.avatarUrl ? (
                <img src={monster.avatarUrl} alt={monster.name} className="w-full h-full object-cover" />
              ) : monster.tokenUrl ? (
                <img src={monster.tokenUrl} alt={monster.name} className="w-full h-full object-cover" />
              ) : (
                monster.tokenEmoji || <Skull className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-rose-100 uppercase tracking-wide">
                  {monster.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Planilha Oficial LV8
                </span>
                {monster.dangerLevel && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {monster.dangerLevel}
                  </span>
                )}
                {/* Tactical Token Indicator */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300" title="Token no Grid Tático">
                  <span>Token:</span>
                  {monster.tokenUrl ? (
                    <img src={monster.tokenUrl} alt="Token" className="w-4 h-4 rounded-full object-cover inline" />
                  ) : (
                    <span className="text-sm leading-none">{monster.tokenEmoji || '🦖'}</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {monster.race || 'Predador Primal'} • {monster.className || 'Besta da Dobra'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition"
            title="Fechar planilha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Status Bar: HP, Fluxo, Armadura, Defesa, Deslocamento e Iniciativa */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* HP */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-rose-900/50 space-y-1">
              <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500/30" /> Vida (HP)
                </span>
              </div>
              <div className="font-mono font-black text-lg text-rose-200">
                {monster.hpCurrent} / {monster.hpMax}
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${Math.max(0, Math.min(100, (monster.hpCurrent / monster.hpMax) * 100))}%` }}
                />
              </div>
            </div>

            {/* Fluxo */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-cyan-900/50 space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-cyan-500/30" /> Fluxo
                </span>
              </div>
              <div className="font-mono font-black text-lg text-cyan-200">
                {monster.fluxoCurrent} / {monster.fluxoMax}
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full"
                  style={{ width: `${Math.max(0, Math.min(100, (monster.fluxoCurrent / (monster.fluxoMax || 1)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Defesa Passiva (FD) */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
              <span className="block text-xs font-bold text-zinc-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-zinc-300" /> Defesa (FD)
              </span>
              <div className="font-mono font-black text-lg text-zinc-100">
                {monster.defense}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Dificuldade para acertar</span>
            </div>

            {/* Armadura Física */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
              <span className="block text-xs font-bold text-zinc-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Armadura
              </span>
              <div className="font-mono font-black text-lg text-amber-300">
                {monster.armor || 0}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Reduz dano por golpe</span>
            </div>

            {/* Deslocamento */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-amber-900/40 space-y-1">
              <span className="block text-xs font-bold text-amber-400 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-amber-400" /> Deslocamento
              </span>
              <div className="font-mono font-black text-lg text-amber-200">
                {deslocamento} m
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">AGI ({agi}) × 3 metros</span>
            </div>

            {/* Iniciativa Oficial LV8 */}
            <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-3 rounded-xl border border-purple-500/40 space-y-1">
              <span className="block text-xs font-bold text-purple-300 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-purple-400" /> Iniciativa
              </span>
              <div className="font-mono font-black text-lg text-purple-200">
                FA: {initFALabel}
              </div>
              <span className="text-[10px] text-purple-400/80 font-mono">
                PER ({per}d6) + Vig (+{vigBonus})
              </span>
            </div>
          </div>

          {/* Atributos Primais LV8 da Criatura */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" /> Atributos Primais (Base para d6)
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[
                { key: 'FOR', name: 'Força' },
                { key: 'AGI', name: 'Agilidade' },
                { key: 'VIG', name: 'Vigor' },
                { key: 'INT', name: 'Inteligência' },
                { key: 'VON', name: 'Vontade' },
                { key: 'PRE', name: 'Presença' },
                { key: 'ESS', name: 'Essência', fallback: 'INS' },
                { key: 'PER', name: 'Percepção' },
              ].map((attr) => {
                const val = monster.attributes[attr.key] ?? (attr.fallback ? monster.attributes[attr.fallback] : 2) ?? 2;
                return (
                  <div
                    key={attr.key}
                    className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-center flex flex-col justify-between"
                  >
                    <div>
                      <span className="block text-[10px] font-bold text-amber-400">{attr.key}</span>
                      <span className="text-[9px] text-zinc-500 block truncate">{attr.name}</span>
                    </div>
                    <div className="my-1">
                      <span className="text-xl font-mono font-black text-zinc-100">{val}</span>
                      <span className="text-[9px] text-zinc-500 block font-mono">{val}d6</span>
                    </div>
                    {onOpenDiceRoller && (
                      <button
                        type="button"
                        onClick={() => onOpenDiceRoller(val, `Teste de ${attr.name} (${monster.name})`, 15)}
                        className="w-full py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold transition flex items-center justify-center gap-1"
                        title={`Rolar ${val}d6`}
                      >
                        <Dices className="w-3 h-3" /> {val}d6
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Perícias Treinadas & FA de Ação */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" /> Perícias &amp; Força de Ação (FA)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Object.entries(monster.skills || {}).map(([skillKey, skillVal]) => {
                // Determine base attribute
                let baseAttr = 'FOR';
                if (['furtividade', 'atletismo', 'pontaria', 'pilotagem'].includes(skillKey)) baseAttr = 'AGI';
                if (['vigilancia', 'sobrevivencia', 'caca', 'pressagio'].includes(skillKey)) baseAttr = 'PER';
                if (['canalizacao', 'empatia_animal'].includes(skillKey)) baseAttr = 'ESS';
                if (['conhecimento', 'medicina', 'oficio'].includes(skillKey)) baseAttr = 'INT';
                if (['manipulacao', 'arte', 'intimidacao'].includes(skillKey)) baseAttr = 'PRE';
                if (['vontade'].includes(skillKey)) baseAttr = 'VON';

                const attrDice = monster.attributes[baseAttr] ?? (baseAttr === 'ESS' ? monster.attributes['INS'] : 2) ?? 3;
                const bonus = skillKey === 'vigilancia' ? (skillVal * 3) : (skillVal * 2);
                const faDisplay = `${attrDice}d6+${bonus}`;

                return (
                  <div
                    key={skillKey}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-zinc-100 capitalize">
                          {skillKey.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                          Grau {skillVal}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Base: {baseAttr} ({attrDice}d6) + Bônus ({bonus})
                      </span>
                    </div>

                    {onOpenDiceRoller ? (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenDiceRoller(
                            attrDice,
                            `Teste de ${skillKey} (${monster.name})`,
                            15,
                            bonus
                          )
                        }
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition shrink-0"
                      >
                        <Dices className="w-3.5 h-3.5" />
                        <span>FA: {faDisplay}</span>
                      </button>
                    ) : (
                      <span className="px-2 py-1 bg-zinc-800 text-emerald-400 font-mono font-bold text-xs rounded">
                        FA: {faDisplay}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Poderes, Mordidas & Técnicas da Criatura */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Swords className="w-4 h-4 text-rose-500" /> Poderes, Ataques &amp; Técnicas Especiais
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(monster.powers || []).map((power) => (
                <div
                  key={power.id}
                  className="p-3.5 bg-zinc-950 border border-rose-900/40 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-rose-200">{power.name}</span>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Escala {power.escala}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                        {power.custoFluxo} Fluxo
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                        Dif {power.dificuldade}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {power.descricao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Aura de Silêncio Primal / Efeito de Dobra */}
          {monster.statusAura && (
            <div className="p-3.5 bg-purple-950/40 border border-purple-800/50 rounded-xl flex items-start gap-3">
              <Flame className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-purple-200 block">Efeito de Dobra / Silêncio Primal</strong>
                <p className="text-xs text-purple-300/90 mt-0.5">{monster.statusAura}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 p-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 flex items-center gap-2">
            <span>Fórmula de Iniciativa: <strong>PER (d6) + Vigilância×3</strong></span>
            <span>•</span>
            <span>Ataque: <strong>Atributo (d6) + Perícia×2</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition"
          >
            Fechar Planilha
          </button>
        </div>
      </div>
    </div>
  );
};
