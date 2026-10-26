import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useStore } from './store';
import { exportFileName, serializeExport } from '../storage/exportImport';

/** Last-resort screen: offers a way back and a copy of the data, which is never touched. */
function CrashScreen({ onRetry }: { onRetry: () => void }) {
  const { data } = useStore();
  function exportData() {
    const url = URL.createObjectURL(new Blob([serializeExport(data)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="card card--warn" role="alert">
      <h1>Algo correu mal neste ecrã</h1>
      <p>Os teus dados estão intactos: o erro foi só a mostrar esta página. Podes tentar outra vez, voltar ao início ou guardar uma cópia do progresso.</p>
      <div className="button-row">
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Tentar outra vez
        </button>
        <a className="btn btn--secondary" href="#/" onClick={onRetry}>
          Voltar ao início
        </a>
        <button type="button" className="btn btn--ghost" onClick={exportData}>
          Exportar dados
        </button>
      </div>
    </section>
  );
}

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Local only: there is no error reporting service (0 € and no third-party requests).
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.failed) return <CrashScreen onRetry={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
}
