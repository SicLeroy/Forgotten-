import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { pickText, t } from '../i18n/translations';
import { GameState, Language, SaveSlotSummary } from '../types/game';

interface SavesViewProps {
  lang: Language;
  currentState: GameState | null;
  saves: SaveSlotSummary[];
  onSaveCurrent: (label?: string, asNewSlot?: boolean) => Promise<void>;
  onLoadSave: (saveId: string) => Promise<void>;
  onDeleteSave: (saveId: string) => Promise<void>;
}

export const SavesView: React.FC<SavesViewProps> = ({
  lang,
  currentState,
  saves,
  onSaveCurrent,
  onLoadSave,
  onDeleteSave,
}) => {
  const [labelInput, setLabelInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentState) return;
    await onSaveCurrent(labelInput, true);
    setLabelInput('');
    setStatusMessage(t(lang, 'savedToast'));
  };

  const handleQuickSave = async () => {
    if (!currentState) return;
    await onSaveCurrent(labelInput, false);
    setStatusMessage(t(lang, 'savedToast'));
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <h1 className="font-display text-3xl font-bold text-stone-100 border-b border-stone-800 pb-4">
        {t(lang, 'navSaves')}
      </h1>

      {currentState && (
        <form
          onSubmit={handleSaveNew}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-800 bg-[#171b22] p-4"
        >
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder={t(lang, 'saveLabelPlaceholder')}
            className="flex-1 min-w-[200px] rounded border border-stone-800 bg-[#111317] px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 min-h-[44px] focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleQuickSave}
            className="rounded border border-amber-600/60 bg-amber-950/40 px-4 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/50 transition-colors min-h-[44px] whitespace-nowrap"
          >
            {t(lang, 'saveOverwriteAction')}
          </button>
          <button
            type="submit"
            className="rounded bg-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-500 transition-colors min-h-[44px] whitespace-nowrap"
          >
            {t(lang, 'saveNewSlotAction')}
          </button>
        </form>
      )}

      {statusMessage && (
        <div className="rounded border border-emerald-700/60 bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-200">
          {statusMessage}
        </div>
      )}

      {saves.length === 0 ? (
        <section className="rounded-lg border border-stone-800 bg-[#171b22] p-6 text-sm text-stone-400">
          {t(lang, 'noSaves')}
        </section>
      ) : (
        <section className="space-y-3">
          {saves.map((slot) => {
            const isAuto = slot.saveKind === 'autosave';
            const integrityOk = slot.checksumValid !== false;
            return (
              <article
                key={slot.saveId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-stone-800 bg-[#171b22] p-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-stone-100">{slot.label}</span>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                        isAuto
                          ? 'border-sky-700/60 bg-sky-950/40 text-sky-300'
                          : 'border-amber-700/60 bg-amber-950/40 text-amber-300'
                      }`}
                    >
                      {isAuto ? t(lang, 'autoSaveBadge') : t(lang, 'manualSaveBadge')}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {t(lang, 'saveVersionLabel')}
                      {slot.schemaVersion ?? 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                        integrityOk ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {integrityOk ? (
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                      )}
                      {integrityOk
                        ? t(lang, 'integrityVerifiedLabel')
                        : t(lang, 'integrityWarningLabel')}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 tabular-nums">
                    {pickText(lang, slot.activeHeroName)} · {t(lang, 'roundLabel')} {slot.round} ·{' '}
                    {slot.playerCount} {t(lang, 'playerLabel')} ·{' '}
                    {new Date(slot.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadSave(slot.saveId)}
                    className="rounded border border-amber-500/60 bg-amber-950/40 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-900/50 transition-colors min-h-[40px]"
                  >
                    {t(lang, 'loadSave')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSave(slot.saveId)}
                    className="rounded border border-stone-700 bg-stone-900 px-4 py-2 text-xs font-semibold text-rose-300 hover:border-rose-600/60 transition-colors min-h-[40px]"
                  >
                    {t(lang, 'deleteSave')}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};
