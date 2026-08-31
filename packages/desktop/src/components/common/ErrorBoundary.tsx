import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-[#0d0e14] text-[#e2e8f0] select-none text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-[#f43f5e] border border-red-500/30 flex items-center justify-center shadow-lg">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-sm font-bold text-white">
              {this.props.fallbackTitle || 'Произошла непредвиденная ошибка'}
            </h3>
            <p className="text-xs text-[#94a3b8]">
              {this.state.error?.message || 'Интерфейс был безопасно изолирован для предотвращения сбоя.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-[#8b5cf6] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#8b5cf6]/90 transition-all shadow-lg shadow-purple-500/20"
          >
            <RotateCcw size={14} />
            <span>Перезагрузить блок</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
