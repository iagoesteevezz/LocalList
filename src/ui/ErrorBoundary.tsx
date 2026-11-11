// Si algo falla al pintar la app, en vez de una pantalla en blanco se muestra
// un mensaje con un botón para recargar. Los datos están a salvo en el móvil
// (caché de Firestore), así que recargar no pierde nada.
// Tiene que ser una clase: React no ofrece todavía esto con hooks.

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Error de la app', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="welcome" role="alert">
        <div className="welcome__inner">
          <div className="welcome__brand">
            <h1>Algo ha fallado</h1>
            <p>La lista está a salvo. Vuelve a abrir la app para seguir.</p>
          </div>
          <button type="button" className="btn btn--block" onClick={() => location.reload()}>
            Volver a abrir
          </button>
        </div>
      </main>
    );
  }
}
