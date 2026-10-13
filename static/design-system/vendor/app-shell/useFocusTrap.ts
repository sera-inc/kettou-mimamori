import { type RefObject, useEffect, useRef } from 'react';

/** フォーカス可能要素のセレクタ（drawer 内の Tab 循環対象） */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** コンテナ内のフォーカス可能要素を DOM 順で列挙する（純ロジック・単体テスト対象） */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export type UseFocusTrapOptions = {
  /** true の間フォーカスをコンテナ内に閉じ込める（drawer 展開中） */
  active: boolean;
  /** Escape キー押下時に呼ばれる（onMobileNavClose を渡す） */
  onEscape?: () => void;
};

/**
 * useFocusTrap — drawer 展開中のフォーカストラップ（設計書 §4.2.1 / §5.2）。
 * - 有効化時: aria-controls の起動ボタン（無ければ activeElement）を記録し、先頭へフォーカス
 * - Tab / Shift+Tab: コンテナ内で循環
 * - Escape: onEscape を呼ぶ（閉じる操作は呼び出し側の状態管理に委ねる）
 * - 無効化・アンマウント時: 起動元へフォーカスを返却
 */
export function useFocusTrap<T extends HTMLElement>({
  active,
  onEscape,
}: UseFocusTrapOptions): RefObject<T> {
  const containerRef = useRef<T>(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Safari/WebKit のポインタ操作はボタンへフォーカスしないため、制御関係から復帰先を選ぶ。
    const trigger = container.id
      ? Array.from(
          container.ownerDocument.querySelectorAll<HTMLButtonElement>('button[aria-controls]'),
        ).find((button) =>
          button.getAttribute('aria-controls')?.split(/\s+/).includes(container.id),
        )
      : undefined;
    const origin =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const initial = getFocusableElements(container);
    if (initial.length > 0) initial[0].focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = getFocusableElements(container);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      origin?.focus();
    };
  }, [active]);

  return containerRef;
}
