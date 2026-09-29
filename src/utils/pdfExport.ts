import { jsPDF } from 'jspdf';
import { CharacterSheet, RulesConfig } from '../types/lv8';

export function exportCharacterToPDF(character: CharacterSheet, rulesConfig: RulesConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Title banner
  doc.setFillColor(24, 24, 27); // Dark gray / black
  doc.rect(margin, y, pageWidth - margin * 2, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PLANILHA DE PERSONAGEM — SISTEMA LV8', pageWidth / 2, y + 8, { align: 'center' });
  y += 16;

  // Basic Information Box
  doc.setDrawColor(63, 63, 70);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nome: `, margin + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${character.name || 'Sem Nome'}`, margin + 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`Jogador: `, margin + 70, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${character.player || 'Jogador'}`, margin + 86, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`Gênero: `, margin + 130, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${character.gender || '—'}`, margin + 146, y + 6);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text(`Raça: `, margin + 3, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${character.race || 'Felino'} (${character.raceEco || 'Eco da Sombra'})`, margin + 15, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text(`Classe: `, margin + 95, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${character.className || 'Ladino'} (${character.classFluxo || 'Fluxo da Sombra'})`, margin + 110, y + 13);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text(`Conceito: `, margin + 3, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${character.concept || 'Guerreiro da Dobra'}`, margin + 20, y + 20);

  y += 30;

  // Resources Grid (HP, Fluxo, Fadiga, Sanidade, Aura, Deslocamento)
  doc.setFillColor(224, 231, 255);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('RECURSOS & RESERVAS VITAIS', margin + 3, y + 4.5);
  y += 8;

  const boxW = (pageWidth - margin * 2 - 10) / 3;
  const boxH = 15;

  const perVal = character.attributes['PER'] || 1;
  const vigVal = character.skills['vigilancia'] || 0;
  const initBonus = vigVal * 3;
  const initFAStr = `${perVal}d6+${initBonus}`;

  const resourcesList = [
    { label: 'Vida / HP', current: character.hpCurrent, max: character.hpMax, formula: '10 + (VIG × 5)' },
    { label: 'Fluxo Mágico', current: character.fluxoCurrent, max: character.fluxoMax, formula: '10 + (INS/ESS × 5)' },
    { label: 'Iniciativa LV8', current: `FA ${initFAStr}`, max: 'Turno', formula: 'PER (d6) + (Vig × 3)' },
    { label: 'Deslocamento', current: `${character.deslocamento} m`, max: 'Ação Menor', formula: 'AGI × 3m' },
    { label: 'Sanidade', current: character.sanidadeCurrent ?? 25, max: character.sanidadeMax ?? 25, formula: '10 + (VON × 5)' },
    { label: 'Fadiga', current: character.fadigaCurrent ?? 25, max: character.fadigaMax ?? 25, formula: '10 + (FOR × 5)' },
  ];

  for (let i = 0; i < resourcesList.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const rx = margin + col * (boxW + 5);
    const ry = y + row * (boxH + 3);

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(rx, ry, boxW, boxH, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(resourcesList[i].label, rx + 3, ry + 4);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const valText = typeof resourcesList[i].current === 'number'
      ? `${resourcesList[i].current} / ${resourcesList[i].max}`
      : `${resourcesList[i].current}`;
    doc.text(valText, rx + 3, ry + 10);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(resourcesList[i].formula, rx + 3, ry + 13.5);
  }
  y += boxH * 2 + 8;

  // Attributes Row (8 Attributes: FOR, AGI, VIG, INT, VON, PRE, INS/ESS, PER)
  doc.setFillColor(254, 243, 199);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(120, 53, 15);
  doc.text('ATRIBUTOS PRIMAIS (1 a 10 d6)', margin + 3, y + 4.5);
  y += 8;

  const attrKeys = rulesConfig.attributes.map((a) => a.key);
  const attrBoxW = (pageWidth - margin * 2 - (attrKeys.length - 1) * 2) / attrKeys.length;
  const attrBoxH = 14;

  for (let i = 0; i < attrKeys.length; i++) {
    const k = attrKeys[i];
    const val = character.attributes[k] || 1;
    const ax = margin + i * (attrBoxW + 2);

    doc.setDrawColor(217, 119, 6);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(ax, y, attrBoxW, attrBoxH, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(k, ax + attrBoxW / 2, y + 4.5, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), ax + attrBoxW / 2, y + 11.5, { align: 'center' });
  }
  y += attrBoxH + 5;

  // Two Columns: Left = Skills (Perícias), Right = Aspects & Powers
  const colW = (pageWidth - margin * 2 - 6) / 2;

  // Skills Column
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, colW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('PERÍCIAS & TREINAMENTO', margin + 3, y + 4.5);

  // Powers Column Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + colW + 6, y, colW, 6, 'F');
  doc.text('PODERES DE FLUXO & ASPECTOS', margin + colW + 9, y + 4.5);
  y += 8;

  const startColY = y;

  // Render Skills
  let skillY = startColY;
  doc.setFontSize(8);
  rulesConfig.skills.forEach((sk) => {
    const val = character.skills[sk.id] || 0;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`${sk.name} (${sk.primaryAttribute}):`, margin + 3, skillY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const attrVal = character.attributes[sk.primaryAttribute] || 1;
    const bonus = sk.id === 'vigilancia' ? (val * 3) : (val * 2);
    const faText = bonus > 0 ? `FA: ${attrVal}d6+${bonus}` : `FA: ${attrVal}d6`;
    doc.text(`${val}  (${faText})`, margin + colW - 3, skillY, { align: 'right' });
    skillY += 4.5;
  });

  // Render Aspects and Powers in Right Column
  let rightY = startColY;
  const rightX = margin + colW + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Aspectos (Fate Core / LV8):', rightX + 2, rightY);
  rightY += 4.5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Conceito: ${character.concept || '—'}`, rightX + 2, rightY);
  rightY += 4;
  doc.text(`• Problema: ${character.trouble || '—'}`, rightX + 2, rightY);
  rightY += 4;
  (character.aspects || []).forEach((asp) => {
    doc.text(`• ${asp}`, rightX + 2, rightY);
    rightY += 4;
  });

  rightY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Poderes Âncora & Ancestrais:', rightX + 2, rightY);
  rightY += 4.5;

  (character.powers || []).slice(0, 5).forEach((p) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${p.name} [Esc ${p.escala}, Dif ${p.dificuldade}, Custo ${p.custoFluxo}]`, rightX + 2, rightY);
    rightY += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(p.descricao, colW - 4);
    doc.text(splitDesc, rightX + 4, rightY);
    rightY += splitDesc.length * 3 + 2;
  });

  const nextY = Math.max(skillY, rightY) + 4;

  // Equipment / Inventory Box
  if (nextY < pageHeight - 35) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, nextY, pageWidth - margin * 2, pageHeight - nextY - margin, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('EQUIPAMENTOS, BUTIM & ANOTAÇÕES', margin + 3, nextY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    let invY = nextY + 10;
    const invList = (character.inventory || []).map(
      (item) => `${item.name} (${item.type}${item.bonusDamage ? ` +${item.bonusDamage} dano` : ''}${item.armorReduction ? ` -${item.armorReduction} red.` : ''}): ${item.description}`
    );
    invList.slice(0, 4).forEach((itemStr) => {
      doc.text(`• ${itemStr}`, margin + 4, invY);
      invY += 4;
    });

    if (character.notes) {
      doc.text(`Anotações: ${character.notes.slice(0, 150)}...`, margin + 4, invY + 2);
    }
  }

  // Save the PDF
  const filename = `${character.name.replace(/\s+/g, '_') || 'Personagem'}_LV8_Ficha.pdf`;
  doc.save(filename);
}
