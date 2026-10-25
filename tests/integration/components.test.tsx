import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChordDiagram, describeChord } from '../../src/components/ChordDiagram';
import { chordById } from '../../src/content/chords';
import { QuizRunner } from '../../src/features/practice/QuizRunner';
import { StoreProvider } from '../../src/app/store';
import { App } from '../../src/app/App';
import { MemoryStorage } from '../../src/storage/db';
import type { Question } from '../../src/domain/exercises';

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() }) }));

describe('ChordDiagram', () => {
  it('tem uma descrição acessível corda a corda', () => {
    const c = chordById('C')!;
    render(<ChordDiagram chord={c} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName(describeChord(c));
    expect(describeChord(c)).toContain('6.ª corda não se toca');
    expect(describeChord(c)).toContain('5.ª corda casa 3 com o anelar');
  });

  it('descreve a pestana', () => {
    expect(describeChord(chordById('F')!)).toContain('Pestana na casa 1, da 6.ª à 1.ª corda');
  });
});

describe('QuizRunner', () => {
  const q = (id: string, answer: string): Question => ({ id, prompt: `Pergunta ${id}`, visual: { kind: 'none' }, options: ['A', 'B', 'C'], answer, explanation: 'Porque sim, com detalhe.' });

  it('dá feedback e agrega resultados por competência', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<QuizRunner items={[{ question: q('1', 'A'), skillId: 's1' }, { question: q('2', 'B'), skillId: 's2' }]} onFinish={onFinish} />);
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(screen.getByText('Certo!')).toBeInTheDocument();
    // Answers are locked after choosing.
    await user.click(screen.getByRole('button', { name: /^C/ }));
    await user.click(screen.getByRole('button', { name: 'Seguinte' }));
    await user.click(screen.getByRole('button', { name: 'C' }));
    expect(screen.getByText('Não é bem. A resposta é B.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver resultado' }));
    expect(onFinish).toHaveBeenCalledWith(
      [
        { skillId: 's1', correct: 1, total: 1 },
        { skillId: 's2', correct: 0, total: 1 },
      ],
      expect.any(Number),
    );
  });
});

describe('App', () => {
  it('sem armazenamento persistente avisa o utilizador e mostra o onboarding', async () => {
    render(
      <StoreProvider storage={new MemoryStorage()}>
        <App />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Bem-vindo ao Braço' })).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('O progresso perde-se ao fechar a página');
  });

  it('completa o onboarding e mostra o plano adaptado', async () => {
    const user = userEvent.setup();
    const storage = new MemoryStorage();
    render(
      <StoreProvider storage={storage}>
        <App />
      </StoreProvider>,
    );
    await screen.findByRole('heading', { name: 'Bem-vindo ao Braço' });
    await user.click(screen.getByLabelText('Guitarra elétrica'));
    await user.click(screen.getByRole('button', { name: 'Seguinte' }));
    await user.click(screen.getByLabelText(/Já sei alguns acordes/));
    await user.click(screen.getByRole('button', { name: 'Seguinte' }));
    await user.click(screen.getByRole('button', { name: 'Seguinte' }));
    await user.click(screen.getByLabelText('10 min'));
    await user.click(screen.getByRole('button', { name: 'Começar a praticar' }));
    await screen.findByRole('heading', { name: 'Hoje' });
    expect(screen.getByText('Guitarra elétrica · 10 min por sessão')).toBeInTheDocument();
    // "Some experience" starts at module 3.
    expect(screen.getByText(/Módulo 3/)).toBeInTheDocument();
    const saved = await storage.loadAll();
    expect(saved.data.profile?.instrument).toBe('electric');
  });
});
