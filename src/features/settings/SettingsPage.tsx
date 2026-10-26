import { useStore } from '../../app/store';
import { Page } from '../../components/Page';
import { ProfileForm } from '../onboarding/ProfileForm';

export function SettingsPage() {
  const { data, saveProfile } = useStore();
  const p = data.profile;
  return (
    <Page title="Perfil e preferências" back={{ href: '#/ferramentas', label: 'Mais' }} subtitle="Alterar estas opções ajusta a lição recomendada e o plano de estudo. O progresso mantém-se.">
      {p && (
        <ProfileForm
          mode="edit"
          initial={{
            instrument: p.instrument,
            experience: p.experience,
            goal: p.goal,
            genres: p.genres,
            sessionMinutes: p.sessionMinutes,
            daysPerWeek: p.daysPerWeek,
            a4: p.a4,
          }}
          onSubmit={saveProfile}
        />
      )}
    </Page>
  );
}
