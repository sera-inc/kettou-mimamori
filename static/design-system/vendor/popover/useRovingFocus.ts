import { type KeyboardEvent, useEffect, useRef } from 'react';

/** 操作可能な menuitem のみを対象にする（disabled はスキップ） */
const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

/** メニュー内の操作可能な項目を DOM 順で列挙する（純ロジック） */
export function getMenuItems(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
}

/**
 * ローヴィングフォーカスの移動先 index を返す（純ロジック）。
 * ArrowUp/Down は端で循環し、Home/End は先頭・末尾へ。対象外キーは null。
 */
export function nextRovingIndex(
  key: string,
  currentIndex: number,
  itemCount: number,
): number | null {
  if (itemCount === 0) return null;
  switch (key) {
    case 'ArrowDown':
      return currentIndex >= itemCount - 1 ? 0 : currentIndex + 1;
    case 'ArrowUp':
      return currentIndex <= 0 ? itemCount - 1 : currentIndex - 1;
    case 'Home':
      return 0;
    case 'End':
      return itemCount - 1;
    default:
      return null;
  }
}

/** tabindex を付け替えて指定 index の項目へフォーカスする（ローヴィング tabindex） */
function focusItemAt(items: HTMLElement[], index: number): void {
  const target = items[index];
  if (!target) return;
  for (const item of items) {
    item.tabIndex = -1;
  }
  target.tabIndex = 0;
  target.focus();
}

/**
 * role="menu" 内のローヴィングフォーカス（設計書 §4.1-9 / DADS menu-list-box 派生）。
 * 開いたら先頭項目へフォーカスし、ArrowUp/Down・Home/End で項目間を移動する。
 * 返り値の listRef をメニューパネル要素に付与する。
 */
export function useRovingFocus(open: boolean) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    focusItemAt(getMenuItems(listRef.current), 0);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const items = getMenuItems(listRef.current);
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex = nextRovingIndex(event.key, currentIndex, items.length);
    if (nextIndex === null) return;
    event.preventDefault();
    focusItemAt(items, nextIndex);
  };

  return { listRef, handleKeyDown };
}
