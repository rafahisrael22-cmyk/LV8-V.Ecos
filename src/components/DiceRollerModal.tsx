import React, { useState } from 'react';
import { DiceRollResult } from '../types/lv8';
import { rollLV8Dice } from '../utils/dice';
import { playDiceSound, playExplosionSound, playBotchSound } from '../utils/audio';
import { Sparkles, Skull, CheckCircle, XCircle, RotateCcw, X, Dices } from 'lucide-react';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDice?: number;
  initialDifficulty?: number;
  initialBonus?: number;
  title?: string;
  contextNote?: string;
  onRollComplete?: (result: DiceRollResult) => void;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  isOpen,
  onClose,
  initialDice = 5,
  initialDifficulty = 15,
  initialBonus = 0,
  title = 'Rolagem de Dados Explosivos (LV8)',
  contextNote,
  onRollComplete,
}) => {
  const [diceCount, setDiceCount] = useState<number>(initialDice);
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [bonus, setBonus] = useState<number>(initialBonus);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDiceCount(initialDice);
      setDifficulty(initialDifficulty);
      setBonus(initialBonus);
      setResult(null);
    }
  }, [isOpen, initialDice, initialDifficulty, initialBonus]);

  if (!isOpen) return null;

  const handleRoll = () => {
    setIsRolling(true);
    playDiceSound();

    setTimeout(() => {
      const res = rollLV8Dice(diceCount, difficulty > 0 ? difficulty : undefined, bonus, contextNote);
      setResult(res);
      setIsRolling(false);

      if (res.explodedRolls.length > 0) {
        playExplosionSound();
      }
      if (res.isBotch) {
        playBotchSound();
      }
      if (onRollComplete) {
        onRollComplete(res);
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100">{title}</h3>
              {contextNote && <p className="text-xs text-zinc-400">{contextNote}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Quantidade (d6)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={diceCount}
                  onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center font-bold text-lg bg-zinc-900 border border-zinc-700 rounded-lg py-1 text-amber-300"
                />
                <button
                  type="button"
                  onClick={() => setDiceCount(diceCount + 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 block text-center mt-1">Atributo + Perícia</span>
            </div>

            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Dificuldade / FD
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDifficulty(Math.max(0, difficulty - 5))}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-bold text-lg bg-zinc-900 border border-zinc-700 rounded-lg py-1 text-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => setDifficulty(difficulty + 5)}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 block text-center mt-1">10=Fácil, 15=Méd, 20=Dif</span>
            </div>

            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Bônus Fixo (+)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBonus(Math.max(0, bonus - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={bonus}
                  onChange={(e) => setBonus(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-bold text-lg bg-zinc-900 border border-zinc-700 rounded-lg py-1 text-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setBonus(bonus + 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 block text-center mt-1">Canalização x 2 / Arma</span>
            </div>
          </div>

          {/* Roll Action Button */}
          <button
            type="button"
            onClick={handleRoll}
            disabled={isRolling}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-zinc-950 font-black text-base uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
            {isRolling ? 'Rolando Dados com Explosão...' : 'Rolar Dados LV8 (6 Explode / 1 Pífio)'}
          </button>

          {/* Result Display */}
          {result && (
            <div className={`p-4 rounded-xl border transition-all ${
              result.isBotch 
                ? 'bg-red-950/40 border-red-800/80 text-red-200'
                : result.success 
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-200'
            }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-700/50">
                <div className="flex items-center gap-2">
                  {result.isBotch ? (
                    <span className="flex items-center gap-1.5 text-red-400 font-black text-sm uppercase tracking-wide">
                      <Skull className="w-5 h-5 text-red-500" /> Falha Brutal / Pífio!
                    </span>
                  ) : result.success ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-black text-sm uppercase tracking-wide">
                      <CheckCircle className="w-5 h-5 text-emerald-400" /> Sucesso!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-sm uppercase tracking-wide">
                      <XCircle className="w-5 h-5 text-zinc-400" /> Falha Simples
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400">Total Final:</span>
                  <span className="ml-2 font-black text-2xl text-amber-400">{result.sum}</span>
                </div>
              </div>

              {/* Dice Cubes Display */}
              <div className="mb-3">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Dados Rolados:
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.rawRolls.map((d, idx) => {
                    const isExploded = d === 6;
                    const isOne = d === 1;
                    return (
                      <div
                        key={idx}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-base shadow-md transition-all ${
                          isExploded
                            ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-300 ring-offset-1 ring-offset-zinc-900 animate-pulse'
                            : isOne
                              ? 'bg-red-900/80 text-red-200 border border-red-700 line-through'
                              : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        }`}
                        title={isExploded ? 'Explodiu (6)!' : isOne ? 'Pífio (1)!' : `Dado: ${d}`}
                      >
                        {d}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explosions info */}
              {result.explodedRolls.length > 0 && (
                <div className="mb-2 p-2 bg-amber-950/40 border border-amber-800/40 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Explosões de 6:</strong> Somaram-se{' '}
                    {result.explodedRolls.map((e, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 mx-0.5 bg-amber-500/20 text-amber-300 font-bold rounded">
                        +{e}
                      </span>
                    ))}
                  </span>
                </div>
              )}

              {/* Botch / Cancel info */}
              {result.pifiosCount > 0 && (
                <div className="mb-2 p-2 bg-red-950/50 border border-red-800/40 rounded-lg text-xs text-red-300">
                  <span>
                    <strong>Pífios (1s):</strong> {result.pifiosCount} dado(s) com valor 1.{' '}
                    {result.cancelledSixesCount > 0
                      ? `Cancelou ${result.cancelledSixesCount} explosão(ões) de 6!`
                      : 'Sem 6 para cancelar — gatilho de Falha Brutal / Complicação!'}
                  </span>
                </div>
              )}

              {/* Margin of success */}
              {result.marginOfSuccess !== undefined && (
                <div className="pt-2 border-t border-zinc-700/50 flex flex-wrap items-center justify-between text-xs">
                  <span className="text-zinc-300">
                    Margem de Sucesso (MS): <strong>{result.marginOfSuccess >= 0 ? `+${result.marginOfSuccess}` : result.marginOfSuccess}</strong>
                  </span>
                  {result.extraEffectsCount !== undefined && result.extraEffectsCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30">
                      +{result.extraEffectsCount} Efeito(s) Extra(s) (+1d6 Dano / Alvo Adicional)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950/60 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
          <span>Regra LV8: 6s explodem livremente; cada 1 cancela o maior 6; sobrando 1 sem 6 = falha brutal.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
