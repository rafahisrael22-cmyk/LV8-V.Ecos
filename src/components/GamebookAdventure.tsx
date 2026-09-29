import React, { useState, useEffect, useRef } from 'react';
import {
  CharacterSheet,
  GamebookNode,
  GamebookChoice,
  DiceRollResult,
  AdventureHistoryEntry,
  AdventureSavePayload,
} from '../types/lv8';
import { rollLV8Dice } from '../utils/dice';
import { resolveSkillValue } from '../utils/characterDefaults';
import { playDiceSound, playExplosionSound, playBotchSound } from '../utils/audio';
import { downloadAdventureJSON, downloadAdventureJournalText } from '../utils/storage';
import {
  BookOpen,
  Compass,
  Sparkles,
  Swords,
  ShieldAlert,
  ArrowRight,
  Dices,
  RefreshCw,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Download,
  Upload,
  FileText,
  RotateCcw,
  Layers,
  FolderOpen
} from 'lucide-react';

interface GamebookAdventureProps {
  character: CharacterSheet;
  onUpdateCharacter: (char: CharacterSheet) => void;
  onStartCombat: (encounter: { name: string; enemyType: string; count: number }) => void;
  onOpenDiceRoller: (dice: number, title: string, diff?: number) => void;
  initialState?: {
    currentNode: GamebookNode;
    history: AdventureHistoryEntry[];
    locationName: string;
  };
  onStateChange?: (state: {
    currentNode: GamebookNode;
    history: AdventureHistoryEntry[];
    locationName: string;
  }) => void;
}

