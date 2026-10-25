import type { Experience, Genre, Goal, Instrument } from '../storage/schema';

export const INSTRUMENT_LABEL: Record<Instrument, string> = {
  electric: 'Guitarra elétrica',
  acoustic: 'Guitarra acústica',
  'steel-violao': 'Violão de cordas de aço',
  classical: 'Violão clássico (nylon)',
};

export const EXPERIENCE_LABEL: Record<Experience, { title: string; hint: string }> = {
  none: { title: 'Nunca toquei', hint: 'Começas pelo módulo 1.' },
  some: { title: 'Já sei alguns acordes', hint: 'Os módulos 1 e 2 ficam opcionais.' },
  intermediate: { title: 'Toco com alguma regularidade', hint: 'Começas pela teoria aplicada (módulo 6).' },
};

export const GOAL_LABEL: Record<Goal, string> = {
  'chords-songs': 'Acompanhar canções com acordes',
  'melody-riffs': 'Tocar melodias e riffs',
  fingerstyle: 'Dedilhado (fingerstyle)',
  'theory-ear': 'Perceber teoria e treinar o ouvido',
};

export const GENRE_LABEL: Record<Genre, string> = {
  pop: 'Pop',
  rock: 'Rock',
  folk: 'Folk / acústico',
  blues: 'Blues',
  'mpb-bossa': 'MPB / bossa nova',
  'fado-tradicional': 'Fado / tradicional',
  classica: 'Clássica',
  outro: 'Outro',
};

export const SESSION_OPTIONS = [10, 15, 20, 30, 45, 60] as const;
