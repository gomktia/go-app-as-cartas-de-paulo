
import { Product, PlanTier, Chapter } from './types';
import React from 'react';
import { BookOpen, Headphones, Lock, Crown, Zap, Shield, Heart, FileText, PlayCircle } from 'lucide-react';

export const DEFAULT_COVER_IMAGE = "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop";

export const PRODUCTS: Product[] = [
  // --- MÓDULO 1: As Cartas de Paulo (13 Cartas) ---
  {
    id: 'letter-romanos',
    title: 'Romanos',
    subtitle: 'A Justiça de Deus',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Um pergaminho antigo sobre uma mesa de madeira, iluminado por velas, representando a fundação da fé cristã em Roma Antiga.',
    imageUrl: 'https://picsum.photos/id/1018/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-1corintios',
    title: '1 Coríntios',
    subtitle: 'A Igreja e seus Desafios',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Uma cruz grega antiga em meio a ruínas de Corinto, simbolizando a unidade da igreja em meio aos conflitos.',
    imageUrl: 'https://picsum.photos/id/1015/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-2corintios',
    title: '2 Coríntios',
    subtitle: 'O Ministério da Reconciliação',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Mãos estendidas em reconciliação, com luz divina atravessando nuvens de tempestade, simbolizando o poder na fraqueza.',
    imageUrl: 'https://picsum.photos/id/1016/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-galatas',
    title: 'Gálatas',
    subtitle: 'A Liberdade em Cristo',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Correntes quebradas ao chão com uma luz brilhante ao fundo, representando a liberdade da lei através da graça.',
    imageUrl: 'https://picsum.photos/id/1019/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-efesios',
    title: 'Efésios',
    subtitle: 'A Riqueza da Graça',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Uma armadura romana antiga (capacete, escudo, espada) descansando, simbolizando a armadura de Deus.',
    imageUrl: 'https://picsum.photos/id/1020/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-filipenses',
    title: 'Filipenses',
    subtitle: 'A Alegria na Prisão',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Um raio de luz entrando por uma pequena janela de uma cela de prisão antiga, iluminando uma carta manuscrita.',
    imageUrl: 'https://picsum.photos/id/1021/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-colossenses',
    title: 'Colossenses',
    subtitle: 'A Supremacia de Cristo',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Uma coroa real dourada sobre um mapa antigo do mundo, simbolizando a supremacia de Cristo sobre toda a criação.',
    imageUrl: 'https://picsum.photos/id/1022/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-1tessalonicenses',
    title: '1 Tessalonicenses',
    subtitle: 'A Volta de Jesus',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'O céu se abrindo com trombetas douradas surgindo entre as nuvens, anunciando o retorno do Rei.',
    imageUrl: 'https://picsum.photos/id/1023/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-2tessalonicenses',
    title: '2 Tessalonicenses',
    subtitle: 'O Dia do Senhor',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Uma balança de justiça antiga equilibrada com fogo e luz, representando o julgamento final e a perseverança.',
    imageUrl: 'https://picsum.photos/id/1024/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-1timoteo',
    title: '1 Timóteo',
    subtitle: 'Liderança na Igreja',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Um báculo de pastor (cajado) de madeira apoiado em um púlpito antigo, simbolizando o cuidado pastoral.',
    imageUrl: 'https://picsum.photos/id/1025/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-2timoteo',
    title: '2 Timóteo',
    subtitle: 'O Legado Final',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Uma tocha acesa sendo passada de uma mão para outra, simbolizando a transmissão do legado e da fé.',
    imageUrl: 'https://picsum.photos/id/1026/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-tito',
    title: 'Tito',
    subtitle: 'A Sã Doutrina',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Uma âncora firme em meio a um mar agitado, representando a firmeza da doutrina e da fé verdadeira.',
    imageUrl: 'https://picsum.photos/id/1027/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },
  {
    id: 'letter-filemon',
    title: 'Filemom',
    subtitle: 'O Perdão Cristão',
    category: 'LETTER',
    tier: PlanTier.BASIC,
    description: 'Duas mãos se cumprimentando, uma com algemas quebradas, simbolizando o perdão e a fraternidade em Cristo.',
    imageUrl: 'https://picsum.photos/id/1028/400/600',
    pdfUrl: '#',
    audioUrl: '#'
  },

  // BONUS products removed - using only real products from database

  // --- Arsenal Espiritual (Upsells) ---
  {
    id: 'upsell-uncao',
    title: 'Unção do Leão',
    category: 'UPSELL',
    tier: PlanTier.BASIC,
    isUpsell: true,
    price: 7.90,
    description: 'Um leão majestoso rugindo com força e autoridade, simbolizando coragem profética.',
    imageUrl: 'https://picsum.photos/id/1074/400/600',
    pdfUrl: '#'
  },
  {
    id: 'upsell-apocalipse',
    title: 'Estudo do Apocalipse',
    category: 'UPSELL',
    tier: PlanTier.BASIC,
    isUpsell: true,
    price: 7.90,
    description: 'Os quatro cavaleiros do apocalipse em uma visão dramática e misteriosa.',
    imageUrl: 'https://picsum.photos/id/1069/400/600',
    pdfUrl: '#'
  },
  {
    id: 'upsell-pregador',
    title: 'Pregador Premium',
    category: 'UPSELL',
    tier: PlanTier.BASIC,
    isUpsell: true,
    price: 7.90,
    description: 'Uma bíblia aberta em um púlpito com luz focada, representando a pregação da palavra.',
    imageUrl: 'https://picsum.photos/id/1070/400/600',
    pdfUrl: '#'
  },
  {
    id: 'upsell-mulher',
    title: 'Kit da Mulher Cristã',
    category: 'UPSELL',
    tier: PlanTier.BASIC,
    isUpsell: true,
    price: 7.90,
    description: 'Flores delicadas e um diário de oração, simbolizando sabedoria e feminilidade cristã.',
    imageUrl: 'https://picsum.photos/id/1071/400/600',
    pdfUrl: '#'
  }
];

// Mock chapters removed - using only real chapters from database
export const MOCK_CHAPTERS: Chapter[] = [];

export const ICONS_MAP: Record<string, React.ReactNode> = {
  PDF: <FileText className="w-4 h-4" />,
  AUDIO: <Headphones className="w-4 h-4" />,
  LOCK: <Lock className="w-6 h-6" />,
  PLAY: <PlayCircle className="w-5 h-5" />
};