export const PRESET_ADVENTURES: { title: string; desc: string; node: GamebookNode }[] = [
  {
    title: 'Capítulo 1: O Despertar na Clareira das Dobras',
    desc: 'O ponto de partida canônico nas florestas primais onde fendas cósmicas do Véu atraem matilhas de répteis predadores.',
    node: {
      id: 'node_1_selva',
      title: 'A Clareira das Dobras e os Rastros Titânicos',
      narrative: `O dossel da floresta ancestral se fecha sobre sua cabeça como uma cúpula de folhas gélidas. Diante de você, o solo treme sutilmente; pegadas tridáctilas com mais de um metro de largura afundam na terra úmida, exalando um odor acre de enxofre e ozônio.\n\nUma distorção no ar — uma Dobra no Véu cósmico — emite um zumbido pulsante que arrepia seus pelos e faz seu Fluxo interno vacilar. Mais à frente, entre árvores partidas, dois Raptores de crista rubra farejam a carcaça de um jovem ceratopsídeo, seus olhos fixos na fenda que cintila.`,
      dangerLevel: 'Médio',
      environmentalEffect: 'Aura de Silêncio Primal Pequena (-2 dados para sustentar magias)',
      choices: [
        {
          id: 'c1',
          text: 'Esgueirar-se pelas copas das árvores para contornar os predadores sem ser notado.',
          testRequired: true,
          attribute: 'AGI',
          skill: 'furtividade',
          difficulty: 12,
          difficultyLabel: 'Médio (12)',
          successOutcome: 'Você se move como uma sombra entre os galhos. Os raptores continuam devorando sem notar sua presença.',
          failureOutcome: 'Um galho estala sob suas patas! Os raptores erguem a cabeça e soltam guinchos de caça, atacando de surpresa! Sofre 4 de dano.',
        },
        {
          id: 'c2',
          text: 'Sintonizar o Fluxo para fechar a fenda instável antes que criaturas piores atravessem.',
          testRequired: true,
          attribute: 'INS',
          skill: 'percepcao_fluxo',
          difficulty: 15,
          difficultyLabel: 'Difícil (15)',
          fluxCost: 3,
          successOutcome: 'Com um gesto firme, você tece as linhas etéreas e sela a Dobra, restaurando 5 pontos de Sanidade e purificando a atmosfera.',
          failureOutcome: 'A Dobra cospe uma onda de choque de paradoxo! Seu Fluxo é sugado em 4 pontos e a Sanidade estremece.',
        },
        {
          id: 'c3',
          text: 'Desembainhar as armas e emboscar os Raptores aproveitando a surpresa.',
          testRequired: false,
          isCombatTrigger: true,
          enemyEncounter: {
            name: 'Matilha de Raptores Vorazes',
            enemyType: 'raptor',
            count: 2,
          },
        },
      ],
    },
  },
  {
    title: 'Capítulo 2: O Santuário dos Totens Furry',
    desc: 'Ruínas ancestrais de divindades tribais cercadas por espécimes blindados de grande porte.',
    node: {
      id: 'node_2_ruinas',
      title: 'O Santuário Ancestral dos Totens Furry',
      narrative: `Você encontra as ruínas de um antigo templo tribal esculpido na rocha viva por gerações ancestrais. Monólitos ciclópicos retratam divindades totêmicas de feras primais: o Símio de Pedra, o Felino Noturno e a Serpente Eterna.\n\nNo centro do altar, uma esfera de Fluxo cristalizado pulsa com energia pura. Contudo, marcas de garras colossais nas colunas revelam que um predador apex patrulha este solo sagrado com frequência.`,
      dangerLevel: 'Alto',
      environmentalEffect: 'Solo Sagrado (+1 dado em rituais e cura)',
      choices: [
        {
          id: 'c2_1',
          text: 'Decifrar os hieróglifos ancestrais para desativar as defesas do altar.',
          testRequired: true,
          attribute: 'INT',
          skill: 'conhecimento_dinos',
          difficulty: 15,
          difficultyLabel: 'Médio (15)',
          successOutcome: 'Você compreende a liturgia antiga e o cristal se abre em segurança, concedendo-lhe um Elixir do Véu!',
          failureOutcome: 'Uma runa de defesa dispara um choque de Fluxo reverso causando 5 de dano!',
        },
        {
          id: 'c2_2',
          text: 'Escalar o pilar central com força bruta para alcançar a oferenda no topo.',
          testRequired: true,
          attribute: 'FOR',
          skill: 'atletismo',
          difficulty: 14,
          difficultyLabel: 'Médio (14)',
          successOutcome: 'Suas garras encontram fendas perfeitas na pedra. Você atinge o cume e contempla o horizonte.',
          failureOutcome: 'A pedra cede e você despenca 6 metros sofrendo 4 de dano de impacto.',
        },
        {
          id: 'c2_3',
          text: 'Ouvir o rugido distante: Um Triceratops Ancião enfurecido surge na praça!',
          testRequired: false,
          isCombatTrigger: true,
          enemyEncounter: {
            name: 'Triceratops Ancião Territorial',
            enemyType: 'triceratops',
            count: 1,
          },
        },
      ],
    },
  },
  {
    title: 'Capítulo 3: O Ninho do T-Rex Alfa (Apex Devorador)',
    desc: 'O covil supremo do devorador de magia cósmica onde o Véu colapsa sob a aura de silêncio de 500m.',
    node: {
      id: 'node_3_trex_lair',
      title: 'A Ravina dos Ossos e a Fenda do Apex',
      narrative: `Uma ravina escura juncada de carcaças esbranquiçadas se estende até onde a vista alcança. Aqui, a luz parece cinzenta e fria, e qualquer tentativa de canalizar o Fluxo parece como tentar respirar no vácuo.\n\nUm tremor profundo sacode as montanhas. Das sombras da fenda colapsada, a silhueta colossal de um T-Rex Alfa de olhos violeta emerge. Ele fareja o ar e fixa o olhar diretamente na sua essência!`,
      dangerLevel: 'Extremo',
      environmentalEffect: 'Aura de Silêncio Apex (-5 dados em canalizações mágicas)',
      choices: [
        {
          id: 'c3_1',
          text: 'Procurar abrigo numa fenda estreita da rocha onde a besta não alcança.',
          testRequired: true,
          attribute: 'AGI',
          skill: 'atletismo',
          difficulty: 18,
          difficultyLabel: 'Heroico (18)',
          successOutcome: 'Você escorrega para a segurança da fenda milésimos de segundo antes da mandíbula triturar a pedra.',
          failureOutcome: 'A onda de choque do impacto arremessa seu corpo contra a parede rochosa: sofre 6 de dano brutal!',
        },
        {
          id: 'c3_2',
          text: 'Acender um sinalizador alquímico para desorientar a visão do apex.',
          testRequired: true,
          attribute: 'INT',
          skill: 'medicina_primal',
          difficulty: 15,
          difficultyLabel: 'Difícil (15)',
          successOutcome: 'O clarão cega momentaneamente o predador titânico, dando tempo de posicionamento!',
          failureOutcome: 'O sinalizador falha sob a aura do monstro e atrai ainda mais a sua fúria.',
        },
        {
          id: 'c3_3',
          text: 'Erguer suas armas para a batalha definitiva pela sobrevivência!',
          testRequired: false,
          isCombatTrigger: true,
          enemyEncounter: {
            name: 'T-Rex Alfa das Dobras (Apex Devorador)',
            enemyType: 'trex',
            count: 1,
          },
        },
      ],
    },
  },
];

