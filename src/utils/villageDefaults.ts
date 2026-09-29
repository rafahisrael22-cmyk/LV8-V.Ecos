import { Village, VillageNPC, NPCQuest } from '../types/lv8';

export const DEFAULT_VILLAGES: Village[] = [
  {
    id: 'vil_ebano_1',
    name: 'Aldeia das Garras de Ébano',
    biome: 'Floresta Primal das Dobras',
    description: 'Um assentamento fortificado construído em torno de sequoias titânicas. As paliçadas de troncos fósseis protegem os clãs furry contra as matilhas de terópodes atraídos pela ressonância do Fluxo.',
    defenseLevel: 4,
    prosperity: 3,
    dangerZone: 'Aura de Silêncio Menor (30 metros)',
    facilities: [
      { id: 'fac_1', name: 'Forja de Presas & Fósseis', type: 'forja', level: 2, description: 'Trabalha garras de terópodes e placas de anquilossauro para forjar armaduras e lâminas afiadas.' },
      { id: 'fac_2', name: 'Tenda dos Totens Ancestrais', type: 'santuario', level: 2, description: 'Lugar sagrado onde xamãs meditam e estabilizam pequenas fendas na trama do Véu.' },
      { id: 'fac_3', name: 'Feira dos Escambos da Selva', type: 'mercado', level: 1, description: 'Trocadilhos de peles, carne defumada de ceratopsídeos e seiva restauradora.' },
      { id: 'fac_4', name: 'Paliçada de Troncos Férreos', type: 'defesa', level: 3, description: 'Muralhas reforçadas com espigões de estegossauro que suportam investidas de dinos médios.' },
    ],
    npcs: [
      {
        id: 'npc_kaelen',
        name: 'Kaelen Presa-de-Ferro',
        role: 'Mestre Forjador da Tribo',
        race: 'Povo Felino (Leopardo)',
        eco: 'Eco do Fogo Primal',
        affinity: 'amigavel',
        dialogueGreeting: '"Que seus passos façam a terra tremer, caçador. Minha bigorna clama por placas de ossos titânicos. Precisa de uma lâmina mais afiada ou veio me trazer butim?"',
        lore: 'Veterano das guerras contra as matilhas de raptores. Perdeu o braço esquerdo em combate e o substituiu por uma prótese mecânica de osso e lâmina de titanossauro.',
        locationInVillage: 'Forja Central das Presas',
        avatarIcon: 'Hammer',
        quests: [
          {
            id: 'q_placa_trike',
            title: 'O Escudo de Placa Cefálica',
            giverNpcId: 'npc_kaelen',
            giverNpcName: 'Kaelen Presa-de-Ferro',
            difficulty: 'Médio',
            summary: 'Kaelen precisa da placa óssea intacta de um Triceratops Ancião para forjar os escudos de defesa da aldeia antes da próxima estação de tempestades do Véu.',
            briefingDialogue: '"Um Triceratops antigo tem marcado território na Ravina Leste. Se você derrubar a besta e trouxer a placa frontal sem rachaduras, forjarei para você um broquel lendário."',
            completionDialogue: '"Pelos ancestrais! Essa placa é mais densa que rocha vulcânica. Tome esta arma forjada com minhas próprias garras, você é um verdadeiro filho da Dobra!"',
            targetLocation: 'Ravina Leste dos Monólitos',
            steps: [
              {
                id: 's_trike_1',
                description: 'Rastrear a manada até o bebedouro lamacento.',
                testRequired: true,
                attribute: 'PER',
                skill: 'rastreio',
                difficulty: 12,
              },
              {
                id: 's_trike_2',
                description: 'Enfrentar o Triceratops Ancião Territorial em combate aberto.',
                combatTrigger: {
                  enemyName: 'Triceratops Ancião Territorial',
                  enemyType: 'triceratops',
                  count: 1,
                },
              },
            ],
            reward: {
              xp: 25,
              fluxReward: 5,
              item: {
                name: 'Escudo Cefálico de Ceratopsídeo',
                type: 'armadura',
                armorReduction: 3,
                description: 'Escudo maciço esculpido a partir da crista óssea de um triceratops ancestral. Absorve 3 de dano físico.',
              },
              narrativeReward: 'A defesa da aldeia aumenta em +1 nível.',
            },
            status: 'disponivel',
          },
          {
            id: 'q_garras_raptor',
            title: 'Garras em Foice para as Flechas da Vigia',
            giverNpcId: 'npc_kaelen',
            giverNpcName: 'Kaelen Presa-de-Ferro',
            difficulty: 'Fácil',
            summary: 'Colete 4 garras curvadas de raptores da matilha para as pontas de flecha dos arqueiros da aldeia.',
            briefingDialogue: '"Os raptores andam rondando nossos celeiros. Cace ao menos dois deles e traga suas garras curvadas."',
            completionDialogue: '"Perfeito! Essas pontas vão perfurar até o couro grosso de carnotauros."',
            targetLocation: 'Orla das Árvores Partidas',
            steps: [
              {
                id: 's_rap_1',
                description: 'Mover-se furtivamente entre as samambaias gigantes.',
                testRequired: true,
                attribute: 'AGI',
                skill: 'furtividade',
                difficulty: 10,
              },
              {
                id: 's_rap_2',
                description: 'Eliminar os Raptores em combate.',
                combatTrigger: {
                  enemyName: 'Raptores da Orla',
                  enemyType: 'raptor',
                  count: 2,
                },
              },
            ],
            reward: {
              xp: 15,
              fluxReward: 3,
              item: {
                name: 'Aljava de Flechas de Garra',
                type: 'arma',
                bonusDamage: 2,
                description: 'Flechas primitivas com ponta de garra em foice (+2 dano perfurante).',
              },
              narrativeReward: 'Os arqueiros da guarda passam a saudar o herói com honra.',
            },
            status: 'disponivel',
          },
        ],
      },
      {
        id: 'npc_morgaena',
        name: 'Xamã Morgaena Olho-do-Véu',
        role: 'Guardiã Espiritual & Tecelã do Véu',
        race: 'Povo Raposa (Vulpino)',
        eco: 'Eco do Vazio Cósmico',
        affinity: 'reverente',
        dialogueGreeting: '"Sinto as linhas do seu Fluxo vibrando, viajante. As Dobras no céu estão agitadas esta noite. Você escuta o lamento dos que foram engolidos pelo paradoxo?"',
        lore: 'Nascida durante uma tempestade de colapso do Véu. Seus olhos albinos enxergam as correntes etéreas de magia e as auras de silêncio que os dinossauros emanam.',
        locationInVillage: 'Tenda dos Totens Ancestrais',
        avatarIcon: 'Sparkles',
        quests: [
          {
            id: 'q_fenda_selo',
            title: 'O Ritual de Selamento da Dobra Menor',
            giverNpcId: 'npc_morgaena',
            giverNpcName: 'Xamã Morgaena',
            difficulty: 'Difícil',
            summary: 'Uma fenda dimensional pulsante abriu-se no Pico dos Espíritos, drenando a sanidade dos xamãs e ameaçando rasgar o tecido da realidade.',
            briefingDialogue: '"A Dobra está sangrando paradoxo puro. Preciso que você escale o Pico e canalize o cristal sagrado para fechar o corte antes que um T-Rex Alfa fareje o vazamento."',
            completionDialogue: '"O Véu se acalmou. O zumbido insuportável cessou. Beba deste Elixir dos Ancestrais; seu espírito merece descanso."',
            targetLocation: 'Pico dos Espíritos Ventosos',
            steps: [
              {
                id: 's_mor_1',
                description: 'Escalar a encosta gélida sob ventos cortantes do paradoxo.',
                testRequired: true,
                attribute: 'FOR',
                skill: 'atletismo',
                difficulty: 14,
              },
              {
                id: 's_mor_2',
                description: 'Canalizar o Fluxo para realinhar a fenda sem sofrer colapso.',
                testRequired: true,
                attribute: 'INS',
                skill: 'percepcao_fluxo',
                difficulty: 15,
              },
            ],
            reward: {
              xp: 30,
              fluxReward: 8,
              item: {
                name: 'Elixir de Seiva da Dobra Pura',
                type: 'item',
                description: 'Restaura instantaneamente todo o Fluxo e concede +2 dados em rituais na próxima cena.',
              },
              narrativeReward: 'A sanidade de toda a aldeia é protegida contra alucinações cósmicas.',
            },
            status: 'disponivel',
          },
        ],
      },
      {
        id: 'npc_braxx',
        name: 'Braxx, o Rastreador Noturno',
        role: 'Capitão dos Batedores',
        race: 'Povo Canino (Lobo Selvagem)',
        eco: 'Eco da Caça Primal',
        affinity: 'aliado',
        dialogueGreeting: '"Mantenha as lâminas desembainhadas e o nariz contra o vento. A selva não perdoa quem pisa em galho seco."',
        lore: 'Líder dos caçadores de vanguarda da tribo. Já sobreviveu a três ataques de carnotauro e conhece os atalhos secretos entre as raízes ciclópicas.',
        locationInVillage: 'Posto de Vigia Sul',
        avatarIcon: 'Compass',
        quests: [
          {
            id: 'q_ninho_micro',
            title: 'Extermínio do Ninho dos Microraptores',
            giverNpcId: 'npc_braxx',
            giverNpcName: 'Braxx, o Rastreador',
            difficulty: 'Fácil',
            summary: 'Um bando de microraptores venenosos aninhou-se no pomar de frutas da aldeia, cuspindo peçonha nos apanhadores.',
            briefingDialogue: '"Eles são pequenos, mas atacam em bando e o veneno deles paralisa os músculos em segundos. Limpe a copa das árvores para nós."',
            completionDialogue: '"Bom trabalho! O pomar está seguro e o povo da aldeia pode colher as provisões."',
            targetLocation: 'Pomar de Seivas Altas',
            steps: [
              {
                id: 's_br_1',
                description: 'Identificar a árvore-mãe onde os microraptores dormem.',
                testRequired: true,
                attribute: 'PER',
                skill: 'caca',
                difficulty: 11,
              },
              {
                id: 's_br_2',
                description: 'Confrontar a ninhada agressiva.',
                combatTrigger: {
                  enemyName: 'Bando de Microraptores Emboscadores',
                  enemyType: 'microraptor',
                  count: 3,
                },
              },
            ],
            reward: {
              xp: 20,
              fluxReward: 3,
              item: {
                name: 'Bolsa de Frutos Medicinais',
                type: 'item',
                description: 'Restaura 2d6 de Vida ao ser consumido fora de combate.',
              },
              narrativeReward: 'A prosperidade alimentar da aldeia aumenta em +1.',
            },
            status: 'disponivel',
          },
        ],
      },
    ],
  },
  {
    id: 'vil_pantano_2',
    name: 'Refúgio das Brumas Lamacentas',
    biome: 'Pântano dos Titãs Sepultados',
    description: 'Aldeia lacustre erguida sobre palafitas gigantescas de madeira fóssil. Seus habitantes navegam em pirogas silenciosas para fugir dos espinossauros territoriais.',
    defenseLevel: 3,
    prosperity: 2,
    dangerZone: 'Aura de Silêncio Média (100 metros)',
    facilities: [
      { id: 'fac_p1', name: 'Pier das Pirogas Camufladas', type: 'alojamento', level: 2, description: 'Barcos de junco leve com auras que disfarçam o odor de sangue.' },
      { id: 'fac_p2', name: 'Altar das Raízes Flutuantes', type: 'santuario', level: 1, description: 'Pilar onde se oferenda lodo mágico para acalmar os predadores aquáticos.' },
    ],
    npcs: [
      {
        id: 'npc_tarrok',
        name: 'Tarrok, o Remador Cego',
        role: 'Guia dos Canais Sombrios',
        race: 'Povo Réptil (Crocodiliano)',
        eco: 'Eco das Águas Profundas',
        affinity: 'neutro',
        dialogueGreeting: '"Ouça a água borbulhando... quando o borbulhar para, é sinal de que o Espinossauro abriu a bocarra logo abaixo de você."',
        lore: 'Perdeu a visão na juventude, mas seus poros percebem a menor vibração na água pantanosa num raio de centenas de metros.',
        locationInVillage: 'Doca das Palafitas',
        avatarIcon: 'Anchor',
        quests: [
          {
            id: 'q_espinossauro_reino',
            title: 'O Terror da Lagoa Negra',
            giverNpcId: 'npc_tarrok',
            giverNpcName: 'Tarrok',
            difficulty: 'Brutal',
            summary: 'O grande Espinossauro da Dobra bloqueou a única rota de transporte da aldeia. A tribo corre risco de inanição.',
            briefingDialogue: '"Não peço que derrote a besta se não puder, mas afaste-a das docas ou enfrente sua mandíbula de navalha."',
            completionDialogue: '"As águas estão límpidas pela primeira vez em ciclos solares. Tome este amuleto dos velhos tempos."',
            targetLocation: 'Lagoa dos Ossos Submersos',
            steps: [
              {
                id: 's_tar_1',
                description: 'Navegar furtivamente pelas águas escuras sem agitar a superfície.',
                testRequired: true,
                attribute: 'AGI',
                skill: 'furtividade',
                difficulty: 14,
              },
              {
                id: 's_tar_2',
                description: 'Confrontar o Espinossauro dos Pântanos.',
                combatTrigger: {
                  enemyName: 'Espinossauro dos Pântanos da Dobra',
                  enemyType: 'espinossauro',
                  count: 1,
                },
              },
            ],
            reward: {
              xp: 50,
              fluxReward: 12,
              item: {
                name: 'Dente Colossal de Espinossauro',
                type: 'arma',
                bonusDamage: 4,
                description: 'Adaga de cerco colossal que perfura couraças pesadas.',
              },
              narrativeReward: 'O Refúgio das Brumas estabelece rotas comerciais seguras para sempre.',
            },
            status: 'disponivel',
          },
        ],
      },
    ],
  },
];

