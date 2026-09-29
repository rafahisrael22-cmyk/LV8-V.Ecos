import { CharacterSheet, Power, RulesConfig, Combatant, CustomActionRule } from '../types/lv8';

export const DEFAULT_ECOS_SKILLS = [
  { id: 'combate', name: 'Combate', primaryAttribute: 'FOR', description: 'Luta geral, desarmado, posicionamento, leitura de oponente e improvisação.' },
  { id: 'armas_brancas', name: 'Armas Brancas', primaryAttribute: 'FOR', description: 'Domínio de armas corpo a corpo (espadas, machados, lanças, bastões, adagas).' },
  { id: 'pontaria', name: 'Pontaria', primaryAttribute: 'AGI', description: 'Arcos, bestas, armas de arremesso e armas de fogo.' },
  { id: 'atletismo', name: 'Atletismo', primaryAttribute: 'AGI', description: 'Escalar, correr, nadar, saltar, esquivar.' },
  { id: 'furtividade', name: 'Furtividade', primaryAttribute: 'AGI', description: 'Mover-se sem ser percebido, esconder-se nas sombras.' },
  { id: 'sobrevivencia', name: 'Sobrevivência', primaryAttribute: 'PER', description: 'Rastreamento, caça, orientação, resistência ao ambiente hostil.' },
  { id: 'medicina', name: 'Medicina', primaryAttribute: 'INT', description: 'Primeiros socorros, tratamento de ferimentos e doenças.' },
  { id: 'conhecimento', name: 'Conhecimento', primaryAttribute: 'INT', description: 'História, cultura, criaturas titânicas, teoria e saberes arcanos.' },
  { id: 'oficio', name: 'Ofício', primaryAttribute: 'INT', description: 'Criação e reparo de objetos, artesanato e armaduras.' },
  { id: 'manipulacao', name: 'Manipulação', primaryAttribute: 'PRE', description: 'Persuasão, intimidação, enganação, liderança social.' },
  { id: 'vontade', name: 'Vontade', primaryAttribute: 'VON', description: 'Resistência mental e emocional, manter o foco e determinação.' },
  { id: 'canalizacao', name: 'Canalização', primaryAttribute: 'ESS', description: 'Manipulação direta do Fluxo (perícia mágica principal).' },
  { id: 'pressagio', name: 'Presságio', primaryAttribute: 'PER', description: 'Leitura do Véu, sinais sobrenaturais, detectar Dobras, Ecos e magia residual.' },
  { id: 'ladinagem', name: 'Ladinagem', primaryAttribute: 'AGI', description: 'Arrombar, desarmar armadilhas, furtar, abrir fechaduras.' },
  { id: 'vigilancia', name: 'Vigilância', primaryAttribute: 'PER', description: 'Perceber ameaças, detalhes ocultos e armadilhas.' },
  { id: 'arte', name: 'Arte', primaryAttribute: 'PRE', description: 'Música, pintura, escultura, performance, caligrafia.' },
  { id: 'empatia_animal', name: 'Empatia Animal', primaryAttribute: 'ESS', description: 'Lidar com animais, acalmar bestas e entender comportamento da fauna.' },
  { id: 'pilotagem', name: 'Pilotagem', primaryAttribute: 'AGI', description: 'Montar animais de sela, conduzir carroças, barcos e veículos.' },
];

/**
 * Normalizes and resolves a skill query against character's skills,
 * handling case, accents, and common RPG synonyms (e.g., 'rastreio' -> 'sobrevivencia', 'laminas' -> 'armas_brancas').
 */
export function resolveSkillValue(
  skillQuery: string | undefined,
  character: CharacterSheet
): { skillId: string; level: number } {
  if (!skillQuery) return { skillId: 'combate', level: 0 };

  const raw = skillQuery.trim().toLowerCase();
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  const charSkills = character.skills || {};

  // Direct ID check
  if (charSkills[normalized] !== undefined) {
    return { skillId: normalized, level: charSkills[normalized] };
  }

  // Common synonym mappings for AI generated text and presets
  const synonymMap: Record<string, string> = {
    laminas: 'armas_brancas',
    espadas: 'armas_brancas',
    machados: 'armas_brancas',
    adagas: 'armas_brancas',
    armas: 'armas_brancas',
    arcos: 'pontaria',
    arco: 'pontaria',
    bestas: 'pontaria',
    tiro: 'pontaria',
    briga: 'combate',
    luta: 'combate',
    desarmado: 'combate',
    caca: 'sobrevivencia',
    rastreio: 'sobrevivencia',
    rastreamento: 'sobrevivencia',
    medicina_primal: 'medicina',
    primeiros_socorros: 'medicina',
    cura: 'medicina',
    conhecimento_dinos: 'conhecimento',
    historia: 'conhecimento',
    arcano: 'conhecimento',
    percepcao_fluxo: 'pressagio',
    percepcao_do_fluxo: 'pressagio',
    percepcao: 'vigilancia',
    sentidos: 'vigilancia',
    ritual: 'canalizacao',
    magia: 'canalizacao',
    persuasao: 'manipulacao',
    intimidacao: 'manipulacao',
    enganacao: 'manipulacao',
    social: 'manipulacao',
    esquiva: 'atletismo',
    salto: 'atletismo',
    escalada: 'atletismo',
    furto: 'ladinagem',
    fechaduras: 'ladinagem',
    armadilhas: 'ladinagem',
  };

  const targetId = synonymMap[normalized];
  if (targetId && charSkills[targetId] !== undefined) {
    return { skillId: targetId, level: charSkills[targetId] };
  }

  // Partial match search in character.skills
  for (const [key, val] of Object.entries(charSkills)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return { skillId: key, level: val };
    }
  }

  return { skillId: normalized, level: 0 };
}

export const DEFAULT_CUSTOM_ACTION_RULES: CustomActionRule[] = [
  {
    id: 'rule_armas_brancas',
    name: 'Golpe com Arma Branca',
    type: 'attack',
    primaryAttribute: 'FOR',
    attributeFormat: 'd6',
    skillId: 'armas_brancas',
    skillFormat: 'decimal_x2',
    extraDice: 0,
    extraFlatBonus: 0,
    bonusDamage: 2,
    fluxCost: 0,
    description: 'Ataque corpo-a-corpo padrão: FA = FOR em d6 + (Armas Brancas × 2) de bônus fixo + 2 de dano vs FD.',
  },
  {
    id: 'rule_disparo_preciso',
    name: 'Disparo de Precisão',
    type: 'attack',
    primaryAttribute: 'AGI',
    attributeFormat: 'd6',
    skillId: 'pontaria',
    skillFormat: 'decimal_x2',
    extraDice: 0,
    extraFlatBonus: 0,
    bonusDamage: 2,
    fluxCost: 0,
    description: 'Disparo com arco ou besta: FA = AGI em d6 + (Pontaria × 2) de bônus fixo (Ex: AGI 3 + Pontaria 2 = FA 3d6 + 4).',
  },
  {
    id: 'rule_ataque_escudo',
    name: 'Ataque com Escudo (Concussão)',
    type: 'attack',
    primaryAttribute: 'FOR',
    attributeFormat: 'd6',
    skillId: 'combate',
    skillFormat: 'decimal_x2',
    extraDice: 0,
    extraFlatBonus: 0,
    bonusDamage: 1,
    fluxCost: 0,
    description: 'Investida com escudo: FA = FOR em d6 + (Combate × 2) + 1 dano. Causa atordoamento em acerto crítico.',
  },
  {
    id: 'rule_canalizar_fluxo',
    name: 'Pulso de Fluxo Elemental',
    type: 'power',
    primaryAttribute: 'ESS',
    attributeFormat: 'd6',
    skillId: 'canalizacao',
    skillFormat: 'decimal_x2',
    extraDice: 0,
    extraFlatBonus: 0,
    bonusDamage: 4,
    fluxCost: 3,
    description: 'Dispara uma rajada concentrada de Fluxo: ESS em d6 + (Canalização × 2) de bônus fixo.',
  },
];

