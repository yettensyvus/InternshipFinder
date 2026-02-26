import { Button } from '@ui/atoms';

export default function ConfirmModal({
  open,
  title,
  description,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirming = false,
  variant = 'danger',
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!confirming) onCancel?.();
        }}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
          <div className="text-lg font-semibold text-white">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-white/80">{description}</div>
          ) : null}
        </div>

        <div className="p-6">
          {body ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">{body}</div>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={confirming}
              onClick={onCancel}
              className="rounded-xl"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              loading={confirming}
              onClick={onConfirm}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
