import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useStore } from '../../app/store';
import { Page } from '../../components/Page';
import { localDay } from '../../domain/dates';
import { exportFileName, MAX_IMPORT_BYTES, parseImport, serializeExport, type ImportResult } from '../../storage/exportImport';

type Pending = Extract<ImportResult, { ok: true }>;

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

export function DataPage() {
  const { data, storageKind, replaceAll, clearAll, saveSettings } = useStore();
  const [message, setMessage] = useState<{
    kind: 'ok' | 'error';
    text: string;
  } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [estimate, setEstimate] = useState<{
    usage: number;
    quota: number;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = navigator.storage;
    if (!s) return;
    s.persisted?.()
      .then(setPersisted)
      .catch(() => undefined);
    s.estimate?.()
      .then((e) => setEstimate({ usage: e.usage ?? 0, quota: e.quota ?? 0 }))
      .catch(() => undefined);
  }, []);

  function exportData() {
    const blob = new Blob([serializeExport(data)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    void saveSettings({ lastExportDay: localDay() });
    setMessage({
      kind: 'ok',
      text: 'Ficheiro exportado. Guarda-o num local seguro: contém o teu progresso.',
    });
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setPending(null);
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({
        kind: 'error',
        text: 'O ficheiro é demasiado grande (máximo 5 MB).',
      });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage({ kind: 'error', text: 'Não foi possível ler o ficheiro.' });
      return;
    }
    const result = parseImport(text);
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error });
      return;
    }
    setMessage(null);
    setPending(result);
  }

  async function confirmImport() {
    if (!pending) return;
    const ok = await replaceAll(pending.file.data);
    setPending(null);
    setMessage(
      ok
        ? { kind: 'ok', text: 'Dados importados com sucesso.' }
        : {
            kind: 'error',
            text: 'A importação falhou. Os teus dados anteriores não foram alterados.',
          },
    );
  }

  async function deleteAll() {
    const ok = await clearAll();
    setShowDelete(false);
    setConfirmDelete('');
    if (ok) window.location.hash = '#/';
    else setMessage({ kind: 'error', text: 'Não foi possível apagar os dados.' });
  }

  async function requestPersist() {
    try {
      const granted = await navigator.storage?.persist?.();
      setPersisted(!!granted);
      setMessage(
        granted
          ? {
              kind: 'ok',
              text: 'O navegador vai proteger estes dados da limpeza automática.',
            }
          : {
              kind: 'error',
              text: 'O navegador não concedeu armazenamento persistente. Exporta os dados regularmente.',
            },
      );
    } catch {
      setMessage({
        kind: 'error',
        text: 'Este navegador não suporta armazenamento persistente.',
      });
    }
  }

  const minutes = Math.round(data.practice.reduce((s, p) => s + p.seconds, 0) / 60);

  return (
    <Page title="Dados e privacidade" back={{ href: '#/ferramentas', label: 'Mais' }}>
      {message && (
        <p className={`notice notice--${message.kind === 'ok' ? 'success' : 'error'}`} role={message.kind === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      <section className="card">
        <h2>O que está guardado</h2>
        <p>Os teus dados ficam apenas neste navegador, neste dispositivo ({storageKind === 'indexeddb' ? 'IndexedDB' : 'memória temporária'}). Não há contas, servidores nem sincronização.</p>
        <ul>
          <li>Perfil: {data.profile ? 'sim (instrumento, nível, objetivos, disponibilidade)' : 'não'}</li>
          <li>Lições concluídas: {data.lessons.length}</li>
          <li>Resultados de exercícios: {data.attempts.length}</li>
          <li>
            Registos de prática: {data.practice.length} ({minutes} min)
          </li>
          <li>Mudanças de acordes: {data.chordChanges.length}</li>
        </ul>
        {estimate && estimate.quota > 0 && (
          <p className="muted">
            Espaço usado por esta aplicação (inclui ficheiros em cache): {formatBytes(estimate.usage)} de {formatBytes(estimate.quota)} disponíveis.
          </p>
        )}
        <p>Proteção contra limpeza automática: {persisted === null ? 'desconhecida' : persisted ? <strong>ativa</strong> : <strong>não ativa</strong>}</p>
        {persisted === false && (
          <button type="button" className="btn btn--secondary" onClick={() => void requestPersist()}>
            Pedir armazenamento persistente
          </button>
        )}
        <p className="hint">Se limpares os dados de navegação deste site, o progresso perde-se. Exporta uma cópia de vez em quando.</p>
      </section>

      <section className="card">
        <h2>Exportar</h2>
        <p>Descarrega um ficheiro JSON com todo o teu progresso, para cópia de segurança ou para mudar de dispositivo.</p>
        <button type="button" className="btn btn--primary" onClick={exportData}>
          Exportar dados (JSON)
        </button>
      </section>

      <section className="card">
        <h2>Importar</h2>
        <p>Carrega um ficheiro exportado por esta aplicação. O ficheiro é validado antes de qualquer alteração.</p>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={(e) => void onFile(e)} className="visually-hidden" id="import-file" />
        <label htmlFor="import-file" className="btn btn--secondary">
          Escolher ficheiro…
        </label>
        {pending && (
          <div className="confirm" role="group" aria-labelledby="import-confirm-title">
            <h3 id="import-confirm-title">Substituir os dados atuais?</h3>
            <p>
              Ficheiro exportado em {new Date(pending.summary.exportedAt).toLocaleString('pt-PT')}: {pending.summary.lessons} lições concluídas, {pending.summary.attempts} resultados,{' '}
              {pending.summary.practiceMinutes} min de prática, {pending.summary.songs} músicas importadas
              {pending.summary.hasProfile ? ', perfil incluído' : ''}.
            </p>
            <p>
              <strong>Os dados atuais deste dispositivo serão substituídos.</strong> Se quiseres guardá-los, exporta-os primeiro.
            </p>
            <div className="button-row">
              <button type="button" className="btn btn--ghost" onClick={exportData}>
                Exportar dados atuais primeiro
              </button>
              <button type="button" className="btn btn--danger" onClick={() => void confirmImport()}>
                Substituir dados
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setPending(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Apagar todos os dados</h2>
        <p>Remove o perfil e todo o progresso deste dispositivo. Esta ação não pode ser desfeita.</p>
        {!showDelete ? (
          <button type="button" className="btn btn--danger" onClick={() => setShowDelete(true)}>
            Apagar dados…
          </button>
        ) : (
          <div className="confirm">
            <label className="field">
              <span>
                Para confirmar, escreve <strong>APAGAR</strong>
              </span>
              <input value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} autoComplete="off" />
            </label>
            <div className="button-row">
              <button type="button" className="btn btn--danger" disabled={confirmDelete.trim().toUpperCase() !== 'APAGAR'} onClick={() => void deleteAll()}>
                Apagar definitivamente
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmDelete('');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Privacidade</h2>
        <ul>
          <li>Sem conta, sem publicidade, sem analytics e sem cookies de rastreamento.</li>
          <li>A aplicação não faz pedidos a servidores de terceiros; depois de carregada funciona sem internet.</li>
          <li>O microfone só é ativado quando carregas em «Ativar microfone» no afinador. O som é analisado em memória e descartado de imediato; nada é gravado nem enviado.</li>
          <li>Os dados guardados são os mínimos para o funcionamento: preferências e progresso.</li>
        </ul>
        <p className="hint">
          Como os dados nunca saem do dispositivo, o responsável pela aplicação não tem acesso a eles. Se a aplicação for publicada num servidor, o fornecedor de alojamento pode registar dados
          técnicos de acesso (por exemplo, endereço IP) — ver a documentação do projeto. Esta informação não constitui uma avaliação jurídica de conformidade com o RGPD.
        </p>
      </section>
    </Page>
  );
}
