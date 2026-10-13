import { type MutableRefObject, useCallback, useEffect, useRef } from 'react';

export type UseDisclosureOptions = {
  /** 現在の開閉状態（controlled） */
  open: boolean;
  /** 開閉状態の変更要求 */
  onOpenChange: (open: boolean) => void;
  /** 特化コンポーネント（DropdownMenu 等）とトリガー参照を共有する場合に注入する */
  triggerRef?: MutableRefObject<HTMLElement | null>;
};

/**
 * Popover 系の開閉ロジック（設計書 §4.1-9 / DADS menu-list-box 派生）。
 * Escape で閉じたときはトリガーへフォーカスを返す（設計書 §5.2 モーダル要件と同型）。
 */
export function useDisclosure({
  open,
  onOpenChange,
  triggerRef: sharedTriggerRef,
}: UseDisclosureOptions) {
  const ownTriggerRef = useRef<HTMLElement | null>(null);
  const triggerRef = sharedTriggerRef ?? ownTriggerRef;

  const toggle = useCallback(() => onOpenChange(!open), [open, onOpenChange]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const closeAndFocusTrigger = useCallback(() => {
    onOpenChange(false);
    triggerRef.current?.focus();
  }, [onOpenChange, triggerRef]);

  // フォーカスがトリガー/パネルの外（body 等）にあっても Escape で必ず閉じられるよう、
  // 開いている間だけ document レベルでも監視する（設計書 §4.1-9「閉じる: Escape」は無条件）
  useEffect(() => {
    if (!open) return;
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onOpenChange(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, [open, onOpenChange, triggerRef]);

  const handleEscapeKeyDown = useCallback(
    (event: { key: string; stopPropagation: () => void }) => {
      if (!open || event.key !== 'Escape') return;
      event.stopPropagation();
      onOpenChange(false);
      triggerRef.current?.focus();
    },
    [open, onOpenChange, triggerRef],
  );

  return { triggerRef, toggle, close, closeAndFocusTrigger, handleEscapeKeyDown };
}
