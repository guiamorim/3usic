import { useStore } from '../../app/store';
import { navigate } from '../../app/router';
import { Page } from '../../components/Page';
import { ProfileForm } from './ProfileForm';

export function OnboardingPage() {
  const { saveProfile } = useStore();
  return (
    <Page title="Bem-vindo ao Chords Dominator" subtitle="Quatro perguntas rápidas para adaptar as lições e o plano de estudo. Não precisas de criar conta: tudo fica guardado só neste dispositivo.">
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