export const DEFAULT_PRIMAL_RULES: RulesConfig = {
  systemVariant: 'ecos_da_dobra',
  attributePointsBudget: 8, // 8 pontos livres para gastar (cada atributo começa com 1 grátis)
  attributeMinInitial: 1, // Não pode ser zerado
  attributeMaxInitial: 3, // Máximo 3 na criação
  attributeMaxLegendary: 10,
  skillPointsBudget: 14, // 10 + (INT * 2)
  skillMaxInitial: 2, // Máximo 2 na criação
  skillMaxLegendary: 10,
  attributes: [
    { key: 'FOR', name: 'Força', description: 'Capacidade física bruta, golpes com arma pesada, carga e empurrões. Define Fadiga (10 + FOR×5).', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 2 },
    { key: 'AGI', name: 'Agilidade', description: 'Velocidade, reflexos, coordenação, esquiva e armas leves/distância. Define Deslocamento (AGI×3m).', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 3 },
    { key: 'VIG', name: 'Vigor', description: 'Resistência física, fôlego e determinação de Pontos de Vida (HP = 10 + VIG×5).', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 2 },
    { key: 'INT', name: 'Inteligência', description: 'Raciocínio lógico, memória, análise tática. Define pontos de perícia iniciais: 10 + (INT×2).', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 2 },
    { key: 'VON', name: 'Vontade', description: 'Resistência mental, controle emocional. Define Sanidade (HP Mental = 10 + VON×5).', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 2 },
    { key: 'PRE', name: 'Presença', description: 'Carisma, liderança primal, intimidação. Define Pontos de Aura (HP Social = 10 + PRE×5).', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 1 },
    { key: 'ESS', name: 'Essência', description: 'Sintonia primal com o Fluxo. Define a reserva mágica (Fluxo = 10 + ESS×5).', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 2 },
    { key: 'PER', name: 'Percepção', description: 'Sentidos aguçados, farejar, vigilância, iniciativa e mira nos testes.', initialMin: 1, initialMax: 3, legendaryMax: 10, defaultValue: 2 },
  ],
  skills: DEFAULT_ECOS_SKILLS,
  derivedFormulas: [
    { key: 'hp', name: 'Pontos de Vida (HP)', formula: '10 + (VIG * 5)', attributeDependency: ['VIG'], description: 'Saúde física do personagem: 10 + (VIG × 5).' },
    { key: 'fluxo', name: 'Pontos de Fluxo', formula: '10 + (ESS * 5)', attributeDependency: ['ESS'], description: 'Reserva mágica de energia primordial: 10 + (ESS × 5).' },
    { key: 'deslocamento', name: 'Deslocamento', formula: 'AGI * 3', attributeDependency: ['AGI'], description: 'Metros percorridos por Ação Menor em combate: AGI × 3 metros.' },
    { key: 'sanidade', name: 'Pontos de Sanidade', formula: '10 + (VON * 5)', attributeDependency: ['VON'], description: 'HP mental do personagem contra o horror cósmico: 10 + (VON × 5).' },
    { key: 'fadiga', name: 'Pontos de Fadiga', formula: '10 + (FOR * 5)', attributeDependency: ['FOR'], description: 'Estamina do personagem para esforço extremo: 10 + (FOR × 5).' },
    { key: 'aura', name: 'Pontos de Aura', formula: '10 + (PRE * 5)', attributeDependency: ['PRE'], description: 'HP social do personagem (reputação e firmeza perante o clã): 10 + (PRE × 5).' },
  ],
  customActionRules: DEFAULT_CUSTOM_ACTION_RULES,
};


