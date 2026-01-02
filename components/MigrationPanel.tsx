import React, { useState } from 'react';
import { migrationService } from '../services/migrationService';
import { Upload, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  errors: Array<{ productId: string; error: string }>;
}

const MigrationPanel: React.FC = () => {
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    current: '',
    status: 'idle',
    errors: []
  });

  const startMigration = async () => {
    if (!confirm('Deseja migrar TODOS os PDFs do Google Drive para o Supabase Storage?\n\nIsso pode levar alguns minutos dependendo da quantidade de arquivos.')) {
      return;
    }

    try {
      await migrationService.migrateAllPDFs((newProgress) => {
        setProgress(newProgress);
      });
    } catch (error) {
      console.error('Migration error:', error);
      alert(`Erro na migração: ${error}`);
    }
  };

  const percentage = progress.total > 0
    ? Math.round(((progress.completed + progress.failed) / progress.total) * 100)
    : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="w-6 h-6 text-brand-500" />
        <div>
          <h3 className="text-white font-bold text-lg">Migração de PDFs</h3>
          <p className="text-zinc-400 text-sm">
            Migrar PDFs do Google Drive para Supabase Storage
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-zinc-400 text-sm font-medium">Status</span>
          {progress.status === 'idle' && (
            <span className="text-zinc-500 text-xs">Aguardando início</span>
          )}
          {progress.status === 'running' && (
            <span className="text-brand-500 text-xs flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Em execução...
            </span>
          )}
          {progress.status === 'completed' && (
            <span className="text-green-500 text-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Concluído
            </span>
          )}
          {progress.status === 'error' && (
            <span className="text-red-500 text-xs flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Erro
            </span>
          )}
        </div>

        {progress.total > 0 && (
          <>
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Progresso</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-zinc-900 rounded p-2 text-center">
                <div className="text-zinc-400 text-xs mb-1">Total</div>
                <div className="text-white font-bold">{progress.total}</div>
              </div>
              <div className="bg-zinc-900 rounded p-2 text-center">
                <div className="text-green-400 text-xs mb-1">Sucesso</div>
                <div className="text-white font-bold">{progress.completed}</div>
              </div>
              <div className="bg-zinc-900 rounded p-2 text-center">
                <div className="text-red-400 text-xs mb-1">Falhas</div>
                <div className="text-white font-bold">{progress.failed}</div>
              </div>
            </div>
          </>
        )}

        {/* Current Status Message */}
        {progress.current && (
          <div className="text-zinc-300 text-sm bg-zinc-900 p-3 rounded border border-zinc-800">
            {progress.current}
          </div>
        )}
      </div>

      {/* Errors List */}
      {progress.errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
            <AlertTriangle className="w-4 h-4" />
            Erros Encontrados ({progress.errors.length})
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {progress.errors.map((err, idx) => (
              <div key={idx} className="text-xs text-red-300 bg-red-950/50 p-2 rounded">
                <span className="font-bold">{err.productId}:</span> {err.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={startMigration}
        disabled={progress.status === 'running'}
        className={`
          w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2
          transition-all transform hover:scale-[1.02]
          ${progress.status === 'running'
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/40'
          }
        `}
      >
        {progress.status === 'running' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Migrando PDFs...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Iniciar Migração
          </>
        )}
      </button>

      {/* Instructions */}
      {progress.status === 'idle' && (
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-blue-400 font-bold text-sm mb-2">📋 Antes de começar:</div>
          <ol className="text-xs text-blue-300 space-y-1 list-decimal list-inside">
            <li>Execute o SQL migration <code className="bg-blue-950/50 px-1 rounded">002_storage_pdfs.sql</code></li>
            <li>Verifique se os produtos têm URLs do Google Drive configuradas</li>
            <li>Tenha paciência - pode levar vários minutos</li>
          </ol>
        </div>
      )}

      {/* Success Message */}
      {progress.status === 'completed' && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="text-green-400 font-bold text-sm mb-2">✅ Migração Concluída!</div>
          <p className="text-xs text-green-300">
            {progress.completed} PDFs migrados com sucesso para o Supabase Storage.
            {progress.failed > 0 && ` ${progress.failed} falhas - verifique os erros acima.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default MigrationPanel;
