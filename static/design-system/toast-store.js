/* Derived without logic changes from DDS useToastQueue.ts; SHA-256 c19b5c9973fedb218f2d7064300e67167326f8a489a12edff36c64dbd4131f32. */
window.KettouToastStore = (()=>{
/** 自動消去の最短時間（設計書 §4.2.3: 最短5秒） */
const TOAST_MIN_DURATION_MS = 5000;
/** 同時表示の最大件数。超過分は FIFO でキューイングする */
const TOAST_MAX_VISIBLE = 3;
/**
 * Toast のキュー・タイマー管理（純ロジック / React 非依存）。
 * - 同時表示は最大 TOAST_MAX_VISIBLE 件。超過分は FIFO でキューイング。
 * - 自動消去は最短 TOAST_MIN_DURATION_MS。action 付きは自動消去しない。
 * - pause/resume は理由（hover / focus）の集合で管理し、残り時間を保持する。
 */
const createToastStore = () => {
    const visible = [];
    const queued = [];
    const listeners = new Set();
    const pauseReasons = new Set();
    let snapshot = [];
    let seq = 0;
    const notify = () => {
        snapshot = visible.map((entry) => entry.item);
        for (const listener of listeners)
            listener();
    };
    const startTimer = (entry) => {
        if (entry.remainingMs === null || entry.timerId !== null || pauseReasons.size > 0)
            return;
        entry.expiresAt = Date.now() + entry.remainingMs;
        entry.timerId = setTimeout(() => dismiss(entry.item.id), entry.remainingMs);
    };
    const stopTimer = (entry) => {
        if (entry.timerId === null)
            return;
        clearTimeout(entry.timerId);
        entry.timerId = null;
        if (entry.expiresAt !== null) {
            entry.remainingMs = Math.max(0, entry.expiresAt - Date.now());
            entry.expiresAt = null;
        }
    };
    const show = (options) => {
        seq += 1;
        const id = `app-toast-${seq}`;
        const entry = {
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
        }
        else {
            queued.push(entry);
        }
        notify();
        return id;
    };
    function dismiss(id) {
        const visibleIndex = visible.findIndex((entry) => entry.item.id === id);
        if (visibleIndex >= 0) {
            stopTimer(visible[visibleIndex]);
            visible.splice(visibleIndex, 1);
            while (visible.length < TOAST_MAX_VISIBLE) {
                const next = queued.shift();
                if (!next)
                    break;
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
    const pause = (reason) => {
        pauseReasons.add(reason);
        for (const entry of visible)
            stopTimer(entry);
    };
    const resume = (reason) => {
        pauseReasons.delete(reason);
        if (pauseReasons.size > 0)
            return;
        for (const entry of visible)
            startTimer(entry);
    };
    const subscribe = (listener) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };
    const getToasts = () => snapshot;
    return { show, dismiss, pause, resume, subscribe, getToasts };
};

return { createToastStore, TOAST_MIN_DURATION_MS, TOAST_MAX_VISIBLE };
})();
