import { lazy, Suspense, type ReactNode } from 'react';
import { useStore } from './store';
import { useRoute } from './router';
import { Layout } from './Layout';
import { useWakeLock } from './wakeLock';
import { PlanBar } from './PlanBar';
import { usePersistentStorage } from './persistStorage';
import { ErrorBoundary } from './ErrorBoundary';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { Page } from '../components/Page';

// Every screen but the home page loads on demand: the first paint only needs the dashboard
// (and onboarding), and the service worker precaches the rest for offline use.
const CurriculumPage = lazy(() =>
  import('../features/curriculum/CurriculumPage').then((m) => ({
    default: m.CurriculumPage,
  })),
);
const LessonPage = lazy(() =>
  import('../features/curriculum/LessonPage').then((m) => ({
    default: m.LessonPage,
  })),
);
const PracticePage = lazy(() =>
  import('../features/practice/PracticePage').then((m) => ({
    default: m.PracticePage,
  })),
);
const ExercisePage = lazy(() =>
  import('../features/practice/ExercisePage').then((m) => ({
    default: m.ExercisePage,
  })),
);
const ChordsPage = lazy(() =>
  import('../features/chords/ChordsPage').then((m) => ({
    default: m.ChordsPage,
  })),
);
const ChordDetailPage = lazy(() =>
  import('../features/chords/ChordDetailPage').then((m) => ({
    default: m.ChordDetailPage,
  })),
);
const MetronomePage = lazy(() =>
  import('../features/metronome/MetronomePage').then((m) => ({
    default: m.MetronomePage,
  })),
);
const ProgressPage = lazy(() =>
  import('../features/progress/ProgressPage').then((m) => ({
    default: m.ProgressPage,
  })),
);
const ToolsPage = lazy(() =>
  import('../features/settings/ToolsPage').then((m) => ({
    default: m.ToolsPage,
  })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  })),
);
const DataPage = lazy(() =>
  import('../features/settings/DataPage').then((m) => ({
    default: m.DataPage,
  })),
);
const SongsPage = lazy(() => import('../features/songs/SongsPage').then((m) => ({ default: m.SongsPage })));
const SongDetailPage = lazy(() =>
  import('../features/songs/SongDetailPage').then((m) => ({
    default: m.SongDetailPage,
  })),
);
const SongImportPage = lazy(() =>
  import('../features/songs/SongImportPage').then((m) => ({
    default: m.SongImportPage,
  })),
);
const PlayAlongPage = lazy(() =>
  import('../features/songs/PlayAlongPage').then((m) => ({
    default: m.PlayAlongPage,
  })),
);
const StrumsPage = lazy(() =>
  import('../features/strums/StrumsPage').then((m) => ({
    default: m.StrumsPage,
  })),
);
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
      if (id && arg === 'tocar') return <PlayAlongPage key={`${id}/tocar`} songId={id} />;
      return id ? <SongDetailPage key={id} songId={id} /> : <SongsPage />;
    case 'batidas':
      return <StrumsPage key={id ?? ''} patternId={id} />;
    case 'acordes':
      return id ? <ChordDetailPage key={id} chordId={id} /> : <ChordsPage />;
    case 'afinador':
      return <TunerPage />;
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
  const { status, data, storageKind, invalidRecords, saveError, dismissSaveError, settings, saveSettings } = useStore();
  const keepAwake = settings.keepAwake ?? false;
  const wake = useWakeLock(keepAwake);
  usePersistentStorage(status === 'ready' && !!data.profile);
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
    <Layout
      section={needsOnboarding ? 'onboarding' : section}
      banner={banner}
      hideNav={needsOnboarding}
      awake={{
        enabled: keepAwake,
        state: wake,
        toggle: () => void saveSettings({ keepAwake: !keepAwake }),
      }}
    >
      {needsOnboarding ? (
        <>
          <OnboardingPage />
          <p className="hint center">
            Já tens uma cópia dos teus dados? <a href="#/dados">Importar ficheiro</a>
          </p>
        </>
      ) : (
        <>
          {/* Keyed by route: navigating away from a crashed screen recovers. */}
          <ErrorBoundary key={segments.join('/')}>
            <Suspense
              fallback={
                <p className="loading" role="status">
                  A carregar…
                </p>
              }
            >
              {route(segments)}
            </Suspense>
          </ErrorBoundary>
          {section !== '' && <PlanBar />}
        </>
      )}
    </Layout>
  );
}
