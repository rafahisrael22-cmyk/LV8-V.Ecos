import React, { useState } from 'react';
import { LV8Logo } from './LV8Logo';
import {
  Play,
  FolderOpen,
  Settings,
  Sparkles,
  Shield,
  Dices,
  Swords,
  ChevronRight,
  WifiOff,
  User,
  Heart,
  Zap,
  Info
} from 'lucide-react';
import { CharacterSheet } from '../types/lv8';

interface MainMenuProps {
  hasActiveCharacter: boolean;
  activeCharacter: CharacterSheet;
  onNewGame: () => void;
  onLoadGame: () => void;
  onOpenSettings: () => void;
  onContinue: () => void;
}

export function MainMenu({
  hasActiveCharacter,
  activeCharacter,
  onNewGame,
  onLoadGame,
  onOpenSettings,
  onContinue,
}: MainMenuProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glowing Nebula Pulses */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] animate-pulse duration-1000" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] animate-pulse duration-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-amber-500/5 via-cyan-500/5 to-purple-500/5 rounded-full blur-[160px]" />

        {/* Subtle Runic / Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:28px_28px]"
        />

        {/* Floating Particle Simulation Dots */}
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-ping duration-1000" />
          <div className="absolute top-[45%] right-[20%] w-2 h-2 rounded-full bg-cyan-400/30 animate-pulse duration-700" />
          <div className="absolute bottom-[30%] left-[25%] w-1 h-1 rounded-full bg-amber-300/40 animate-ping duration-500" />
          <div className="absolute top-[70%] right-[35%] w-1.5 h-1.5 rounded-full bg-purple-400/30 animate-pulse duration-1000" />
        </div>
      </div>

      {/* Top Status Header */}
      <header className="relative z-10 p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 font-mono backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
          <span>Modo Offline Ativo • Armazenamento Local</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span>LV8 v2.0 • Ecos da Dobra</span>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full space-y-8">
        {/* Animated Brand & Title */}
        <div className="space-y-4">
          <div className="inline-block transform hover:scale-105 transition duration-500">
            <LV8Logo size="lg" variant="full" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-yellow-600 drop-shadow-md uppercase">
              ECOS DA DOBRA
            </h1>
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-zinc-400 uppercase">
              Fantasia Primal Bestial &amp; Horror Cósmico • Sistema LV8 2.0
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400 pt-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              ⚡ Evolução por Gasto de XP (Sem Níveis)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              🎲 6 Explode • 1 Pífio Brutal
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              🐾 18 Perícias Oficiais
            </span>
          </div>
        </div>

        {/* Active Character Quick Card (if exists) */}
        {hasActiveCharacter && activeCharacter && (
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center gap-4 text-left max-w-md w-full backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 font-black">
              {activeCharacter.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-zinc-200 truncate">{activeCharacter.name}</div>
              <div className="text-[11px] text-zinc-400 truncate">
                {activeCharacter.className} • {activeCharacter.race}
              </div>
            </div>
            <div className="text-right text-[11px] font-mono shrink-0">
              <div className="text-rose-400">{activeCharacter.hpCurrent}/{activeCharacter.hpMax} HP</div>
              <div className="text-amber-400 font-bold">{activeCharacter.xp ?? 0} XP</div>
            </div>
          </div>
        )}

        {/* Main Menu Action Buttons */}
        <div className="w-full max-w-md space-y-3">
          {/* Continue button if active save */}
          {hasActiveCharacter && (
            <button
              type="button"
              onClick={onContinue}
              onMouseEnter={() => setHoveredButton('continue')}
              onMouseLeave={() => setHoveredButton(null)}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-xl shadow-emerald-950/40 flex items-center justify-between group transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-3">
                <Play className="w-4 h-4 fill-zinc-950" />
                Continuar Jornada
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          )}

          {/* Novo Jogo */}
          <button
            type="button"
            onClick={onNewGame}
            onMouseEnter={() => setHoveredButton('new_game')}
            onMouseLeave={() => setHoveredButton(null)}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-xl shadow-amber-950/40 flex items-center justify-between group transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-3">
              <Swords className="w-5 h-5" />
              Novo Jogo
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>

          {/* Carregar Jogo */}
          <button
            type="button"
            onClick={onLoadGame}
            onMouseEnter={() => setHoveredButton('load_game')}
            onMouseLeave={() => setHoveredButton(null)}
            className="w-full py-3.5 px-6 bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/50 text-zinc-200 font-bold text-sm uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-between group transform hover:-translate-y-0.5 backdrop-blur-md"
          >
            <span className="flex items-center gap-3">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              Carregar Jogo
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition" />
          </button>

          {/* Configurações / Modo Desenvolvedor */}
          <button
            type="button"
            onClick={onOpenSettings}
            onMouseEnter={() => setHoveredButton('settings')}
            onMouseLeave={() => setHoveredButton(null)}
            className="w-full py-3.5 px-6 bg-zinc-900/60 hover:bg-zinc-800/80 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 font-bold text-sm uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-between group transform hover:-translate-y-0.5 backdrop-blur-md"
          >
            <span className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-purple-400" />
              Configurações (Modo Desenvolvedor)
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
              Admin
            </span>
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 p-6 text-center text-xs text-zinc-600 max-w-7xl mx-auto w-full border-t border-zinc-900">
        <p>
          Simulador LV8 2.0 • Modo Jogador Offline &amp; Modo Desenvolvedor • Criação de NPCs &amp; Missões Integradas
        </p>
      </footer>
    </div>
  );
}