export const DEFAULT_CLASSES = [
  {
    name: 'Guerreiro',
    fluxo: 'Fluxo do Poder',
    description: 'Domínio da força bruta e solidez da terra. Pode mover rochas, derrubar muralhas e fortalecer a carne.',
    dogmaPode: 'Mover pedras, quebrar muralhas, arremessar rochas, fortalecer o corpo.',
    dogmaNaoPode: 'Criar matéria do nada, curar ferimentos, afetar mentes ou espíritos.',
    powers: [
      { id: 'g1', name: 'Punho de Cerco', source: 'classe' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Soco ou golpe com arma causa 4d6 de dano contundente. Derruba portas reforçadas, quebra pedra de 1m.', efeitoMS: '+1d6 dano ou atinge +1 alvo adjacente.' },
      { id: 'g2', name: 'Salto de Titã', source: 'classe' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Salta até 20m na horizontal ou 8m na vertical sem teste de Atletismo. Aterrissagem segura.', efeitoMS: '+10m de distância.' },
      { id: 'g3', name: 'Pele de Montanha', source: 'classe' as const, escala: 2, duracao: 'Cena' as const, dificuldade: 15, custoFluxo: 10, descricao: 'A pele endurece como granito. Ignora 8 pontos de dano físico por ataque durante a cena.', efeitoMS: 'Ignora 12 de dano por ataque.' },
    ],
  },
  {
    name: 'Ladino',
    fluxo: 'Fluxo da Sombra',
    description: 'Mestres da dissimulação, fendas espaciais e lâminas venenosas. Atravessam a penumbra sem emitir som.',
    dogmaPode: 'Sumir em sombras, silenciar passos, atravessar frestas, ficar invisível parado.',
    dogmaNaoPode: 'Ficar intangível em combate aberto, teleportar para longe, atravessar muralhas sólidas.',
    powers: [
      { id: 'l1', name: 'Manto Cinzento', source: 'classe' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Envolve-se em sombras. +3 dados em Furtividade por 1 cena. Imóvel requer PER Dif 18 para notar.', efeitoMS: '+4 dados em Furtividade.' },
      { id: 'l2', name: 'Passo do Vulto', source: 'classe' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Teleporta até 10m entre duas sombras visíveis. Não provoca ataque de oportunidade.', efeitoMS: 'Alcance aumenta para 20m.' },
      { id: 'l3', name: 'Lâmina do Silêncio', source: 'classe' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Próximo ataque com lâmina causa 3d6 e ignora armadura se o alvo estiver surpreso ou distraído.', efeitoMS: '+1d6 de dano.' },
    ],
  },
  {
    name: 'Bárbaro',
    fluxo: 'Fluxo da Fúria',
    description: 'Encarnação do frenesi primitivo. Converte dor em poder avassalador e ruge com impacto sônico.',
    dogmaPode: 'Ignorar dor, ganhar força brutal, entrar em frenesi incontrolável.',
    dogmaNaoPode: 'Usar poderes com calma, manter poder ativo fora de combate ou sem emoção intensa.',
    powers: [
      { id: 'b1', name: 'Ignorar a Morte', source: 'classe' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Continua lutando com 0 de Vida por 1 cena inteira. Ao término, sofre todo o dano acumulado.', efeitoMS: '+1 cena adicional de sobrevivência.' },
      { id: 'b2', name: 'Grito Despedaçador', source: 'classe' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Grito em cone de 10m causa 2d6 sônico. Alvos testam VIG Dif 15 ou ficam atordoados por 1 rodada.', efeitoMS: '+1d6 dano ou Dif 20.' },
      { id: 'b3', name: 'Sangue Quente', source: 'classe' as const, escala: 2, duracao: 'Sustentado' as const, dificuldade: 15, custoFluxo: 9, descricao: 'Regenera 1d6 de Vida por rodada enquanto sustentar (+1 Fluxo/rodada). Deixa cicatrizes marcantes.', efeitoMS: 'Regenera 2d6 Vida por rodada.' },
    ],
  },
  {
    name: 'Ranger',
    fluxo: 'Fluxo da Caça',
    description: 'Caçadores implacáveis capazes de sintonizar a presa, disparar flechas guiadas pelo Fluxo e liderar matilhas.',
    dogmaPode: 'Rastrear qualquer criatura, marcar presas, disparar tiros precisos, coordenar aliados.',
    dogmaNaoPode: 'Marcar mais de uma presa por vez, usar poderes em ambientes urbanos sem rastros.',
    powers: [
      { id: 'r1', name: 'Marca do Predador', source: 'classe' as const, escala: 1, duracao: 'Sustentado' as const, dificuldade: 10, custoFluxo: 7, descricao: 'Marca 1 alvo visível. Concede +2 dados para atacar e rastrear a presa enquanto sustentado (+1 Fluxo/rodada).', efeitoMS: '+3 dados contra a presa marcada.' },
      { id: 'r2', name: 'Flecha Guiada', source: 'classe' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Flecha curva no ar ignorando cobertura e penumbra total, causando 3d6 de dano perfurante.', efeitoMS: '+1d6 de dano.' },
      { id: 'r3', name: 'Coração da Alcateia', source: 'classe' as const, escala: 2, duracao: 'Cena' as const, dificuldade: 15, custoFluxo: 10, descricao: 'Até 5 aliados ganham +1 dado de ataque e defesa quando lutam juntos contra a presa marcada.', efeitoMS: '+2 dados de bônus para a matilha.' },
    ],
  },
  {
    name: 'Mago',
    fluxo: 'Fluxo da Mente',
    description: 'Manipuladores das ondas mentais e paradoxos cognitivos. Projetam ilusões e sobrecarregam sinapses.',
    dogmaPode: 'Ler emoções superficiais, criar ilusões sensoriais, causar dor mental, paralisar por contradição.',
    dogmaNaoPode: 'Ler pensamentos profundos sem Escala 4+, controlar mentes totalmente contra a vontade.',
    powers: [
      { id: 'm1', name: 'Sussurro Invasivo', source: 'classe' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Lê a emoção dominante do alvo a 20m. Alvos com VON 4+ sentem a intrusão psíquica.', efeitoMS: 'Lê a intenção imediata do alvo.' },
      { id: 'm2', name: 'Teatro da Dor', source: 'classe' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Causa 2d6 de dano psíquico ignorando armadura física. Alvo sofre -2 dados na próxima ação.', efeitoMS: '+1d6 de dano ou -3 dados na ação.' },
      { id: 'm3', name: 'Paradoxo Menor', source: 'classe' as const, escala: 3, duracao: 'Instantâneo' as const, dificuldade: 20, custoFluxo: 9, descricao: 'Implanta uma contradição lógica. Alvo testa INT Dif 20 ou fica atordoado por 1d6 rodadas.', efeitoMS: '+2 rodadas atordoado.' },
    ],
  },
  {
    name: 'Monge',
    fluxo: 'Fluxo do Vazio',
    description: 'Guerreiros do silêncio que anulam correntes de Fluxo e transformam o corpo em névoa intangível.',
    dogmaPode: 'Anular fluxo alheio, ver linhas etéreas, esvaziar a mente para defesas perfeitas.',
    dogmaNaoPode: 'Criar efeitos elementais destrutivos, curar terceiros, disparar projéteis de energia.',
    powers: [
      { id: 'mo1', name: 'Palma do Silêncio', source: 'classe' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Toque marcial anula 1 poder de Escala 2 ou menor ativo ou sendo conjurado a 5m.', efeitoMS: 'Anula poderes de até Escala 3.' },
      { id: 'mo2', name: 'Olho Vazio', source: 'classe' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Vê fluxos ativos e intenções hostis. +2 dados em PER contra emboscadas e ilusões.', efeitoMS: 'Vê através de qualquer ilusão Escala 2.' },
      { id: 'mo3', name: 'Corpo de Névoa', source: 'classe' as const, escala: 3, duracao: 'Cena' as const, dificuldade: 20, custoFluxo: 12, descricao: '+4 dados de defesa e pode atravessar frestas estreitas. Golpes com força total sofrem -2 dados.', efeitoMS: '+5 dados de defesa.' },
    ],
  },
  {
    name: 'Clérigo',
    fluxo: 'Fluxo da Alma',
    description: 'Guardiões do espírito vital e curandeiros primais. Afastam a podridão da Dobra e fecham chagas mortais.',
    dogmaPode: 'Curar ferimentos sangrentos, purificar venenos e doenças, afastar corrupção e proteger espíritos.',
    dogmaNaoPode: 'Ressuscitar sem custo permanente severo, curar a si mesmo indefinidamente em combate.',
    powers: [
      { id: 'cl1', name: 'Toque Restaurador', source: 'classe' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Cura 2d6 de Vida ao toque imediato, fechando cortes e estancando hemorragias.', efeitoMS: '+1d6 de cura adicional.' },
      { id: 'cl2', name: 'Véu Protetor', source: 'classe' as const, escala: 2, duracao: 'Cena' as const, dificuldade: 15, custoFluxo: 10, descricao: 'Até 4 aliados num raio de 10m ignoram 4 de dano por ataque durante toda a cena.', efeitoMS: 'Ignoram 6 de dano por ataque.' },
      { id: 'cl3', name: 'Tocar o Véu', source: 'classe' as const, escala: 4, duracao: 'Instantâneo' as const, dificuldade: 25, custoFluxo: 11, descricao: 'Traz de volta à vida criatura morta há menos de 1h. Custo permanente: -1 VIG permanente do clérigo.', efeitoMS: 'Alvo morto há até 2h.' },
    ],
  },
  {
    name: 'Druida',
    fluxo: 'Fluxo da Terra',
    description: 'Comunhão primal com flora, raízes e bestas. Ergue muralhas de espinhos e endurece a pele como casca de carvalho.',
    dogmaPode: 'Moldar pedra e planta, acalmar animais naturais, acelerar brotações, pressentir tremores.',
    dogmaNaoPode: 'Criar vida inteligente do nada, controlar dinossauros alfas predadores, transformar-se em réptil gigante.',
    powers: [
      { id: 'dr1', name: 'Broto Rápido', source: 'classe' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Brota instantaneamente uma barreira de espinhos 3x3m que causa 1d6 de dano a quem atravessar.', efeitoMS: 'Área expande para 6x6m.' },
      { id: 'dr2', name: 'Pele de Casca', source: 'classe' as const, escala: 2, duracao: 'Cena' as const, dificuldade: 15, custoFluxo: 10, descricao: '+6 de defesa natural como tronco enrijecido. Reduz 1 dado de AGI pela rigidez.', efeitoMS: '+8 de defesa natural.' },
      { id: 'dr3', name: 'Voz da Matilha', source: 'classe' as const, escala: 2, duracao: 'Sustentado' as const, dificuldade: 15, custoFluxo: 9, descricao: 'Comunica e acalma animais selvagens comuns. Pode solicitar um favor simples.', efeitoMS: 'Afeta até 3 animais ao mesmo tempo.' },
    ],
  },
];

export const DEFAULT_RACES = [
  {
    name: 'Povo Felino',
    eco: 'Eco da Sombra',
    description: 'Ágeis predadores felinos, garras afiadas, reflexos supersônicos e passadas silenciosas.',
    pode: 'Emboscar, cair sem dano, sumir em sombras.',
    naoPode: 'Perseguições longas em campo aberto (+2 custo após 3 rodadas).',
    powers: [
      { id: 'rf1', name: 'Queda Suave', source: 'raca' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Anula completamente dano de quedas de até 30m, pousando em silêncio absoluto.' },
      { id: 'rf2', name: 'Olhos da Emboscada', source: 'raca' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Enxerga na escuridão total e ganha +2 dados em Percepção para preparar emboscadas.' },
      { id: 'rf3', name: 'Salto do Bote', source: 'raca' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Teleporta 15m direto para uma sombra visível e ganha +1d6 no ataque imediato.' },
    ],
  },
  {
    name: 'Povo Símio',
    eco: 'Eco da Fúria',
    description: 'Primatas de musculatura maciça, especialistas em arremesso de pedras colossais e escalada.',
    pode: 'Ignorar dor, arremessar massas pesadas, escalar com facilidade.',
    naoPode: 'Ações sutis ou silenciosas.',
    powers: [
      { id: 'rs1', name: 'Punho de Pedra', source: 'raca' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Arremesso ou soco desferido com +2d6 dano; parte madeira e pedra frágil.' },
      { id: 'rs2', name: 'Costas de Carregador', source: 'raca' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Carrega 3x o peso normal e ignora penalidades de terreno difícil ao escalar.' },
      { id: 'rs3', name: 'Grito de Desafio', source: 'raca' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Inimigo a até 20m testa VON Dif 15 ou é forçado a focar seus ataques em você por 1d6 rodadas.' },
    ],
  },
  {
    name: 'Povo Canino',
    eco: 'Eco da Caça',
    description: 'Lobos e cães caçadores tribais, unidos pelo faro aguçado e coordenação impiedosa de matilha.',
    pode: 'Farejar a quilômetros, caçar em conjunto com aliados.',
    naoPode: 'Caçar isolado sem companheiros (+2 custo sem aliados a 30m).',
    powers: [
      { id: 'rc1', name: 'Faro de Matilha', source: 'raca' as const, escala: 1, duracao: 'Sustentado' as const, dificuldade: 10, custoFluxo: 7, descricao: 'Marca presa com feromônio do Fluxo; matilha detecta direção exata a 5km.' },
      { id: 'rc2', name: 'Uivo de Coordenação', source: 'raca' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Aliados que escutam o uivo recebem +1 dado de ataque contra a presa marcada.' },
      { id: 'rc3', name: 'Mordida de Derrubada', source: 'raca' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Causa 2d6 dano e derruba criaturas de até o dobro do tamanho (VIG Dif 15 resiste).' },
    ],
  },
  {
    name: 'Povo Hiena',
    eco: 'Eco da Fúria',
    description: 'Predadores oportunistas com mandíbula esmagadora e risada histérica que desestabiliza inimigos.',
    pode: 'Rir desmoralizando o oponente, trancar mandíbula em membros vitais.',
    naoPode: 'Soltar presa sem vergonha perante o grupo (-2 dados por 1 cena se fugir).',
    powers: [
      { id: 'rh1', name: 'Mandíbula Travada', source: 'raca' as const, escala: 1, duracao: 'Sustentado' as const, dificuldade: 10, custoFluxo: 7, descricao: 'Mordida agarra o membro; causa 1d6 de dano automático toda rodada.' },
      { id: 'rh2', name: 'Riso Quebrador', source: 'raca' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Inimigos a 10m testam VON Dif 10 ou sofrem -1 dado em todos os ataques por 2 rodadas.' },
      { id: 'rh3', name: 'Comer até o Osso', source: 'raca' as const, escala: 2, duracao: 'Instantâneo' as const, dificuldade: 15, custoFluxo: 7, descricao: 'Devora carcaça fresca de criatura para regenerar 2d6 de Fluxo fora de combate.' },
    ],
  },
  {
    name: 'Povo Ave',
    eco: 'Eco da Caça',
    description: 'Humanoides alados ou emplumados, possuidores de visão telescópica e ataques de mergulho mortal.',
    pode: 'Enxergar de altitudes extremas, planar nas correntes de vento.',
    naoPode: 'Combater com eficiência em cavernas subterrâneas sem vista do céu.',
    powers: [
      { id: 'ra1', name: 'Olho do Céu', source: 'raca' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Identifica detalhes minúsculos a 2km de distância, ignorando camuflagens naturais.' },
      { id: 'ra2', name: 'Mergulho Mortal', source: 'raca' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Despenca 10m+ sobre o alvo desferindo golpe com +2d6 dano ignorando armadura leve.' },
      { id: 'ra3', name: 'Corrente de Vento', source: 'raca' as const, escala: 2, duracao: 'Sustentado' as const, dificuldade: 15, custoFluxo: 9, descricao: 'Plana por 100m em voo silencioso e rasante sem tocar o solo.' },
    ],
  },
  {
    name: 'Povo Raposa',
    eco: 'Eco da Mente',
    description: 'Artífices da ilusão e astúcia, com múltiplas caudas e pelagem camaleônica.',
    pode: 'Criar sons falsos, alterar cor da pelagem, duplicatas ilusórias.',
    naoPode: 'Confrontos físicos diretos de peito aberto (+2 custo de poder se atacar pela frente).',
    powers: [
      { id: 'rr1', name: 'Cauda Falsa', source: 'raca' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Projeta um som ou eco ilusório a até 20m de distância por 1 rodada.' },
      { id: 'rr2', name: 'Disfarce de Pêlo', source: 'raca' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Muda cor e textura da pelagem para mesclar-se, ganhando +3 dados em disfarce.' },
      { id: 'rr3', name: 'Duplo de Cauda', source: 'raca' as const, escala: 2, duracao: 'Sustentado' as const, dificuldade: 15, custoFluxo: 9, descricao: 'Cria duplicata ilusória idêntica; inimigos atacam a cópia a menos que passem em PER Dif 15.' },
    ],
  },
  {
    name: 'Povo Texugo',
    eco: 'Eco do Poder',
    description: 'Guerreiros atarracados e ferozes que cavam túneis de fuga e lutam com fúria tenaz até a morte.',
    pode: 'Cavar galerias sólidas, suportar dores excruciantes quando ferido.',
    naoPode: 'Recuar covardemente de um duelo (perde poderes de fluxo por 1 dia se fugir).',
    powers: [
      { id: 'rt1', name: 'Unhas de Túnel', source: 'raca' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Cava 3m de túnel seguro através de terra compacta ou rocha frágil.' },
      { id: 'rt2', name: 'Fúria Encurralada', source: 'raca' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Quando abaixo da metade da Vida máxima, ganha +2 dados de dano e ignora dor.' },
      { id: 'rt3', name: 'Pele de Ferro', source: 'raca' as const, escala: 2, duracao: 'Cena' as const, dificuldade: 15, custoFluxo: 10, descricao: 'Couro espesso endurece; ignora 8 de dano físico por golpe.' },
    ],
  },
  {
    name: 'Povo Réptil',
    eco: 'Eco da Terra',
    description: 'Humanoides escamosos de sangue frio, mestres da imobilidade de camuflagem e regeneração corporal.',
    pode: 'Regenerar membros decepados, anular toxinas primitivas.',
    naoPode: 'Operar com vigor em temperaturas gélidas (custo de Fluxo dobra no frio extremo).',
    powers: [
      { id: 'rp1', name: 'Imobilidade de Pedra', source: 'raca' as const, escala: 1, duracao: 'Cena' as const, dificuldade: 10, custoFluxo: 8, descricao: 'Fica imóvel parecendo rocha inerte; requer PER Dif 18 para ser percebido.' },
      { id: 'rp2', name: 'Sangue Frio', source: 'raca' as const, escala: 1, duracao: 'Instantâneo' as const, dificuldade: 10, custoFluxo: 5, descricao: 'Anula 1 veneno ou infecção biológica em seu organismo imediatamente.' },
      { id: 'rp3', name: 'Muda Regenerativa', source: 'raca' as const, escala: 2, duracao: 'Sustentado' as const, dificuldade: 15, custoFluxo: 9, descricao: 'Regenera 3d6 de Vida e refaz dedos ou cauda perdidos (-3 defesa durante o processo).' },
    ],
  },
];

export const PREMADE_ENEMIES: Record<string, Combatant> = {
  raptor: {
    id: 'enemy_raptor_1',
    name: 'Raptor da Matilha',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Besta Primal',
    race: 'Terópode Menor',
    hpMax: 20,
    hpCurrent: 20,
    fluxoMax: 15,
    fluxoCurrent: 15,
    defense: 14,
    armor: 1,
    attributes: { FOR: 3, AGI: 4, VIG: 3, INT: 1, VON: 2, PRE: 2, ESS: 1, PER: 3 },
    skills: { combate: 3, atletismo: 3, furtividade: 2, vigilancia: 2, caca: 3 },
    powers: [
      { id: 'rap_mordida', name: 'Mordida em Matilha', source: 'raca', escala: 1, duracao: 'Instantâneo', dificuldade: 10, custoFluxo: 0, descricao: 'Ataque em bando: causa 2d6+2 de dano perfurante (+1 dado para cada raptor extra cercando o alvo).' },
      { id: 'rap_salto', name: 'Salto Emboscada', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 4, descricao: 'Salta 10m e atinge o alvo com garras curvadas causando corte profundo.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Pequena (-2 dados num raio de 30m)',
  },
  microraptor: {
    id: 'enemy_microraptor_1',
    name: 'Microraptor Emboscador Venenoso',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Besta Planadora',
    race: 'Dromaeossaurídeo Árbreo',
    hpMax: 14,
    hpCurrent: 14,
    fluxoMax: 10,
    fluxoCurrent: 10,
    defense: 15,
    armor: 0,
    attributes: { FOR: 2, AGI: 4, VIG: 2, INT: 2, VON: 2, PRE: 1, ESS: 1, PER: 4 },
    skills: { furtividade: 3, atletismo: 3, caca: 2, vigilancia: 2, combate: 2 },
    powers: [
      { id: 'micro_veneno', name: 'Peçonha Primal da Dobra', source: 'raca', escala: 1, duracao: 'Instantâneo', dificuldade: 10, custoFluxo: 0, descricao: 'Garras inoculam veneno paralisante: 1d6 de dano e drena 2 de Fluxo por rodada.' },
      { id: 'micro_rasante', name: 'Bote Aéreo das Copas', source: 'classe', escala: 1, duracao: 'Instantâneo', dificuldade: 10, custoFluxo: 0, descricao: 'Salta 15m caindo silencioso sobre os ombros da presa; +2 dados se atacar de surpresa.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Diminuta (-1 dado num raio de 20m)',
  },
  pterodactilo: {
    id: 'enemy_ptero_1',
    name: 'Pterodáctilo Carniceiro dos Céus',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Terror Alado',
    race: 'Pterossauro Predador',
    hpMax: 22,
    hpCurrent: 22,
    fluxoMax: 15,
    fluxoCurrent: 15,
    defense: 15,
    armor: 1,
    attributes: { FOR: 3, AGI: 4, VIG: 3, INT: 2, VON: 2, PRE: 2, ESS: 1, PER: 4 },
    skills: { atletismo: 3, caca: 3, furtividade: 2, vigilancia: 3, combate: 2 },
    powers: [
      { id: 'pte_mergulho', name: 'Mergulho Supersônico', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 0, descricao: 'Despenca em alta velocidade causando 3d6 de dano e ignorando armadura leve.' },
      { id: 'pte_arrebatar', name: 'Garras de Arrebate', source: 'raca', escala: 1, duracao: 'Instantâneo', dificuldade: 10, custoFluxo: 0, descricao: 'Agarra a presa e a eleva 6m no ar antes de soltar (teste de FOR ou Atletismo Dif 15 para soltar).' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Pequena (-2 dados num raio de 30m)',
  },
  paquicefalo: {
    id: 'enemy_paqui_1',
    name: 'Paquicefalossauro Aríete',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Impactador Primal',
    race: 'Paquicefalossaurídeo',
    hpMax: 35,
    hpCurrent: 35,
    fluxoMax: 15,
    fluxoCurrent: 15,
    defense: 14,
    armor: 3,
    attributes: { FOR: 5, AGI: 3, VIG: 4, INT: 1, VON: 3, PRE: 2, ESS: 1, PER: 3 },
    skills: { combate: 3, atletismo: 2, intimidacao: 2, vigilancia: 1 },
    powers: [
      { id: 'paq_cabecada', name: 'Cabeçada Esmaga-Crânio', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 0, descricao: 'Investe e atinge com cúpula óssea: 3d6+3 de dano e alvo deve passar em VIG Dif 15 ou fica Atordoado 1 rodada.' },
      { id: 'paq_fratura', name: 'Arremesso Sísmico', source: 'raca', escala: 1, duracao: 'Instantâneo', dificuldade: 10, custoFluxo: 0, descricao: 'Impacto lança a presa 5m para trás derrubando-a ao solo.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Pequena (-2 dados num raio de 30m)',
  },
  carnotauro: {
    id: 'enemy_carno_1',
    name: 'Carnotauro Sombrio do Véu',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Caçador Furtivo Titânico',
    race: 'Abelissaurídeo da Dobra',
    hpMax: 45,
    hpCurrent: 45,
    fluxoMax: 20,
    fluxoCurrent: 20,
    defense: 15,
    armor: 3,
    attributes: { FOR: 5, AGI: 3, VIG: 5, INT: 2, VON: 3, PRE: 3, ESS: 1, PER: 3 },
    skills: { combate: 4, atletismo: 3, caca: 3, furtividade: 2, vigilancia: 2 },
    powers: [
      { id: 'car_bote', name: 'Bote Chifrado Sangrento', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 0, descricao: 'Arranca a carne com chifres frontais: 3d6+3 de dano e aplica condição Sangrando (1 HP por rodada).' },
      { id: 'car_sombra', name: 'Manto de Neblina Primal', source: 'aspecto', escala: 2, duracao: 'Cena', dificuldade: 15, custoFluxo: 5, descricao: 'Camufla sua silhueta titânica entre sombras; ganha +2 dados em esquiva.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Média (-3 dados num raio de 100m)',
  },
  estegossauro: {
    id: 'enemy_stego_1',
    name: 'Estegossauro das Fendas Cósmicas',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Muralha de Espigões',
    race: 'Tireóforo Antigo',
    hpMax: 50,
    hpCurrent: 50,
    fluxoMax: 20,
    fluxoCurrent: 20,
    defense: 14,
    armor: 4,
    attributes: { FOR: 5, AGI: 2, VIG: 5, INT: 1, VON: 4, PRE: 3, ESS: 1, PER: 2 },
    skills: { combate: 3, sobrevivencia: 3, atletismo: 1, vigilancia: 1 },
    powers: [
      { id: 'stg_tagbomizador', name: 'Espigões Tágbomizador', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 0, descricao: 'Chicoteia cauda com 4 espigões ósseos: causa 4d6 de dano perfurante e sangramento profundo.' },
      { id: 'stg_placas', name: 'Placas de Absorção de Fluxo', source: 'raca', escala: 2, duracao: 'Cena', dificuldade: 15, custoFluxo: 0, descricao: 'Placas dorsais aquecem sob magia, reduzindo dano mágico direto em 4 pontos.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Média (-3 dados num raio de 100m)',
  },
  triceratops: {
    id: 'enemy_trike_1',
    name: 'Triceratops Ancião',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Titã Primal',
    race: 'Ceratopsídeo',
    hpMax: 55,
    hpCurrent: 55,
    fluxoMax: 20,
    fluxoCurrent: 20,
    defense: 15,
    armor: 5,
    attributes: { FOR: 6, AGI: 2, VIG: 6, INT: 1, VON: 4, PRE: 3, ESS: 1, PER: 2 },
    skills: { combate: 4, atletismo: 2, sobrevivencia: 3, vigilancia: 1 },
    powers: [
      { id: 'tri_investida', name: 'Investida Destruidora', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 5, descricao: 'Investe 20m causando 4d6+4 de dano e derrubando o alvo (teste VIG Dif 18 ou fica caído 2 rodadas).' },
      { id: 'tri_chifrada', name: 'Chifrada Giratória', source: 'raca', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 5, descricao: 'Golpeia em círculo de 5m causando 3d6 em todos os adjacentes.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Média (-3 dados num raio de 100m)',
  },
  anquilossauro: {
    id: 'enemy_anq_1',
    name: 'Anquilossauro Couraçado Casca-de-Ferro',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'selvagem',
    className: 'Fortaleza Viva',
    race: 'Anquilossaurídeo Titânico',
    hpMax: 60,
    hpCurrent: 60,
    fluxoMax: 20,
    fluxoCurrent: 20,
    defense: 16,
    armor: 6,
    attributes: { FOR: 6, AGI: 1, VIG: 6, INT: 1, VON: 4, PRE: 2, ESS: 1, PER: 2 },
    skills: { combate: 3, sobrevivencia: 4, atletismo: 1, vigilancia: 1 },
    powers: [
      { id: 'anq_clava', name: 'Clava de Cauda Esmaga-Ossos', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 0, descricao: 'Balança clava maciça na cauda: 4d6 de dano por esmagamento; alvo deve testar VIG Dif 16 ou fica Atordoado 1 rodada.' },
      { id: 'anq_espinhos', name: 'Carapaça Reversiva', source: 'aspecto', escala: 2, duracao: 'Cena', dificuldade: 15, custoFluxo: 0, descricao: 'Espinhos ósseos pontiagudos refletem 2 pontos de dano físico a qualquer atacante corpo-a-corpo.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Média (-3 dados num raio de 100m)',
  },
  espinossauro: {
    id: 'enemy_spino_1',
    name: 'Espinossauro dos Pântanos da Dobra',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'estrategica',
    className: 'Superpredador Anfíbio',
    race: 'Espinossaurídeo Colossal',
    hpMax: 65,
    hpCurrent: 65,
    fluxoMax: 25,
    fluxoCurrent: 25,
    defense: 16,
    armor: 5,
    attributes: { FOR: 6, AGI: 3, VIG: 6, INT: 2, VON: 4, PRE: 4, ESS: 2, PER: 3 },
    skills: { combate: 4, atletismo: 3, caca: 3, vigilancia: 2 },
    powers: [
      { id: 'spi_mordida', name: 'Mordida de Crocodilo Primal', source: 'classe', escala: 3, duracao: 'Instantâneo', dificuldade: 20, custoFluxo: 0, descricao: 'Mandíbulas alongadas causam 5d6+3 de dano e prendem o alvo. Tenta arrastá-lo para água profunda.' },
      { id: 'spi_cauda', name: 'Golpe de Cauda Alagada', source: 'raca', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 0, descricao: 'Varredura em raio de 8m: causa 3d6 e derruba até 3 criaturas.' },
      { id: 'spi_vela', name: 'Vela da Dobra Tempestuosa', source: 'aspecto', escala: 2, duracao: 'Cena', dificuldade: 15, custoFluxo: 5, descricao: 'Espinhos dorsais canalizam eletricidade estática do Véu, cobrindo o pântano em névoa espessa.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Grande (-4 dados num raio de 200m)',
  },
  trex: {
    id: 'enemy_trex_1',
    name: 'T-Rex Alfa das Dobras',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'estrategica',
    className: 'Apex Devorador de Fluxo',
    race: 'Tiranossauro Cósmico',
    hpMax: 80,
    hpCurrent: 80,
    fluxoMax: 30,
    fluxoCurrent: 30,
    defense: 17,
    armor: 6,
    attributes: { FOR: 7, AGI: 3, VIG: 7, INT: 2, VON: 5, PRE: 5, ESS: 2, PER: 3 },
    skills: { combate: 5, intimidacao: 4, atletismo: 3, vigilancia: 2 },
    powers: [
      { id: 'trex_mordida', name: 'Mordida Trituradora Apex', source: 'classe', escala: 4, duracao: 'Instantâneo', dificuldade: 20, custoFluxo: 0, descricao: 'Mordida que causa 5d6+4 de dano e decepa membros em acertos críticos com MS 10+.' },
      { id: 'trex_rugido', name: 'Rugido Devorador de Véu', source: 'raca', escala: 3, duracao: 'Cena', dificuldade: 20, custoFluxo: 8, descricao: 'Onda sonora sônica: teste VON Dif 18 ou foge aterrorizado por 1d6 rodadas.' },
      { id: 'trex_devorador', name: 'Devorador de Paradoxo', source: 'aspecto', escala: 3, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 0, descricao: 'Qualquer pífio rolado na sua aura cura o T-Rex em 2d6 de Vida.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    statusAura: 'Aura de Silêncio Primal Apex (-4 dados de Fluxo num raio de 300m)',
  },
  shaman_goblin: {
    id: 'enemy_shaman_1',
    name: 'Xamã da Dobra Corrompida',
    isPlayer: false,
    isAutoPlay: true,
    aiIntelligence: 'estrategica',
    className: 'Xamã Sombrio',
    race: 'Goblin Corrompido',
    hpMax: 18,
    hpCurrent: 18,
    fluxoMax: 25,
    fluxoCurrent: 25,
    defense: 13,
    armor: 1,
    attributes: { FOR: 2, AGI: 3, VIG: 2, INT: 4, VON: 3, PRE: 3, ESS: 4, PER: 3 },
    skills: { canalizacao: 3, pressagio: 3, enganacao: 2, vigilancia: 2 },
    powers: [
      { id: 'sh_asfixia', name: 'Névoa Asfixiante', source: 'classe', escala: 2, duracao: 'Cena', dificuldade: 15, custoFluxo: 5, descricao: 'Denso nevoeiro afoga a respiração mágica do alvo causando 2d6 e cegueira parcial.' },
      { id: 'sh_chao', name: 'Chão de Lodo Negro', source: 'classe', escala: 2, duracao: 'Cena', dificuldade: 15, custoFluxo: 4, descricao: 'Cria terreno difícil: -2 dados para esquivar e mover-se.' },
    ],
    conditions: [],
    initiative: 0,
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
  },
};

export interface DinosaurBestiaryEntry {
  id: string;
  name: string;
  scientificGroup: string;
  size: 'Pequeno' | 'Médio' | 'Grande' | 'Colossal' | 'Apex Titânico';
  auraSize: string;
  auraDescription: string;
  tactics: string;
  dangerLevel: 'Perigoso' | 'Ameaça Maior' | 'Catástrofe Viva' | 'Devorador Apex';
  loot: string;
  baseEnemyKey: string;
}

export const DINOSAUR_BESTIARY: DinosaurBestiaryEntry[] = [
  {
    id: 'dino_microraptor',
    name: 'Microraptor Emboscador',
    scientificGroup: 'Dromaeossaurídeo Pequeno',
    size: 'Pequeno',
    auraSize: '20 metros (-1 dado)',
    auraDescription: 'Fraco zumbido na trama. Apaga chamas mágicas menores e causa tremor nas mãos.',
    tactics: 'Ataca em grupos de 3 a 5 das copas das árvores. Inoculam peçonha paralisante no pescoço e fogem planando.',
    dangerLevel: 'Perigoso',
    loot: 'Penas iridescentes (flechas furtivas), glândulas de peçonha (antídotos ou venenos de lâmina).',
    baseEnemyKey: 'microraptor',
  },
  {
    id: 'dino_raptor',
    name: 'Raptor da Matilha',
    scientificGroup: 'Velociraptorídeo Carnívoro',
    size: 'Médio',
    auraSize: '30 metros (-2 dados)',
    auraDescription: 'Dobra o som dos passos. Faz poderes sustentados oscilarem perigosamente.',
    tactics: 'Flanqueiam a presa com saltos velozes. Focam implacavelmente em qualquer conjurador que tente usar Fluxo.',
    dangerLevel: 'Perigoso',
    loot: 'Carne para 4 pessoas por 3 dias, garras em foice que forjam adagas ágeis (dano 1d6+1).',
    baseEnemyKey: 'raptor',
  },
  {
    id: 'dino_pterodactilo',
    name: 'Pterodáctilo Carniceiro',
    scientificGroup: 'Pterossauro Predador dos Céus',
    size: 'Médio',
    auraSize: '30 metros (-2 dados)',
    auraDescription: 'Perturba ventos mágicos e desorienta a leitura do Véu aéreo.',
    tactics: 'Mergulho em picada vertical contra alvos isolados. Ergue a vítima para arremessá-la contra rochedos.',
    dangerLevel: 'Perigoso',
    loot: 'Membrana de asa (usada em capas de planar e tendas impermeáveis), bico perfurante para lanças.',
    baseEnemyKey: 'pterodactilo',
  },
  {
    id: 'dino_paqui',
    name: 'Paquicefalossauro Aríete',
    scientificGroup: 'Ornitísquio Blindado de Impacto',
    size: 'Médio',
    auraSize: '30 metros (-2 dados)',
    auraDescription: 'O ar reverbera como choque de sino sob a aproximação de seus passos.',
    tactics: 'Investida direta com a cabeça em linha reta. Atordoa a vítima e arremessa oponentes para quebrar formações.',
    dangerLevel: 'Perigoso',
    loot: 'Cúpula craniana intacta (produz escudos e elmos de impacto maciço que ignoram atordoamento).',
    baseEnemyKey: 'paquicefalo',
  },
  {
    id: 'dino_carnotauro',
    name: 'Carnotauro Sombrio do Véu',
    scientificGroup: 'Abelissaurídeo Rápido',
    size: 'Grande',
    auraSize: '100 metros (-3 dados)',
    auraDescription: 'Aura densa que resfria a temperatura ao redor e escurece a luz natural em tons cinzentos.',
    tactics: 'Acelera com passadas colossais em túneis e clareiras sombrias. Dilacera com chifres frontais provocando sangramento fatal.',
    dangerLevel: 'Ameaça Maior',
    loot: 'Couro flexível mosqueado (armadura com redução 4 que concede +2 em Furtividade noturna), chifres afiados.',
    baseEnemyKey: 'carnotauro',
  },
  {
    id: 'dino_estego',
    name: 'Estegossauro das Fendas',
    scientificGroup: 'Tireóforo Herbívoro Territorial',
    size: 'Grande',
    auraSize: '100 metros (-3 dados)',
    auraDescription: 'Placas dorsais absorvem magia elemental e pulsam em frequências que causam náusea.',
    tactics: 'Gira violentamente a cauda armada com 4 espigões agudos. Mantém a carapaça voltada para os atacantes.',
    dangerLevel: 'Ameaça Maior',
    loot: 'Espigões caudais (forjam grandes espadas de 4d6), placas térmicas resistentes a calor e frio.',
    baseEnemyKey: 'estegossauro',
  },
  {
    id: 'dino_trike',
    name: 'Triceratops Ancião',
    scientificGroup: 'Ceratopsídeo de Três Chifres',
    size: 'Grande',
    auraSize: '100 metros (-3 dados)',
    auraDescription: 'Vibração contínua que apaga círculos arcanos e enfraquece qualquer canalizador próximo.',
    tactics: 'Avança com o escudo cefálico abaixado, esmagando barricadas, árvores e personagens com Investida Destruidora.',
    dangerLevel: 'Ameaça Maior',
    loot: '200kg de carne nutritiva, placa óssea frontal que forja os maiores escudos da tribo, chifres para lanças 2d6.',
    baseEnemyKey: 'triceratops',
  },
  {
    id: 'dino_anquilo',
    name: 'Anquilossauro Casca-de-Ferro',
    scientificGroup: 'Anquilossaurídeo Maciço',
    size: 'Grande',
    auraSize: '100 metros (-3 dados)',
    auraDescription: 'Aura pesada que parece aumentar a gravidade ao redor, dobrando o cansaço dos aventureiros.',
    tactics: 'Fica imóvel como um rochedo impenetrável. Quando atacado de perto, gira a clava óssea quebrando membros.',
    dangerLevel: 'Catástrofe Viva',
    loot: 'Placas dorsais grossas (armadura pesada com redução 6), clava de cauda para maças de demolição.',
    baseEnemyKey: 'anquilossauro',
  },
  {
    id: 'dino_spino',
    name: 'Espinossauro dos Pântanos',
    scientificGroup: 'Espinossaurídeo Anfíbio Colossal',
    size: 'Colossal',
    auraSize: '200 metros (-4 dados)',
    auraDescription: 'Neblina gélida e espessa do Véu cobre as águas; feitiços aquáticos e de terra sofrem interferência severa.',
    tactics: 'Submerge nos lagos da Dobra e embosca presas na margem. Tranca a boca como pinça de crocodilo e arrasta para o fundo.',
    dangerLevel: 'Catástrofe Viva',
    loot: 'Vela dorsal ressonante de Fluxo (material lendário para rituais de Escala 4), dentes cônicos gigantescos.',
    baseEnemyKey: 'espinossauro',
  },
  {
    id: 'dino_trex',
    name: 'T-Rex Alfa das Dobras',
    scientificGroup: 'Apex Devorador de Fluxo Cósmico',
    size: 'Apex Titânico',
    auraSize: '500 metros (-5 dados)',
    auraDescription: 'Buraco negro no Fluxo. Desliga instantaneamente feitiços sustentados. Magias de Escala 1 a 3 falham automaticamente.',
    tactics: 'Predador supremo que caça e ruge desintegrando barreiras. Qualquer pífio de dados na sua presença alimenta sua carne e cura suas chagas.',
    dangerLevel: 'Devorador Apex',
    loot: 'Coração Cósmico (permite conjurar Tocar o Véu Escala 5 sem perda de VIG 1x na vida), mandíbula titânica.',
    baseEnemyKey: 'trex',
  },
];

/**
 * Evaluates dynamic formulas like "10 + (VIG * 5)" or "AGI * 3" against character attributes.
 */
export function evaluateFormula(formula: string, attributes: Record<string, number>): number {
  try {
    if (!formula || !formula.trim()) return 0;
    let sanitized = formula.toUpperCase().replace(/[×X]/g, '*');
    const attrs = { ...attributes };
    if (attrs['ESS'] !== undefined && attrs['INS'] === undefined) attrs['INS'] = attrs['ESS'];
    if (attrs['INS'] !== undefined && attrs['ESS'] === undefined) attrs['ESS'] = attrs['INS'];

    for (const [attr, val] of Object.entries(attrs)) {
      const regex = new RegExp(`\\b${attr.toUpperCase()}\\b`, 'g');
      sanitized = sanitized.replace(regex, String(val ?? 0));
    }
    // Only allow digits, math operators, parentheses and whitespace
    if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
      return 10;
    }
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${sanitized});`)();
    return typeof result === 'number' && !isNaN(result) ? Math.max(0, Math.floor(result)) : 10;
  } catch (err) {
    console.warn('Formula eval error:', formula, err);
    return 10;
  }
}

/**
 * Creates a complete default character (Slyra / Mira, Felina Guerreira/Ladina)
 * referencing the uploaded image and PDF examples!
 */
export function createDefaultCharacter(): CharacterSheet {
  const attributes: Record<string, number> = {
    FOR: 2,
    AGI: 3,
    VIG: 2,
    INT: 2,
    VON: 2,
    PRE: 1,
    ESS: 2,
    PER: 2,
  };

  // 18 official Ecos skills, each <= 2 at start, budget 10 + (INT * 2) = 14
  const skills: Record<string, number> = {
    combate: 2,
    armas_brancas: 2,
    pontaria: 2,
    atletismo: 2,
    furtividade: 2,
    sobrevivencia: 2,
    canalizacao: 2,
  };

  const hp = evaluateFormula('10 + (VIG * 5)', attributes);
  const fluxo = evaluateFormula('10 + (ESS * 5)', attributes);
  const desloc = evaluateFormula('AGI * 3', attributes);

  return {
    id: 'char_default_1',
    name: 'Slyra Garra-Negra',
    player: 'Aventureiro(a)',
    gender: 'Feminino',
    race: 'Povo Felino',
    raceEco: 'Eco da Sombra',
    className: 'Ladino',
    classFluxo: 'Fluxo da Sombra',
    avatarUrl: '',
    notes: 'Guerreira felina ágil vestindo uniforme de treino amarelo com detalhes escuros, especialista em infiltrações na Dobra e ataques silenciosos em bandos de predadores.',
    attributes,
    skills,
    hpMax: hp,
    hpCurrent: hp,
    fluxoMax: fluxo,
    fluxoCurrent: fluxo,
    sanidadeMax: evaluateFormula('10 + (VON * 5)', attributes),
    sanidadeCurrent: evaluateFormula('10 + (VON * 5)', attributes),
    fadigaMax: evaluateFormula('10 + (FOR * 5)', attributes),
    fadigaCurrent: evaluateFormula('10 + (FOR * 5)', attributes),
    auraMax: evaluateFormula('10 + (PRE * 5)', attributes),
    auraCurrent: evaluateFormula('10 + (PRE * 5)', attributes),
    deslocamento: desloc,
    concept: 'Ladina Felina caçadora de anomalias no Véu',
    trouble: 'Odor de sangue atrai predadores titânicos da Dobra',
    aspects: ['Reflexos de Pantera', 'Lâmina Rápida do Silêncio', 'Companheira de Matilha'],
    primaryPath: 'Movimento',
    secondaryPath: 'Sombra',
    powers: [
      { id: 'l1', name: 'Manto Cinzento', source: 'classe', escala: 1, duracao: 'Cena', dificuldade: 10, custoFluxo: 8, descricao: '+3 dados em Furtividade por 1 cena. PER Dif 18 para notar se estiver imóvel.', efeitoMS: '+4 dados em Furtividade.' },
      { id: 'l2', name: 'Passo do Vulto', source: 'classe', escala: 2, duracao: 'Instantâneo', dificuldade: 15, custoFluxo: 7, descricao: 'Teleporta até 10m entre duas sombras visíveis sem provocar ataque de oportunidade.', efeitoMS: 'Teleporta até 20m.' },
      { id: 'rf1', name: 'Queda Suave', source: 'raca', escala: 1, duracao: 'Instantâneo', dificuldade: 10, custoFluxo: 5, descricao: 'Anula totalmente o dano de quedas de até 30m de altura.' },
    ],
    inventory: [
      { id: 'inv1', name: 'Adaga de Garra Curva', type: 'arma', bonusDamage: 2, weight: 1, description: 'Lâmina afiada forjada com dente de raptor.' },
      { id: 'inv2', name: 'Couro Flexível de Caçador', type: 'armadura', armorReduction: 2, weight: 3, description: 'Armadura leve que amortece impactos sem diminuir a mobilidade.' },
      { id: 'inv3', name: 'Frasco de Seiva Restauradora', type: 'item', weight: 0.5, description: 'Cura 1d6 de Vida quando ingerido.' },
    ],
    conditions: [],
    xp: 15,
    totalXp: 15,
    spentXp: 0,
    advancementHistory: [
      {
        id: 'adv_init',
        timestamp: new Date().toLocaleDateString(),
        title: 'Criação Inicial do Personagem',
        xpCost: 0,
        category: 'recurso',
        details: 'Distribuição dos pontos base ancestrais e 15 XP concedidos para primeiros aprimoramentos.',
      },
    ],
  };
}

