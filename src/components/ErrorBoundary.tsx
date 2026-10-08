import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; onRetry: () => void; onMenu: () => void }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Game crashed:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950 p-4">
        <div className="hud-panel border-rose-500 p-5 w-[min(380px,92vw)] text-center">
          <div className="text-3xl mb-1">📡</div>
          <div className="text-xl font-black text-rose-300">Signal Lost</div>
          <div className="text-xs text-slate-400 mt-1 mb-4">Something went wrong. Your progress and merits are saved.</div>
          <div className="grid gap-2">
            <button className="menu-btn bg-sky-600" onClick={() => { this.setState({ error: null }); this.props.onRetry(); }}>↻ Retry Mission</button>
            <button className="menu-btn bg-slate-700" onClick={() => { this.setState({ error: null }); this.props.onMenu(); }}>Menu</button>
          </div>
        </div>
      </div>
    );
  }
}