export function createEmptyVillage(): Village {
  const id = `vil_${Date.now()}`;
  return {
    id,
    name: 'Nova Aldeia da Dobra',
    biome: 'Floresta Primal',
    description: 'Um novo assentamento de sobreviventes reunidos para resistir ao horror do Véu e aos predadores titânicos.',
    defenseLevel: 2,
    prosperity: 2,
    dangerZone: 'Aura de Silêncio Baixa (20 metros)',
    facilities: [
      { id: `fac_${Date.now()}_1`, name: 'Paliçada de Bambu Grosso', type: 'defesa', level: 1, description: 'Defesa inicial contra animais de pequeno porte.' },
      { id: `fac_${Date.now()}_2`, name: 'Fogueira Central Comunitária', type: 'alojamento', level: 1, description: 'Ponto de encontro onde histórias e rituais são compartilhados.' }
    ],
    npcs: [],
    notes: 'Criada pelo Mestre/Jogador.',
  };
}

export function createEmptyNPC(villageId: string): VillageNPC {
  const id = `npc_${Date.now()}`;
  return {
    id,
    name: 'Novo Habitante Tribal',
    role: 'Caçador / Artesão',
    race: 'Povo Felino',
    eco: 'Eco da Terra',
    affinity: 'neutro',
    dialogueGreeting: '"Saudações, viajante das Dobras. O que procura em nossas terras?"',
    lore: 'Habitante leal que trabalha para garantir a sobrevivência de sua linhagem.',
    locationInVillage: 'Praça Central',
    quests: [],
  };
}

