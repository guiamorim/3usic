import { beforeEach, describe, expect, it } from 'vitest';
import { clearDraft, loadDraft, saveDraft } from '../../src/storage/quizDraft';

describe('quizDraft', () => {
  beforeEach(() => localStorage.clear());
  it('guarda e recupera no mesmo dia', () => {
    saveDraft('notas', {
      seed: 7,
      day: '2026-10-26',
      answers: [true],
      elapsedSec: 12,
    });
    expect(loadDraft('notas', '2026-10-26')).toEqual({
      seed: 7,
      day: '2026-10-26',
      answers: [true],
      elapsedSec: 12,
    });
    clearDraft('notas');
    expect(loadDraft('notas', '2026-10-26')).toBeNull();
  });
  it('descarta rascunhos de outro dia ou inválidos', () => {
    saveDraft('notas', {
      seed: 7,
      day: '2026-10-25',
      answers: [true],
      elapsedSec: 12,
    });
    expect(loadDraft('notas', '2026-10-26')).toBeNull();
    localStorage.setItem('braco.quiz.x', '{"seed":"x"}');
    expect(loadDraft('x', '2026-10-26')).toBeNull();
  });
});
