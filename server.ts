import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to sanitize Gemini JSON responses (strip markdown wrappers if present)
function cleanJsonText(rawText?: string): any {
  let text = (rawText || '').trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return JSON.parse(text || '{}');
}

// Endpoint: Dynamic Gamebook Event Generation
app.post('/api/gemini/event', async (req, res) => {
  try {
    const character = req.body?.character || {};
    const currentLocation = req.body?.currentLocation;
    const previousAction = req.body?.previousAction;
    const historySummary = req.body?.historySummary;

    if (!aiClient) {
      return res.status(200).json({
        fallback: true,
        message: 'Chave Gemini API não configurada no servidor. Usando gerador procedural.',
      });
    }

    const prompt = `
Você é o Mestre Narrador brutal do sistema de RPG LV8 (Ecos da Dobra / Fantasia Primal).
O universo mistura fantasia primal tribal furry, dinossauros como buracos no Fluxo devoradores de magia com auras de silêncio, e as Dobras cósmicas do Véu onde a realidade se distorce.

Dados do Personagem:
- Nome: ${character.name || 'Guerreiro(a)'}
- Raça: ${character.race || 'Felino'} (${character.raceEco || 'Eco da Sombra'})
- Classe: ${character.className || 'Ladino'} (${character.classFluxo || 'Fluxo da Sombra'})
- Atributos: FOR ${character.attributes?.FOR || 3}, AGI ${character.attributes?.AGI || 3}, VIG ${character.attributes?.VIG || 3}, INT ${character.attributes?.INT || 3}, VON ${character.attributes?.VON || 3}, PRE ${character.attributes?.PRE || 2}, INS/ESS ${character.attributes?.INS || character.attributes?.ESS || 3}, PER ${character.attributes?.PER || 4}
- Vida Atual/Máx: ${character.hpCurrent}/${character.hpMax}
- Fluxo Atual/Máx: ${character.fluxoCurrent}/${character.fluxoMax}
- Condições: ${character.conditions?.join(', ') || 'Nenhuma'}
- Aspectos: ${character.aspects?.join(' | ') || 'Nenhum'}
- Localização Atual: ${currentLocation || 'Selva Primal da Dobra'}
- Ação Anterior Escolhida: ${previousAction || 'Início da jornada'}
- Resumo do Histórico: ${historySummary || 'O aventureiro adentra os territórios selvagens onde auras primais sufocam o Fluxo.'}

Gere um evento dinâmico em formato JSON com a seguinte estrutura estrita:
{
  "title": "Título evocativo e brutal do evento",
  "narrative": "Descrição vívida e imersiva de 2 a 3 parágrafos em português, com detalhes sensoriais do ambiente, perigo iminente, criaturas primitivas ou ecos da Dobra.",
  "dangerLevel": "Baixo" | "Médio" | "Alto" | "Extremo",
  "environmentalEffect": "Ex: Aura de Silêncio Primal (-2 dados de Fluxo) ou Névoa Espessa (+2 Dif PER)",
  "choices": [
    {
      "id": "c1",
      "text": "Ação descritiva",
      "testRequired": true | false,
      "attribute": "AGI" | "FOR" | "PER" | "INT" | "VON" | "INS" | "ESS",
      "skill": "Furtividade" | "Atletismo" | "Percepção de Fluxo" | "Sobrevivência" | "Briga" | "Lâminas" | "Arcos" | "Ritual" | "Medicina Primal" | "Vigilância",
      "difficulty": 10 | 15 | 20 | 25,
      "difficultyLabel": "Fácil (10)" | "Médio (15)" | "Difícil (20)" | "Heroico (25)",
      "fluxCost": 0,
      "successOutcome": "O que acontece se passar",
      "failureOutcome": "Dano brutal ou complicação se falhar (ex: Perde 4 HP ou atrai predadores)",
      "isCombatTrigger": false
    },
    {
      "id": "c2",
      "text": "Outra abordagem ousada",
      "testRequired": true,
      "attribute": "...",
      "skill": "...",
      "difficulty": 15,
      "difficultyLabel": "Médio (15)",
      "fluxCost": 0,
      "successOutcome": "...",
      "failureOutcome": "...",
      "isCombatTrigger": false
    },
    {
      "id": "c3",
      "text": "Confronto direto ou emboscada violenta",
      "testRequired": false,
      "isCombatTrigger": true,
      "enemyEncounter": {
        "name": "Nome da ameaça (ex: Matilha de 2 Raptores ou Xamã Corrompido)",
        "enemyType": "Raptor da Matilha" | "Triceratops Ancião" | "T-Rex Alfa" | "Guerreiro Goblin" | "Besta da Dobra",
        "count": 1 | 2 | 3
      }
    }
  ]
}
Responda APENAS com o JSON válido, sem comentários ou texto adicional.
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanJsonText(response.text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini Event Error, activating procedural engine:', error.message);
    
    // Rich procedural fallback so the game never stalls
    const proceduralEvents = [
      {
        title: "A Fenda das Sombras e o Eco Primal",
        narrative: "Uma fenda etérea se abre entre duas árvores ancestrais retorcidas. O ar ao redor parece vibrar com um zumbido grave que sufoca o Fluxo ao redor, e você sente garras invisíveis raspando contra a trama do Véu. À frente, reluzem fragmentos de ossos de um terópode fossilizado impregnados com essência cósmica.",
        dangerLevel: "Médio",
        environmentalEffect: "Aura de Silêncio (-2 dados de Fluxo)",
        choices: [
          {
            id: "proc_1",
            text: "Sintonizar os sentidos ancestrais para ler o padrão da fenda",
            testRequired: true,
            attribute: "INS",
            skill: "percepcao_fluxo",
            difficulty: 14,
            difficultyLabel: "Médio (14)",
            fluxCost: 2,
            successOutcome: "Você compreende a anomalia e absorve 1d6 de Fluxo purificado!",
            failureOutcome: "O paradoxo da fenda queima sua mente: sofre 3 de dano mental."
          },
          {
            id: "proc_2",
            text: "Avançar silenciosamente contornando a distorção pelas folhagens",
            testRequired: true,
            attribute: "AGI",
            skill: "furtividade",
            difficulty: 12,
            difficultyLabel: "Fácil (12)",
            fluxCost: 0,
            successOutcome: "Você passa despercebido como uma pluma nas correntes de ar.",
            failureOutcome: "Você tropeça em raízes pontiagudas e sofre 2 de dano de corte."
          },
          {
            id: "proc_3",
            text: "Um rosnado estridente ecoa: Um Raptor surge da névoa!",
            testRequired: false,
            isCombatTrigger: true,
            enemyEncounter: {
              name: "Raptor da Matilha Faminto",
              enemyType: "Raptor da Matilha",
              count: 1
            }
          }
        ]
      },
      {
        title: "O Pântano dos Titãs Sepultados",
        narrative: "Lodo negro borbulha sob suas patas. Carcaças de gigantescas bestas com armaduras ósseas repousam sob a lama milenar. O ar está denso e úmido, e pequenos vapores alucinógenos sobem dos charcos, testando a fortitude de qualquer viajante desavisado.",
        dangerLevel: "Alto",
        environmentalEffect: "Terreno Difícil (Deslocamento reduzido à metade)",
        choices: [
          {
            id: "proc_b1",
            text: "Saltar entre os troncos submersos para evitar o lodo asfixiante",
            testRequired: true,
            attribute: "AGI",
            skill: "atletismo",
            difficulty: 15,
            difficultyLabel: "Médio (15)",
            successOutcome: "Você cruza o pântano em segurança mantendo o ritmo de caça!",
            failureOutcome: "Você afunda até a cintura e perde 3 de HP ao lutar contra a lama."
          },
          {
            id: "proc_b2",
            text: "Identificar ervas purificadoras na margem lamacenta",
            testRequired: true,
            attribute: "INT",
            skill: "sobrevivencia",
            difficulty: 13,
            difficultyLabel: "Médio (13)",
            successOutcome: "Você encontra raízes de cura que restauram 1d6 de Vida!",
            failureOutcome: "As plantas estão contaminadas por toxinas primitivas."
          },
          {
            id: "proc_b3",
            text: "Uma placa óssea se ergue: Emboscada de Triceratops!",
            testRequired: false,
            isCombatTrigger: true,
            enemyEncounter: {
              name: "Triceratops Protetor do Charco",
              enemyType: "Triceratops Ancião",
              count: 1
            }
          }
        ]
      }
    ];

    const chosen = proceduralEvents[Math.floor(Math.random() * proceduralEvents.length)];
    return res.json(chosen);
  }
});

// Endpoint: AI Combat Decision (Tactical Enemy or Party Autoplay)
app.post('/api/gemini/combat-decision', async (req, res) => {
  try {
    const actor = req.body?.actor || {};
    const targets = req.body?.targets || [];
    const battlefield = req.body?.battlefield;
    const isPlayerCharacter = req.body?.isPlayerCharacter;
    const intelligenceType = req.body?.intelligenceType || 'selvagem';

    if (!aiClient) {
      return res.status(200).json({
        fallback: true,
        actionType: 'attack',
        targetId: targets[0]?.id || '',
        description: 'Ataque padrão feroz contra o alvo mais próximo.',
      });
    }

    const prompt = `
Você é o motor tático brutal de combate do RPG LV8.
Ator que está agindo:
- Nome: ${actor.name}
- Tipo: ${isPlayerCharacter ? 'Personagem do Jogador (Modo Auto-Play)' : 'Inimigo (' + intelligenceType + ')'}
- Atributos: FOR ${actor.attributes?.FOR || 3}, AGI ${actor.attributes?.AGI || 3}, INT ${actor.attributes?.INT || 2}, INS/ESS ${actor.attributes?.INS || actor.attributes?.ESS || 2}
- Vida: ${actor.hpCurrent}/${actor.hpMax}
- Fluxo: ${actor.fluxoCurrent}/${actor.fluxoMax}
- Condições: ${actor.conditions?.join(', ') || 'Nenhuma'}
- Poderes/Ações Disponíveis: ${JSON.stringify(actor.powers || [])}
- Inteligência Tática: ${actor.attributes?.INT >= 3 ? 'Estratégica (calculista, foca os mais fracos ou quem canaliza Fluxo, usa condições e terreno)' : 'Selvagem (bestial, ataca o mais próximo ou reage por instinto)'}

Alvos Potenciais:
${JSON.stringify(
  targets.map((t: any) => ({
    id: t.id,
    name: t.name,
    hpCurrent: t.hpCurrent,
    hpMax: t.hpMax,
    fluxoCurrent: t.fluxoCurrent,
    conditions: t.conditions,
  }))
)}

Estado da Arena:
${JSON.stringify(battlefield || {})}

Determine a melhor jogada tática brutal de acordo com as regras LV8 (1 Ação Maior, 1 Ação Menor, gestão de Fluxo e condições).
Retorne estritamente um JSON:
{
  "actionType": "attack" | "cast_power" | "create_aspect" | "defend_dodge",
  "targetId": "ID do alvo escolhido",
  "targetName": "Nome do alvo",
  "powerName": "Nome do poder se aplicável, ou null",
  "powerCost": 0,
  "movementDesc": "Descrição da Ação Menor (ex: aproxima-se 9m pelas sombras)",
  "majorActionDesc": "Descrição visceral e brutal da Ação Maior (ex: desfere golpe esmagador visando a jugular)",
  "tacticalReasoning": "1 frase justificando a escolha baseada na inteligência do ator"
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanJsonText(response.text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini Combat Decision Error:', error.message);
    const primaryTarget = req.body?.targets?.[0];
    return res.json({
      fallback: true,
      actionType: 'attack',
      targetId: primaryTarget?.id || '',
      targetName: primaryTarget?.name || 'Inimigo',
      powerName: null,
      powerCost: 0,
      movementDesc: 'Avança furtivamente pelo flanco.',
      majorActionDesc: 'Desfere um ataque feroz com presas ou lâmina!',
      tacticalReasoning: 'Ação instintiva rápida em combate cerrado.'
    });
  }
});

// Endpoint: AI NPC & Quest Generator for Villages
app.post('/api/gemini/npc-quest', async (req, res) => {
  try {
    const { villageName, villageBiome, npcName, npcRole, characterLevel, difficulty } = req.body;

    if (!aiClient) {
      return res.status(200).json({
        fallback: true,
        title: `Ameaça nas Fronteiras de ${villageName || 'Aldeia'}`,
        difficulty: difficulty || 'Médio',
        summary: `Criaturas anômalas foram avistadas rondando os arredores. O NPC solicita que você investigue e garanta a segurança da tribo.`,
        briefingDialogue: `"Aventureiro, os ventos trazem o fedor de enxofre e predadores. Precisamos que você vá até o desfiladeiro e resolva isso antes do cair da noite."`,
        completionDialogue: `"Você honrou nosso clã! Tome esta recompensa de nossas reservas."`,
        targetLocation: `Desfiladeiro da Dobra`,
        steps: [
          {
            id: 's1',
            description: 'Rastrear pegadas de garras nas folhagens densas.',
            testRequired: true,
            attribute: 'PER',
            skill: 'rastreio',
            difficulty: 12
          },
          {
            id: 's2',
            description: 'Confrontar a fera que espreita na fenda.',
            combatTrigger: {
              enemyName: 'Raptor Territorial da Dobra',
              enemyType: 'raptor',
              count: 1
            }
          }
        ],
        reward: {
          xp: 15,
          fluxReward: 5,
          item: {
            name: 'Presa Polida do Véu',
            type: 'arma',
            bonusDamage: 2,
            description: 'Adaga primitiva afiada com garras de terópode.'
          },
          narrativeReward: 'A vila reconhece sua coragem e os caçadores o saúdam com reverência.'
        }
      });
    }

    const prompt = `
Você é o mestre narrador de RPG do sistema LV8 (Ecos da Dobra).
Gere uma MISSÃO / AVENTURA (Quest) para ser oferecida por um NPC em uma Vila / Assentamento.

Contexto da Vila:
- Nome da Vila: ${villageName || 'Aldeia das Garras de Ébano'}
- Bioma/Ambiente: ${villageBiome || 'Floresta Primal da Dobra'}

Contexto do NPC que dá a missão:
- Nome: ${npcName || 'Ancião da Tribo'}
- Papel/Profissão: ${npcRole || 'Líder / Sacerdote'}
- Dificuldade desejada: ${difficulty || 'Médio'}

Estrutura do LV8:
- Desafios usam atributos (FOR, AGI, VIG, INT, VON, PRE, INS, PER) e perícias (Lâminas, Arcos, Furtividade, Rastreio, Sobrevivência, Atletismo, Percepção de Fluxo, Ritual, etc.).
- Dinossauros predadores válidos para combate: "microraptor", "raptor", "pterodactilo", "paquicefalo", "carnotauro", "estegossauro", "triceratops", "anquilossauro", "espinossauro", "trex", "shaman_goblin".

Gere estritamente um JSON com a seguinte estrutura:
{
  "title": "Título épico e evocativo da missão",
  "difficulty": "Fácil" | "Médio" | "Difícil" | "Heroico" | "Brutal",
  "summary": "Resumo em 1 parágrafo do objetivo",
  "briefingDialogue": "Falas do NPC oferecendo a missão em primeira pessoa com sotaque tribal / primal",
  "completionDialogue": "Falas do NPC parabenizando o jogador ao concluir",
  "targetLocation": "Nome da área externa ou masmorra onde a missão ocorre",
  "steps": [
    {
      "id": "s1",
      "description": "Descrição do primeiro obstáculo",
      "testRequired": true,
      "attribute": "AGI" | "PER" | "FOR" | "INT" | "INS",
      "skill": "rastreio" | "furtividade" | "atletismo" | "sobrevivencia" | "percepcao_fluxo",
      "difficulty": 12
    },
    {
      "id": "s2",
      "description": "Confronto ou clímax",
      "combatTrigger": {
        "enemyName": "Nome da criatura",
        "enemyType": "raptor" | "triceratops" | "trex" | "microraptor" | "carnotauro",
        "count": 1
      }
    }
  ],
  "reward": {
    "xp": 20,
    "fluxReward": 5,
    "item": {
      "name": "Nome do item ou butim",
      "type": "arma" | "armadura" | "item" | "butim",
      "bonusDamage": 2,
      "armorReduction": 0,
      "description": "Descrição do item recebido"
    },
    "narrativeReward": "Consequência positiva para a vila e o clã"
  }
}
Responda APENAS com o JSON.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = cleanJsonText(response.text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini Village Quest Error:', err.message);
    return res.json({
      fallback: true,
      title: 'A Caçada do Predador Desgarrado',
      difficulty: 'Médio',
      summary: 'Um réptil da Dobra tem rondado as paliçadas. Elimine a ameaça.',
      briefingDialogue: '"Nossos vigias mal conseguem dormir com os rugidos na escuridão. Vá e traga a carcaça da fera!"',
      completionDialogue: '"A vila está segura mais uma noite graças às suas garras."',
      targetLocation: 'Clareira das Árvores Partidas',
      steps: [
        {
          id: 's1',
          description: 'Aproximar-se em silêncio contra o vento.',
          testRequired: true,
          attribute: 'AGI',
          skill: 'furtividade',
          difficulty: 12
        },
        {
          id: 's2',
          description: 'Combate decisivo contra a fera.',
          combatTrigger: {
            enemyName: 'Raptor Alfa Desgarrado',
            enemyType: 'raptor',
            count: 1
          }
        }
      ],
      reward: {
        xp: 15,
        fluxReward: 4,
        item: {
          name: 'Adaga de Garra Curva',
          type: 'arma',
          bonusDamage: 2,
          description: 'Forjada com a garra da besta abatida.'
        },
        narrativeReward: 'A reputação do aventureiro aumenta em +1 perante os caçadores.'
      }
    });
  }
});

// Vite dev server mounting or static production build serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[LV8 RPG Simulator] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
