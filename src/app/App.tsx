import { lazy, Suspense, type ReactNode } from 'react';
import { useStore } from './store';
import { useRoute } from './router';
import { Layout } from './Layout';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CurriculumPage } from '../features/curriculum/CurriculumPage';
import { LessonPage } from '../features/curriculum/LessonPage';
import { PracticePage } from '../features/practice/PracticePage';
import { ExercisePage } from '../features/practice/ExercisePage';
import { ChordsPage } from '../features/chords/ChordsPage';
import { ChordDetailPage } from '../features/chords/ChordDetailPage';
import { MetronomePage } from '../features/metronome/MetronomePage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { ToolsPage } from '../features/settings/ToolsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { DataPage } from '../features/settings/DataPage';
import { SongsPage } from '../features/songs/SongsPage';
import { SongDetailPage } from '../features/songs/SongDetailPage';
import { SongImportPage } from '../features/songs/SongImportPage';
import { Page } from '../components/Page';

// The tuner pulls in the pitch detector; load it on demand.
const TunerPage = lazy(() => import('../features/tuner/TunerPage').then((m) => ({ default: m.TunerPage })));

function NotFound() {
  return (
    <Page title="Página não encontrada">
      <p>
        Esta página não existe. <a href="#/">Voltar ao início</a>.
      </p>
    </Page>
  );
}

function route(segments: string[]): ReactNode {
  const [section = '', id, arg] = segments;
  switch (section) {
    case '':
      return <DashboardPage />;
    case 'aprender':
      return id ? <LessonPage key={id} lessonId={id} /> : <CurriculumPage />;
    case 'praticar':
      return id ? <ExercisePage key={`${id}/${arg ?? ''}`} exerciseId={id} arg={arg} /> : <PracticePage />;
    case 'musicas':
      if (id === 'importar') return <SongImportPage />;
      return id ? <SongDetailPage key={id} songId={id} /> : <SongsPage />;
    case 'acordes':
      return id ? <ChordDetailPage key={id} chordId={id} /> : <ChordsPage />;
    case 'afinador':
      return (
        <Suspense fallback={<p>A carregar o afinador…</p>}>
          <TunerPage />
        </Suspense>
      );
    case 'metronomo':
      return <MetronomePage />;
    case 'progresso':
      return <ProgressPage />;
    case 'ferramentas':
      return <ToolsPage />;
    case 'definicoes':
      return <SettingsPage />;
    case 'dados':
    case 'privacidade':
      return <DataPage />;
    default:
      return <NotFound />;
  }
}

export function App() {
  const { status, data, storageKind, invalidRecords, saveError, dismissSaveError } = useStore();
  const segments = useRoute();
  const section = segments[0] ?? '';

  if (status === 'loading') {
    return (
      <div className="loading" role="status">
        A carregar…
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="loading" role="alert">
        <p>Não foi possível abrir o armazenamento local. Recarrega a página; se o problema persistir, verifica se o navegador permite guardar dados neste site.</p>
      </div>
    );
  }

  const banner = (
    <>
      {storageKind === 'memory' && (
        <p className="banner banner--error" role="alert">
          Este navegador não permite guardar dados (por exemplo, em navegação privada). O progresso perde-se ao fechar a página — exporta-o antes de sair.
        </p>
      )}
      {invalidRecords > 0 && (
        <p className="banner banner--warn" role="status">
          {invalidRecords} registo(s) guardado(s) estão corrompidos e foram ignorados. Não foram apagados.
        </p>
      )}
      {saveError && (
        <p className="banner banner--error" role="alert">
          {saveError}{' '}
          <button type="button" className="btn btn--small btn--ghost" onClick={dismissSaveError}>
            Fechar
          </button>
        </p>
      )}
    </>
  );

  // Without a profile only onboarding, data import and privacy pages are reachable.
  const needsOnboarding = !data.profile && !['dados', 'privacidade'].includes(section);
  return (
    <Layout section={needsOnboarding ? 'onboarding' : section} banner={banner} hideNav={needsOnboarding}>
      {needsOnboarding ? (
        <>
          <OnboardingPage />
          <p className="hint center">
            Já tens uma cópia dos teus dados? <a href="#/dados">Importar ficheiro</a>
          </p>
        </>
      ) : (
        route(segments)
      )}
    </Layout>
  );
}
