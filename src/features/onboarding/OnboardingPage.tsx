import { useStore } from '../../app/store';
import { navigate } from '../../app/router';
import { Page } from '../../components/Page';
import { ProfileForm } from './ProfileForm';

export function OnboardingPage() {
  const { saveProfile } = useStore();
  return (
    <Page title="Bem-vindo ao Chords Dominator" subtitle="Quatro perguntas rápidas para adaptar as lições e o plano de estudo. Não precisas de criar conta: tudo fica guardado só neste dispositivo.">
      <section className="welcome" aria-label="O que vais encontrar">
        <p className="welcome__tagline">Domina os acordes, um dia de cada vez.</p>
        <ul className="welcome__points">
          <li>Um plano curto para cada dia</li>
          <li>Afinador, metrónomo e batidas</li>
          <li>Músicas para tocar junto</li>
        </ul>
      </section>
      <ProfileForm
        mode="wizard"
        onSubmit={async (draft) => {
          const ok = await saveProfile(draft);
          if (ok) navigate('/');
          return ok;
        }}
      />
    </Page>
  );
}
