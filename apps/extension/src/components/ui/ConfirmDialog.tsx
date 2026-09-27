import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { AlertCircleIcon } from './icons';
import { controlClass } from './control-class';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  /** When set, the user must type this exact text before confirming. */
  requireText?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  children?: ReactNode;
}

/** Modal confirmation built on the native <dialog> element (focus trap + Escape for free). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  requireText,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setTyped('');
      setError('');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const blocked = requireText !== undefined && typed.trim() !== requireText;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] animate-scale-in rounded-xl border border-line p-0 shadow-raised backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="flex gap-4">
          {tone === 'danger' && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AlertCircleIcon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-fg">
              {title}
            </h2>
            <div className="mt-2 text-sm text-muted">{description}</div>
            {children}
            {requireText && (
              <label className="mt-4 block text-sm text-body">
                Type <strong className="font-semibold">{requireText}</strong> to confirm
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className={`${controlClass()} mt-1.5`}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
            )}
            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 rounded-b-2xl border-t border-line bg-subtle px-6 py-4">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={confirm}
          loading={busy}
          disabled={blocked}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
