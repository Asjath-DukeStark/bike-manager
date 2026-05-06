import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Database, AlertTriangle } from 'lucide-react';
import { Bike } from '../../types';
import { bikes as bikesApi } from '../../lib/api';
import { motion } from 'motion/react';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

type MigrationStatus = 'idle' | 'running' | 'done' | 'error';

export function MigrationScreen({ onComplete, onSkip }: Props) {
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [log, setLog] = useState<string[]>([]);

  const localBikes: Bike[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('bikeManager_bikes') || '[]');
    } catch {
      return [];
    }
  })();

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const runMigration = async () => {
    if (localBikes.length === 0) {
      onComplete();
      return;
    }

    setStatus('running');
    setProgress({ done: 0, total: localBikes.length, failed: 0 });
    setLog([]);

    let failed = 0;

    for (let i = 0; i < localBikes.length; i++) {
      const bike = localBikes[i];
      try {
        await bikesApi.create(bike);
        // If bike was sold, also record the sale
        if (bike.status === 'Sold' && bike.selling) {
          await bikesApi.sell(bike.id, {
            soldDate: bike.selling.soldDate,
            sellingPrice: bike.selling.sellingPrice,
            notes: bike.selling.notes,
            buyer: bike.selling.buyer,
          });
        }
        addLog(`✓ Migrated: ${bike.model} (${bike.bikeNumber || 'no #'})`);
        setProgress(p => ({ ...p, done: p.done + 1 }));
      } catch (err) {
        failed++;
        addLog(`✗ Failed: ${bike.model} — ${err instanceof Error ? err.message : 'unknown error'}`);
        setProgress(p => ({ ...p, done: p.done + 1, failed: p.failed + 1 }));
      }
    }

    if (failed === 0) {
      // Clean up localStorage after successful migration
      localStorage.removeItem('bikeManager_bikes');
      localStorage.removeItem('bikeManager_auth');
      addLog('🧹 Cleared old localStorage data.');
      setStatus('done');
    } else {
      setStatus('error');
    }
  };

  const successCount = progress.done - progress.failed;
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50 w-full max-w-sm"
      >
        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
          <Database size={28} className="text-white" />
        </div>

        <h1 className="text-xl font-bold text-center text-slate-900 mb-2">
          {status === 'done' ? 'Migration Complete!' : 'Migrate Your Data'}
        </h1>

        {status === 'idle' && (
          <>
            <p className="text-sm text-slate-500 text-center mb-2">
              We found <span className="font-bold text-slate-900">{localBikes.length} bike{localBikes.length !== 1 ? 's' : ''}</span> stored locally on this device.
            </p>
            <p className="text-sm text-slate-500 text-center mb-6">
              Migrate them to the cloud so you can access your data from any device.
            </p>
            <button
              onClick={runMigration}
              className="w-full bg-slate-900 text-white font-bold rounded-xl px-4 py-3.5 shadow-sm hover:bg-slate-800 transition-colors mb-3 flex items-center justify-center gap-2"
            >
              Migrate {localBikes.length} Bike{localBikes.length !== 1 ? 's' : ''} <ArrowRight size={18} />
            </button>
            <button
              onClick={onSkip}
              className="w-full text-slate-500 font-semibold text-sm py-2 hover:text-slate-900 transition-colors"
            >
              Skip for now
            </button>
          </>
        )}

        {status === 'running' && (
          <div className="space-y-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-slate-900 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-center text-sm font-semibold text-slate-600">
              {progress.done} / {progress.total} bikes processed
            </p>
            <div className="bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
              {log.map((entry, i) => (
                <p key={i} className="text-xs text-slate-600 font-mono">{entry}</p>
              ))}
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <p className="text-center text-sm text-slate-600">
              Successfully migrated <span className="font-bold text-slate-900">{successCount}</span> bike{successCount !== 1 ? 's' : ''} to the cloud database.
            </p>
            <button
              onClick={onComplete}
              className="w-full bg-slate-900 text-white font-bold rounded-xl px-4 py-3.5 shadow-sm hover:bg-slate-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <AlertTriangle size={48} className="text-amber-500" />
            </div>
            <p className="text-center text-sm text-slate-600">
              {successCount} migrated, <span className="font-bold text-red-500">{progress.failed} failed</span>. Your local data is still intact.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1">
              {log.map((entry, i) => (
                <p key={i} className="text-xs text-slate-600 font-mono">{entry}</p>
              ))}
            </div>
            <button onClick={onComplete} className="w-full bg-slate-900 text-white font-bold rounded-xl px-4 py-3.5 shadow-sm hover:bg-slate-800 transition-colors">
              Continue Anyway
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
