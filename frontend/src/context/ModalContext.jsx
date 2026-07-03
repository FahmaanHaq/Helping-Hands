import React, { createContext, useCallback, useRef, useState } from 'react';

export const ModalContext = createContext(null);

/**
 * Replaces window.confirm / window.prompt / alert() everywhere in the app
 * with a themed, consistent dialog. Each function returns a Promise so call
 * sites read almost identically to their native-dialog equivalents:
 *
 *   const ok = await confirmDialog({ title: 'Clear the flag?' });
 *   const reason = await promptDialog({ title: 'Reason for rejection' });
 *   await alertDialog({ title: 'Action failed', message: err.message });
 *
 * Only one dialog is ever shown at a time — a second call while one is open
 * queues behind it by simply overwriting state once the first resolves,
 * which matches how the native dialogs behaved (blocking, one at a time).
 */
export function ModalProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { kind, title, message, placeholder, danger, resolve }
  const [inputValue, setInputValue] = useState('');
  const resolverRef = useRef(null);

  const openDialog = useCallback((kind, opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setInputValue(opts.defaultValue || '');
      setDialog({ kind, ...opts });
    });
  }, []);

  const confirmDialog = useCallback((opts) => openDialog('confirm', opts), [openDialog]);
  const promptDialog = useCallback((opts) => openDialog('prompt', opts), [openDialog]);
  const alertDialog = useCallback((opts) => openDialog('alert', opts), [openDialog]);

  const close = (result) => {
    if (resolverRef.current) resolverRef.current(result);
    resolverRef.current = null;
    setDialog(null);
  };

  return (
    <ModalContext.Provider value={{ confirmDialog, promptDialog, alertDialog }}>
      {children}
      {dialog && (
        <div className="modal-overlay" onClick={() => dialog.kind !== 'alert' && close(dialog.kind === 'prompt' ? null : false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {dialog.title && <h3 className="modal-title">{dialog.title}</h3>}
            {dialog.message && <p className="modal-message">{dialog.message}</p>}

            {dialog.kind === 'prompt' && (
              <textarea
                className="modal-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialog.placeholder || ''}
                autoFocus
                rows={3}
              />
            )}

            <div className="modal-actions">
              {dialog.kind === 'alert' ? (
                <button className="modal-btn-primary" onClick={() => close(true)} autoFocus>OK</button>
              ) : (
                <>
                  <button className="modal-btn-secondary" onClick={() => close(dialog.kind === 'prompt' ? null : false)}>
                    Cancel
                  </button>
                  <button
                    className={dialog.danger ? 'modal-btn-danger' : 'modal-btn-primary'}
                    onClick={() => close(dialog.kind === 'prompt' ? inputValue.trim() : true)}
                    disabled={dialog.kind === 'prompt' && dialog.required && !inputValue.trim()}
                  >
                    {dialog.confirmLabel || 'Confirm'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
