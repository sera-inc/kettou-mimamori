import type { ReactNode } from 'react';
import './Toast.css';
import { ToastContext } from './useToast';
import { type ToastItem, type ToastStore, type ToastVariant, useToastQueue } from './useToastQueue';

/* ステータスは色のみで伝達しない（設計書 §5.2）。バリアントごとに標準アイコンを持つ */
const variantIcons: Record<ToastVariant, ReactNode> = {
  info: (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
      <circle cx='10' cy='10' r='8' stroke='currentColor' strokeWidth='1.6' />
      <circle cx='10' cy='6.4' r='0.9' fill='currentColor' />
      <path d='M10 9.2V13.8' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
    </svg>
  ),
  success: (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
      <circle cx='10' cy='10' r='8' stroke='currentColor' strokeWidth='1.6' />
      <path
        d='M6.4 10.4L9 13L13.8 7.4'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
  warning: (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
      <path
        d='M10 2.8L18 16.6H2L10 2.8Z'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinejoin='round'
      />
      <path d='M10 8V11.6' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
      <circle cx='10' cy='14.2' r='0.9' fill='currentColor' />
    </svg>
  ),
  error: (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
      <circle cx='10' cy='10' r='8' stroke='currentColor' strokeWidth='1.6' />
      <path d='M10 5.8V11' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
      <circle cx='10' cy='14' r='0.9' fill='currentColor' />
    </svg>
  ),
};

type ToastCardProps = {
  toast: ToastItem;
  onDismiss: (id: string) => void;
};

/** トースト1件。白面 + 2px 意味色境界 + 左カラーチップ（notification-banner 派生） */
const ToastCard = ({ toast, onDismiss }: ToastCardProps) => {
  const { action } = toast;
  return (
    <div className='app-toast' data-variant={toast.variant}>
      <span className='app-toast__icon'>{variantIcons[toast.variant]}</span>
      <div className='app-toast__body'>
        <p className='app-toast__title'>{toast.title}</p>
        {toast.description !== undefined && (
          <p className='app-toast__description'>{toast.description}</p>
        )}
        {action !== undefined && (
          <button
            type='button'
            className='app-toast__action'
            onClick={() => {
              action.onClick();
              onDismiss(toast.id);
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type='button'
        className='app-toast__close'
        aria-label='閉じる'
        onClick={() => onDismiss(toast.id)}
      >
        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
          <path
            d='M4 4L12 12M12 4L4 12'
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinecap='round'
          />
        </svg>
      </button>
    </div>
  );
};

type ToastRegionProps = {
  store: ToastStore;
  toasts: ToastItem[];
};

/**
 * 表示領域（内部コンポーネント）。画面右下 fixed。
 * 非エラー用（role="status" / polite）とエラー用（role="alert" / assertive）の
 * 2つのライブリージョンを常設し、hover / focusin で全タイマーを一時停止する。
 */
const ToastRegion = ({ store, toasts }: ToastRegionProps) => (
  // biome-ignore lint/a11y/noNoninteractiveElementInteractions: hover / focusin による全タイマー一時停止（WCAG 2.2「十分な時間」§4.2.3）のためのハンドラ。領域自体は操作対象ではない
  <section
    aria-label='通知'
    className='app-toast-region'
    onMouseEnter={() => store.pause('hover')}
    onMouseLeave={() => store.resume('hover')}
    onFocus={() => store.pause('focus')}
    onBlur={(event) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
        store.resume('focus');
      }
    }}
  >
    <div role='status' aria-live='polite' className='app-toast-region__group'>
      {toasts
        .filter((toast) => toast.variant !== 'error')
        .map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={store.dismiss} />
        ))}
    </div>
    <div role='alert' aria-live='assertive' className='app-toast-region__group'>
      {toasts
        .filter((toast) => toast.variant === 'error')
        .map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={store.dismiss} />
        ))}
    </div>
  </section>
);

export type ToastProviderProps = {
  children?: ReactNode;
};

/**
 * ToastProvider — DADS notification-banner 派生（設計書 §4.2.3）。
 * 配下で useToast() が使えるようにし、表示領域（ToastRegion）を描画する。
 * キュー・タイマーの純ロジックは useToastQueue.ts に分離している。
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const { store, toasts } = useToastQueue();
  return (
    <ToastContext.Provider value={store}>
      {children}
      <ToastRegion store={store} toasts={toasts} />
    </ToastContext.Provider>
  );
};
