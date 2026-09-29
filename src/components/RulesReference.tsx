import React, { useState } from 'react';
import { BookOpen, Shield, Swords, Sparkles, AlertTriangle, Eye, Flame, Compass, Search, Filter, ShieldAlert, Award } from 'lucide-react';
import { DEFAULT_CLASSES, DEFAULT_RACES, PREMADE_ENEMIES, DINOSAUR_BESTIARY, DinosaurBestiaryEntry } from '../utils/characterDefaults';

interface RulesReferenceProps {
  onStartCombat?: (enemyKey: string, count: number) => void;
}

export const RulesReference: React.FC<RulesReferenceProps> = ({ onStartCombat }) => {
  const [activeTab, setActiveTab] = useState<'fundamentos' | 'classes' | 'racas' | 'dinos' | 'magia'>('fundamentos');
  const [dinoSearch, setDinoSearch] = useState('');
  const [dinoFilterDanger, setDinoFilterDanger] = useState<string>('all');
  const [dinoSpawnCount, setDinoSpawnCount] = useState<Record<string, number>>({});

  const filteredDinos = DINOSAUR_BESTIARY.filter((dino) => {
    const matchesSearch = dino.name.toLowerCase().includes(dinoSearch.toLowerCase()) ||
      dino.scientificGroup.toLowerCase().includes(dinoSearch.toLowerCase()) ||
      dino.tactics.toLowerCase().includes(dinoSearch.toLowerCase());
    const matchesDanger = dinoFilterDanger === 'all' || dino.dangerLevel === dinoFilterDanger;
    return matchesSearch && matchesDanger;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-100 uppercase tracking-wide">
              LV8 2.0 &amp; Fantasia Primal Furry — Compêndio de Regras
            </h3>
            <p className="text-xs text-zinc-400">
              “Toda criatura respira Fluxo. Toda alma deixa um Eco. Toda Dobra cobra um preço.”
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('fundamentos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'fundamentos'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Shield className="w-4 h-4" /> 1. Fundamentos &amp; Dados Explosivos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Swords className="w-4 h-4" /> 2. As 8 Classes &amp; Dogmas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('racas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'racas'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Compass className="w-4 h-4" /> 3. As 12 Raças Furry &amp; Ecos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dinos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'dinos'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Flame className="w-4 h-4" /> 4. Dinossauros (Buracos no Fluxo)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('magia')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'magia'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Sparkles className="w-4 h-4" /> 5. Magia, Custos &amp; Aspectos
        </button>
      </div>

      {/* TAB 1: FUNDAMENTOS */}
      {activeTab === 'fundamentos' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-4 h-4" /> Resolução de Testes &amp; Dados Explosivos
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Todos os testes utilizam dados de 6 faces (d6).
                <br />
                <strong>Testes Normais:</strong> Número de dados = <code>Atributo + Perícia + Modificadores</code>.
              </p>
              <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-amber-300">Explosão no 6:</strong> Todo dado que resultar em 6 explode — role novamente e some ao resultado daquele dado. Continue enquanto tirar 6!
                </li>
                <li>
                  <strong className="text-red-400">Pífio no 1:</strong> Cada 1 cancela um 6 rolado (o 6 mais alto). Se sobrar 1 sem 6 para cancelar, ocorre uma <em>Falha Brutal / Paradoxo</em>!
                </li>
                <li>
                  <strong className="text-emerald-400">Margem de Sucesso (MS):</strong> A cada +5 acima da Dificuldade (ou FA - FD), compra-se +1 efeito extra (+1d6 de dano, alvo adjacente, +1 cena de duração).
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-rose-400 uppercase tracking-wide flex items-center gap-2">
                <Swords className="w-4 h-4" /> Conflito Brutal: FA vs FD e Dano
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Todo conflito mede o Fator de Ataque (FA) contra o Fator de Defesa (FD).
              </p>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-2">
                <div>
                  <strong>Fórmula de Dano:</strong>
                  <code className="block mt-1 p-1 bg-zinc-900 text-amber-400 font-mono rounded">
                    Dano = (FA - FD) ÷ 2 (arred. cima) + Bônus da Arma - Redução de Armadura
                  </code>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Armaduras reduzem dano recebido, mas não alteram o Fator de Defesa (FD) da esquiva.
                </p>
              </div>

              <div className="text-xs space-y-1 text-zinc-400">
                <strong className="text-zinc-200 block">Exemplo de Armaduras:</strong>
                <span>Couro (Redução 1) | Couro Reforçado (2) | Malha (3) | Placas (4) | Lendária (6)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <h4 className="text-xs font-black uppercase text-cyan-400">
              Economia de Ações por Turno
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <strong className="text-amber-400 block mb-1">1 Ação Maior</strong>
                <span className="text-zinc-400">Atacar com arma, canalizar poder de fluxo, criar aspecto na cena ou usar perícia complexa.</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <strong className="text-cyan-400 block mb-1">1 Ação Menor</strong>
                <span className="text-zinc-400">Mover-se (AGI × 3 metros), manter concentração em efeito sustentado (-1 Fluxo/rodada) ou sacar item.</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <strong className="text-purple-400 block mb-1">1 Reação / Rodada</strong>
                <span className="text-zinc-400">Esquivar (AGI + Atletismo), bloquear (AGI + Armas) ou interromper com magia reativa.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_CLASSES.map((cls) => (
            <div key={cls.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <strong className="text-sm font-bold text-amber-400">{cls.name}</strong>
                <span className="text-xs text-cyan-400 font-mono">{cls.fluxo}</span>
              </div>
              <p className="text-xs text-zinc-300">{cls.description}</p>
              <div className="text-[11px] p-2 bg-zinc-950 rounded-lg space-y-1">
                <div><span className="text-emerald-400 font-bold">PODE:</span> {cls.dogmaPode}</div>
                <div><span className="text-rose-400 font-bold">NÃO PODE:</span> {cls.dogmaNaoPode}</div>
              </div>
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Poderes Âncora:</span>
                {cls.powers.map((p) => (
                  <div key={p.id} className="text-xs p-2 bg-zinc-950/80 rounded-lg border border-zinc-800/80">
                    <span className="font-bold text-zinc-200">{p.name}</span>
                    <span className="text-[10px] text-amber-400 ml-2">(Escala {p.escala}, Dif {p.dificuldade}, Custo {p.custoFluxo})</span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{p.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RAÇAS FURRY */}
      {activeTab === 'racas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {DEFAULT_RACES.map((rc) => (
            <div key={rc.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                <strong className="text-xs font-bold text-cyan-300">{rc.name}</strong>
                <span className="text-[10px] text-amber-400 font-mono">{rc.eco}</span>
              </div>
              <p className="text-[11px] text-zinc-400">{rc.description}</p>
              <div className="text-[10px] space-y-0.5 bg-zinc-950 p-2 rounded-lg">
                <div className="text-emerald-400">✓ {rc.pode}</div>
                <div className="text-rose-400">✕ {rc.naoPode}</div>
              </div>
              <div className="space-y-1 pt-1">
                {rc.powers.map((p) => (
                  <div key={p.id} className="text-[10px] text-zinc-300 bg-zinc-950/60 p-1.5 rounded border border-zinc-800/60">
                    <strong className="text-zinc-200">{p.name}:</strong> {p.descricao}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: BESTIÁRIO DE DINOSSAUROS */}
      {activeTab === 'dinos' && (
        <div className="space-y-6">
          {/* Aura banner */}
          <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-2xl text-xs text-red-200 leading-relaxed shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <strong className="text-red-400 font-bold uppercase tracking-wider">AURA DE SILÊNCIO PRIMAL (BURACOS NO FLUXO)</strong>
            </div>
            <p className="text-zinc-300">
              Dinossauros não manipulam o Fluxo — eles o devoram e sufocam a trama cósmica por onde passam. Conjuradores dentro da aura sofrem penalidades severas em todos os testes mágicos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-[11px]">
              <div className="p-2 bg-zinc-950/80 rounded-xl border border-red-900/50">
                <span className="font-bold text-amber-400 block">Pequeno (Microraptor/Raptor):</span>
                <span>-1 a -2 dados num raio de 20 a 30m.</span>
              </div>
              <div className="p-2 bg-zinc-950/80 rounded-xl border border-red-900/50">
                <span className="font-bold text-orange-400 block">Grande (Trike/Carnotauro):</span>
                <span>-3 a -4 dados num raio de 100 a 200m.</span>
              </div>
              <div className="p-2 bg-zinc-950/80 rounded-xl border border-red-900/50">
                <span className="font-bold text-rose-500 block">Apex Cósmico (T-Rex Alfa):</span>
                <span>-5 dados / 500m. Desliga poderes sustentados. Escala 1-3 falha auto!</span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nome, família ou tática de dinossauro..."
                value={dinoSearch}
                onChange={(e) => setDinoSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-semibold">Perigo:</span>
              <select
                value={dinoFilterDanger}
                onChange={(e) => setDinoFilterDanger(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
              >
                <option value="all">Todos ({DINOSAUR_BESTIARY.length})</option>
                <option value="Perigoso">Perigoso</option>
                <option value="Ameaça Maior">Ameaça Maior</option>
                <option value="Catástrofe Viva">Catástrofe Viva</option>
                <option value="Devorador Apex">Devorador Apex</option>
              </select>
            </div>
          </div>

          {/* Dinosaurs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDinos.map((entry) => {
              const enemy = PREMADE_ENEMIES[entry.baseEnemyKey];
              if (!enemy) return null;
              const count = dinoSpawnCount[entry.id] || 1;

              return (
                <div
                  key={entry.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-zinc-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-rose-400 tracking-wide">
                            {entry.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-400">
                            {entry.size}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 italic block">{entry.scientificGroup}</span>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider border ${
                          entry.dangerLevel === 'Devorador Apex'
                            ? 'bg-red-950 text-red-400 border-red-800/80 shadow-red-900/20 shadow-md animate-pulse'
                            : entry.dangerLevel === 'Catástrofe Viva'
                              ? 'bg-orange-950 text-orange-400 border-orange-800/80'
                              : entry.dangerLevel === 'Ameaça Maior'
                                ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {entry.dangerLevel}
                      </span>
                    </div>

                    {/* Aura badge */}
                    <div className="p-2.5 bg-red-950/30 border border-red-900/40 rounded-xl text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-red-300 font-bold">
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Aura de Silêncio: {entry.auraSize}
                        </span>
                      </div>
                      <p className="text-zinc-400 leading-tight">{entry.auraDescription}</p>
                    </div>

                    {/* Vitals Summary */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Vida</span>
                        <strong className="text-rose-400 font-mono text-sm">{enemy.hpMax}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Defesa (FD)</span>
                        <strong className="text-zinc-200 font-mono text-sm">{enemy.defense}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Armadura</span>
                        <strong className="text-amber-400 font-mono text-sm">-{enemy.armor}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">IA</span>
                        <strong className="text-cyan-400 text-xs uppercase">{enemy.aiIntelligence}</strong>
                      </div>
                    </div>

                    {/* Attributes Bar */}
                    <div className="flex items-center justify-between text-[11px] bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400 font-mono">
                      <span>FOR <strong>{enemy.attributes['FOR'] || '-'}</strong></span>
                      <span>AGI <strong>{enemy.attributes['AGI'] || '-'}</strong></span>
                      <span>VIG <strong>{enemy.attributes['VIG'] || '-'}</strong></span>
                      <span>INT <strong>{enemy.attributes['INT'] || '-'}</strong></span>
                      <span>VON <strong>{enemy.attributes['VON'] || '-'}</strong></span>
                      <span>INS <strong>{enemy.attributes['INS'] || '-'}</strong></span>
                      <span>PER <strong>{enemy.attributes['PER'] || '-'}</strong></span>
                    </div>

                    {/* Powers & Attacks */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                        Ataques &amp; Habilidades Devoradoras:
                      </span>
                      {enemy.powers.map((p) => (
                        <div key={p.id} className="text-xs p-2 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-zinc-200 font-bold">{p.name}</strong>
                            <span className="text-[10px] text-amber-400 font-mono">Escala {p.escala}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400">{p.descricao}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tactics & Loot */}
                    <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60 text-xs space-y-1.5">
                      <div>
                        <strong className="text-zinc-300 font-semibold text-[11px]">Táticas da IA: </strong>
                        <span className="text-zinc-400 text-[11px]">{entry.tactics}</span>
                      </div>
                      <div className="flex items-start gap-1 pt-1 border-t border-zinc-800/60">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300 font-semibold text-[11px]">Butim de Caça (Loot): </strong>
                          <span className="text-zinc-400 text-[11px]">{entry.loot}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Combat Spawn Launcher Footer */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span>Qtd:</span>
                      <select
                        value={count}
                        onChange={(e) =>
                          setDinoSpawnCount({ ...dinoSpawnCount, [entry.id]: parseInt(e.target.value) || 1 })
                        }
                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono outline-none"
                      >
                        <option value="1">1x</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="4">4x</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartCombat?.(entry.baseEnemyKey, count)}
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Swords className="w-3.5 h-3.5" /> Lançar no Combate Tático
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: MAGIA & ASPECTOS */}
      {activeTab === 'magia' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-purple-400 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Aspectos na Ficha (Estilo Fate Core)
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Um aspecto é uma frase curta que descreve uma verdade intrínseca do personagem ou da cena.
              </p>
              <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                <li><strong>Conceito Principal (obrigatório):</strong> Define quem o personagem é no cerne.</li>
                <li><strong>Problema (obrigatório):</strong> Complicação recorrente, trauma tribal, maldição da Dobra ou fardo.</li>
                <li><strong>Aspectos Adicionais:</strong> Relações, crenças, itens totêmicos e reputações.</li>
                <li>
                  <strong className="text-emerald-400">Invocar um Aspecto:</strong> Concede +1d6 no seu teste (ou -1d6 no oponente). Custa 1 Fluxo (ou grátis se tiver Invocação Gratuita).
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <Flame className="w-4 h-4" /> Custos de Fluxo por Escala
              </h4>
              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-800 text-zinc-300 font-bold border-b border-zinc-700">
                      <th className="p-2.5">Escala</th>
                      <th className="p-2.5">Custo Base</th>
                      <th className="p-2.5">Dificuldade</th>
                      <th className="p-2.5">Escopo Típico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    <tr>
                      <td className="p-2 font-bold text-cyan-400">Escala 1</td>
                      <td className="p-2 font-mono">5 Fluxo</td>
                      <td className="p-2 font-mono">Dif 10</td>
                      <td className="p-2 text-zinc-400">Pessoal, 1 alvo próximo</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-cyan-400">Escala 2</td>
                      <td className="p-2 font-mono">7 Fluxo</td>
                      <td className="p-2 font-mono">Dif 15</td>
                      <td className="p-2 text-zinc-400">Área pequena, 1 alvo forte</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-cyan-400">Escala 3</td>
                      <td className="p-2 font-mono">9 Fluxo</td>
                      <td className="p-2 font-mono">Dif 20</td>
                      <td className="p-2 text-zinc-400">Vários alvos, área média</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-cyan-400">Escala 4</td>
                      <td className="p-2 font-mono">11 Fluxo</td>
                      <td className="p-2 font-mono">Dif 25</td>
                      <td className="p-2 text-zinc-400">Ressurreição / dobra temporal</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-cyan-400">Escala 5</td>
                      <td className="p-2 font-mono">13+ Fluxo</td>
                      <td className="p-2 font-mono">Dif 30</td>
                      <td className="p-2 text-zinc-400">Campo de batalha / realidade</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
