import { useState, useSyncExternalStore } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastShowOptions = {
  variant: ToastVariant;
  title: string;
  description?: string;
  /** 操作を含むトーストは自動消去しない（WCAG 2.2「十分な時間」） */
  action?: ToastAction;
  /** 自動消去までの時間。最短5秒に強制される */
  durationMs?: number;
};

export type ToastItem = ToastShowOptions & { id: string };

/** 自動消去の最短時間（設計書 §4.2.3: 最短5秒） */
export const TOAST_MIN_DURATION_MS = 5000;
/** 同時表示の最大件数。超過分は FIFO でキューイングする */
export const TOAST_MAX_VISIBLE = 3;

/** タイマー一時停止の理由。全理由が解除されるまで再開しない */
export type ToastPauseReason = 'hover' | 'focus';

type ToastEntry = {
  item: ToastItem;
  /** 残り時間。null は自動消去しない（action 付き） */
  remainingMs: number | null;
  timerId: ReturnType<typeof setTimeout> | null;
  expiresAt: number | null;
};

export type ToastStore = {
  show: (options: ToastShowOptions) => string;
  dismiss: (id: string) => void;
  pause: (reason: ToastPauseReason) => void;
  resume: (reason: ToastPauseReason) => void;
  subscribe: (listener: () => void) => () => void;
  getToasts: () => ToastItem[];
};

/**
 * Toast のキュー・タイマー管理（純ロジック / React 非依存）。
 * - 同時表示は最大 TOAST_MAX_VISIBLE 件。超過分は FIFO でキューイング。
 * - 自動消去は最短 TOAST_MIN_DURATION_MS。action 付きは自動消去しない。
 * - pause/resume は理由（hover / focus）の集合で管理し、残り時間を保持する。
 */
export const createToastStore = (): ToastStore => {
  const visible: ToastEntry[] = [];
  const queued: ToastEntry[] = [];
  const listeners = new Set<() => void>();
  const pauseReasons = new Set<ToastPauseReason>();
  let snapshot: ToastItem[] = [];
  let seq = 0;

  const notify = () => {
    snapshot = visible.map((entry) => entry.item);
    for (const listener of listeners) listener();
  };

  const startTimer = (entry: ToastEntry) => {
    if (entry.remainingMs === null || entry.timerId !== null || pauseReasons.size > 0) return;
    entry.expiresAt = Date.now() + entry.remainingMs;
    entry.timerId = setTimeout(() => dismiss(entry.item.id), entry.remainingMs);
  };

  const stopTimer = (entry: ToastEntry) => {
    if (entry.timerId === null) return;
    clearTimeout(entry.timerId);
    entry.timerId = null;
    if (entry.expiresAt !== null) {
      entry.remainingMs = Math.max(0, entry.expiresAt - Date.now());
      entry.expiresAt = null;
    }
  };

  const show = (options: ToastShowOptions): string => {
    seq += 1;
    const id = `app-toast-${seq}`;
    const entry: ToastEntry = {
      item: { ...options, id },
      remainingMs: options.action
        ? null
        : Math.max(TOAST_MIN_DURATION_MS, options.durationMs ?? TOAST_MIN_DURATION_MS),
      timerId: null,
      expiresAt: null,
    };
    if (visible.length < TOAST_MAX_VISIBLE) {
      visible.push(entry);
      startTimer(entry);
    } else {
      queued.push(entry);
    }
    notify();
    return id;
  };

  function dismiss(id: string): void {
    const visibleIndex = visible.findIndex((entry) => entry.item.id === id);
    if (visibleIndex >= 0) {
      stopTimer(visible[visibleIndex]);
      visible.splice(visibleIndex, 1);
      while (visible.length < TOAST_MAX_VISIBLE) {
        const next = queued.shift();
        if (!next) break;
        visible.push(next);
        startTimer(next);
      }
      notify();
      return;
    }
    const queuedIndex = queued.findIndex((entry) => entry.item.id === id);
    if (queuedIndex >= 0) {
      queued.splice(queuedIndex, 1);
      notify();
    }
  }

  const pause = (reason: ToastPauseReason) => {
    pauseReasons.add(reason);
    for (const entry of visible) stopTimer(entry);
  };

  const resume = (reason: ToastPauseReason) => {
    pauseReasons.delete(reason);
    if (pauseReasons.size > 0) return;
    for (const entry of visible) startTimer(entry);
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getToasts = () => snapshot;

  return { show, dismiss, pause, resume, subscribe, getToasts };
};

/**
 * ToastProvider 用フック。ストアを1インスタンス生成し、表示中トーストを購読する。
 */
export const useToastQueue = () => {
  const [store] = useState(createToastStore);
  const toasts = useSyncExternalStore(store.subscribe, store.getToasts, store.getToasts);
  return { store, toasts };
};