export function createEmptyQuest(npcId: string, npcName: string): NPCQuest {
  const id = `q_${Date.now()}`;
  return {
    id,
    title: 'Nova Missão da Tribo',
    giverNpcId: npcId,
    giverNpcName: npcName,
    difficulty: 'Médio',
    summary: 'Uma tarefa essencial para defender a aldeia ou obter recursos raros na selva.',
    briefingDialogue: '"Precisamos de sua bravura para uma tarefa urgente. Escute bem..."',
    completionDialogue: '"Você cumpriu sua palavra com honra. Tome sua devida recompensa."',
    targetLocation: 'Ermos da Dobra',
    steps: [
      {
        id: `s_${Date.now()}_1`,
        description: 'Superar o terreno acidentado e encontrar os rastros.',
        testRequired: true,
        attribute: 'PER',
        skill: 'rastreio',
        difficulty: 12,
      },
      {
        id: `s_${Date.now()}_2`,
        description: 'Enfrentar o predador territorial.',
        combatTrigger: {
          enemyName: 'Raptor da Matilha',
          enemyType: 'raptor',
          count: 1,
        },
      }
    ],
    reward: {
      xp: 20,
      fluxReward: 4,
      item: {
        name: 'Amuleto de Osso Fóssil',
        type: 'item',
        description: 'Concede +1 dado em testes de Sobrevivência.',
      },
      narrativeReward: 'A tribo confia mais em você.',
    },
    status: 'disponivel',
  };
}