export const GamebookAdventure: React.FC<GamebookAdventureProps> = ({
  character,
  onUpdateCharacter,
  onStartCombat,
  onOpenDiceRoller,
  initialState,
  onStateChange,
}) => {
  const [currentNode, setCurrentNode] = useState<GamebookNode>(
    initialState?.currentNode || PRESET_ADVENTURES[0].node
  );
  const [history, setHistory] = useState<AdventureHistoryEntry[]>(
    initialState?.history || []
  );
  const [locationName, setLocationName] = useState<string>(
    initialState?.locationName || 'Selva Primal das Dobras'
  );
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [lastTestResult, setLastTestResult] = useState<DiceRollResult | null>(null);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state change upwards
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentNode,
        history,
        locationName,
      });
    }
  }, [currentNode, history, locationName]);

  // Generate dynamic event using server Gemini API
  const handleGenerateAIEvent = async () => {
    setIsLoadingAI(true);
    setOutcomeMessage(null);
    setLastTestResult(null);

    try {
      const response = await fetch('/api/gemini/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character,
          currentLocation: currentNode.title,
          previousAction: history[history.length - 1]?.chosenText || 'Explorando os ermos primais',
          historySummary: history.map((h) => `${h.title}: ${h.chosenText}`).slice(-3).join('; '),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.title && data.narrative && data.choices) {
          const newNode: GamebookNode = {
            id: `ai_node_${Date.now()}`,
            title: data.title,
            narrative: data.narrative,
            dangerLevel: data.dangerLevel || 'Médio',
            environmentalEffect: data.environmentalEffect,
            choices: data.choices.map((c: any) => ({
              ...c,
              // Normalize enemyType if combat trigger
              enemyEncounter: c.enemyEncounter
                ? {
                    ...c.enemyEncounter,
                    enemyType: normalizeEnemyKey(c.enemyEncounter.enemyType),
                  }
                : undefined,
            })),
          };
          setCurrentNode(newNode);
          setLocationName(data.title);
          return;
        }
      }
      // Fallback
      fallbackToNextNode();
    } catch (e) {
      console.warn('AI generation fallback:', e);
      fallbackToNextNode();
    } finally {
      setIsLoadingAI(false);
    }
  };

  const fallbackToNextNode = () => {
    const currentIndex = PRESET_ADVENTURES.findIndex((p) => p.node.id === currentNode.id);
    const nextIndex = (currentIndex + 1) % PRESET_ADVENTURES.length;
    const next = PRESET_ADVENTURES[nextIndex].node;
    setCurrentNode(next);
    setLocationName(next.title);
  };

  // Helper to map friendly enemy names to valid PREMADE_ENEMIES keys
  const normalizeEnemyKey = (name: string): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('trex') || lower.includes('t-rex') || lower.includes('tiranossauro')) return 'trex';
    if (lower.includes('spino') || lower.includes('espinossauro')) return 'espinossauro';
    if (lower.includes('trike') || lower.includes('triceratops')) return 'triceratops';
    if (lower.includes('anquilo')) return 'anquilossauro';
    if (lower.includes('estego')) return 'estegossauro';
    if (lower.includes('carno')) return 'carnotauro';
    if (lower.includes('paqui')) return 'paquicefalo';
    if (lower.includes('ptero')) return 'pterodactilo';
    if (lower.includes('micro')) return 'microraptor';
    if (lower.includes('shaman') || lower.includes('xamã')) return 'shaman_goblin';
    if (lower.includes('raptor')) return 'raptor';
    return 'raptor';
  };

  // Handle player choice
  const handleSelectChoice = (choice: GamebookChoice) => {
    // If choice triggers combat directly
    if (choice.isCombatTrigger && choice.enemyEncounter) {
      const normalizedKey = normalizeEnemyKey(choice.enemyEncounter.enemyType);
      const encounter = {
        name: choice.enemyEncounter.name,
        enemyType: normalizedKey,
        count: choice.enemyEncounter.count || 1,
      };

      setHistory((prev) => [
        ...prev,
        {
          title: currentNode.title,
          chosenText: choice.text,
          outcome: `⚔️ Entrou em combate tático com: ${encounter.name}!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      onStartCombat(encounter);
      return;
    }

    // If choice requires skill / attribute test
    if (choice.testRequired && choice.difficulty) {
      const attrKey = choice.attribute || 'AGI';
      const attrVal = character.attributes[attrKey] || 3;
      const resolved = resolveSkillValue(choice.skill, character);
      const skillVal = resolved.level;
      const dice = Math.max(1, attrVal + skillVal);

      playDiceSound();
      const roll = rollLV8Dice(dice, choice.difficulty, 0, `Teste de ${choice.skill || choice.attribute}`);
      setLastTestResult(roll);

      const rollSumm = `${roll.breakdown} = ${roll.sum} vs Dif ${choice.difficulty}`;

      if (roll.isBotch) {
        playBotchSound();
        const outcome = choice.failureOutcome || 'Falha brutal na tentativa! Sofre 4 de dano de colapso do Véu.';
        setOutcomeMessage(`💥 PÍFIO BRUTAL! ${outcome}`);
        onUpdateCharacter({
          ...character,
          hpCurrent: Math.max(0, character.hpCurrent - 4),
        });
        recordHistory(choice.text, `💥 PÍFIO: ${outcome}`, rollSumm);
      } else if (roll.success) {
        playExplosionSound();
        const outcome = choice.successOutcome || 'Você obteve sucesso com maestria!';
        setOutcomeMessage(`✨ SUCESSO! ${outcome} (Margem: +${roll.marginOfSuccess})`);
        recordHistory(choice.text, `✨ SUCESSO: ${outcome}`, rollSumm);
      } else {
        const outcome = choice.failureOutcome || 'Você não alcançou a dificuldade necessária.';
        setOutcomeMessage(`⚠️ FALHA: ${outcome}`);
        onUpdateCharacter({
          ...character,
          hpCurrent: Math.max(0, character.hpCurrent - 2),
        });
        recordHistory(choice.text, `⚠️ FALHA: ${outcome}`, rollSumm);
      }

      // Check flux cost
      if (choice.fluxCost && choice.fluxCost > 0) {
        onUpdateCharacter({
          ...character,
          fluxoCurrent: Math.max(0, character.fluxoCurrent - choice.fluxCost),
        });
      }
      return;
    }

    // Normal non-test choice: proceed to next procedural or AI event
    recordHistory(choice.text, choice.successOutcome || 'Avançou na jornada');
    handleGenerateAIEvent();
  };

  const recordHistory = (chosenText: string, outcome?: string, rollSummary?: string) => {
    setHistory((prev) => [
      ...prev,
      {
        title: currentNode.title,
        chosenText,
        outcome,
        rollSummary,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Export current adventure to JSON
  const handleExportAdventure = () => {
    const payload: AdventureSavePayload = {
      version: 'LV8-2.0-Adventure',
      adventureTitle: currentNode.title || 'Aventura na Dobra',
      savedAt: new Date().toISOString(),
      locationName: currentNode.title,
      currentNode,
      history,
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
    downloadAdventureJSON(payload);
  };

  // Export journal as Markdown
  const handleExportJournal = () => {
    const payload: AdventureSavePayload = {
      version: 'LV8-2.0-Adventure',
      adventureTitle: currentNode.title || 'Aventura na Dobra',
      savedAt: new Date().toISOString(),
      locationName: currentNode.title,
      currentNode,
      history,
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
    downloadAdventureJournalText(payload);
  };

  // Import adventure from file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: AdventureSavePayload = JSON.parse(text);

        if (parsed.currentNode && Array.isArray(parsed.history)) {
          setCurrentNode(parsed.currentNode);
          setHistory(parsed.history);
          setLocationName(parsed.locationName || parsed.currentNode.title);
          setImportError(null);
          setOutcomeMessage(`Aventura "${parsed.adventureTitle || 'Importada'}" restaurada com sucesso!`);
        } else {
          setImportError('Formato JSON de aventura inválido para o LV8.');
        }
      } catch (err: any) {
        setImportError('Erro ao ler arquivo de aventura: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load a preset adventure
  const handleLoadPreset = (preset: typeof PRESET_ADVENTURES[0]) => {
    setCurrentNode(preset.node);
    setLocationName(preset.node.title);
    setShowPresetsModal(false);
    setOutcomeMessage(`Capítulo carregado: ${preset.title}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-zinc-100 uppercase tracking-wide">
                Gamebook de Aventura da Dobra
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  currentNode.dangerLevel === 'Extremo' || currentNode.dangerLevel === 'Alto'
                    ? 'bg-red-950/60 border-red-800/60 text-red-300'
                    : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                }`}
              >
                Perigo: {currentNode.dangerLevel}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Desafios narrativos, testes de perícia com d6 explosivo e encontros dinâmicos gerados por IA.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets Chapter Selector */}
          <button
            type="button"
            onClick={() => setShowPresetsModal(true)}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 transition active:scale-95"
            title="Escolher capítulos pré-definidos de aventura"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Capítulos</span>
          </button>

          {/* Export Adventure JSON */}
          <button
            type="button"
            onClick={handleExportAdventure}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 transition active:scale-95"
            title="Exportar aventura e escolhas em formato JSON"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Exportar Aventura</span>
          </button>

          {/* Import Adventure JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 transition active:scale-95"
            title="Importar arquivo de aventura JSON"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          {/* Export Journal Text */}
          <button
            type="button"
            onClick={handleExportJournal}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 transition active:scale-95"
            title="Exportar crônica completa em Markdown"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Diário MD</span>
          </button>

          {/* Generate AI Event */}
          <button
            type="button"
            onClick={handleGenerateAIEvent}
            disabled={isLoadingAI}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/30 flex items-center gap-2 transition hover:scale-105 active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
            {isLoadingAI ? 'Criando com Gemini...' : 'Gerar com IA'}
          </button>
        </div>
      </div>

      {/* Error alert if import fails */}
      {importError && (
        <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{importError}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="text-red-400 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Narrative Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Narrative & Choices */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            {/* Title & Env */}
            <div className="border-b border-zinc-800 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{currentNode.title}</span>
              </div>
              {currentNode.environmentalEffect && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{currentNode.environmentalEffect}</span>
                </div>
              )}
            </div>

            {/* Narrative text */}
            <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed whitespace-pre-line bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
              {currentNode.narrative}
            </div>

            {/* Roll Test Feedback if any */}
            {outcomeMessage && (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  outcomeMessage.includes('PÍFIO')
                    ? 'bg-red-950/50 border-red-800 text-red-200'
                    : outcomeMessage.includes('SUCESSO')
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-100'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-xs">{outcomeMessage}</p>
                    {lastTestResult && (
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                        Rolagem: {lastTestResult.breakdown} (Total: {lastTestResult.sum} vs Dif{' '}
                        {lastTestResult.difficulty})
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAIEvent}
                    disabled={isLoadingAI}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Avançar na Aventura</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Choices Options */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" /> Escolha seu Destino:
              </h4>

              <div className="space-y-2">
                {currentNode.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    className="w-full text-left p-3.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-xl transition group flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition">
                        {choice.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        {choice.testRequired && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-bold">
                            Teste: {choice.attribute || ''} + {choice.skill || ''} (Dif {choice.difficulty})
                          </span>
                        )}
                        {choice.fluxCost && choice.fluxCost > 0 && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">
                            Custo: {choice.fluxCost} Fluxo
                          </span>
                        )}
                        {choice.isCombatTrigger && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800/40 flex items-center gap-1">
                            <Swords className="w-3 h-3" /> Inicia Combate Tático!
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-1 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Adventure Journal History */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col h-[560px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-400" /> Diário da Jornada
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">{history.length} decisões</span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-[10px] text-zinc-500 hover:text-red-400 transition"
                  title="Limpar diário"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {history.map((h, i) => (
              <div key={i} className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400">{h.title}</span>
                  {h.timestamp && (
                    <span className="text-[9px] text-zinc-500 font-mono">{h.timestamp}</span>
                  )}
                </div>
                <p className="text-zinc-300 font-medium">{h.chosenText}</p>
                {h.outcome && (
                  <p className="text-[11px] text-emerald-400 font-semibold pt-1 border-t border-zinc-800/60">
                    {h.outcome}
                  </p>
                )}
                {h.rollSummary && (
                  <p className="text-[10px] text-zinc-500 font-mono">{h.rollSummary}</p>
                )}
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-center py-12 text-zinc-600 text-xs">
                Seu diário está em branco. Faça sua primeira escolha para registrar seus feitos na Dobra.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preset Chapters Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Módulos Prontos de Aventura
              </h3>
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Escolha um dos episódios pré-escritos do sistema LV8 para jogar instantaneamente:
            </p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {PRESET_ADVENTURES.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleLoadPreset(preset)}
                  className="p-4 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-zinc-100 group-hover:text-purple-300 transition">
                      {preset.title}
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                      Perigo: {preset.node.dangerLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{preset.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
