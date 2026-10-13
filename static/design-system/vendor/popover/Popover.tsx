import {
  type ComponentProps,
  cloneElement,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
  type MutableRefObject,
  type ReactElement,
  type Ref,
} from 'react';
import './Popover.css';
import { useDisclosure } from './useDisclosure';
import { useOutsideClick } from './useOutsideClick';
import { useRovingFocus } from './useRovingFocus';

/** cloneElement でトリガーに注入する props（trigger は ref を受け取れる要素であること） */
type PopoverTriggerProps = {
  'aria-haspopup'?: 'dialog' | 'menu';
  'aria-expanded'?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  ref?: Ref<HTMLElement>;
};

export type PopoverProps = Omit<ComponentProps<'div'>, 'role'> & {
  /** 開閉ボタン。cloneElement で aria-haspopup / aria-expanded / onClick を付与する */
  trigger: ReactElement<PopoverTriggerProps>;
  /** 開閉状態（controlled） */
  open: boolean;
  /** 開閉状態の変更要求（トリガー押下・Escape・外側クリックで呼ばれる） */
  onOpenChange: (open: boolean) => void;
  /** パネルのアクセシブルネーム（role="dialog" / "menu" に必須） */
  'aria-label': string;
  /** パネルのロール。DropdownMenu は 'menu' を使う */
  role?: 'dialog' | 'menu';
  /** 特化コンポーネントがトリガー参照を共有するための注入口（通常は指定不要） */
  triggerRef?: MutableRefObject<HTMLElement | null>;
  /** パネル要素への参照（通常は指定不要） */
  panelRef?: Ref<HTMLDivElement>;
};

/**
 * Popover — DADS menu-list-box 派生（設計書 §4.1-9）。
 * トリガー直下に絶対配置のパネルを開く controlled コンポーネント。
 * Escape（トリガーへフォーカス返却）と外側クリックで閉じる。
 */
export const Popover = ({
  trigger,
  open,
  onOpenChange,
  role = 'dialog',
  triggerRef: sharedTriggerRef,
  panelRef,
  className,
  children,
  onKeyDown,
  ...rest
}: PopoverProps) => {
  const { triggerRef, toggle, close, handleEscapeKeyDown } = useDisclosure({
    open,
    onOpenChange,
    triggerRef: sharedTriggerRef,
  });
  const rootRef = useOutsideClick<HTMLDivElement>(close, open);

  return (
    <div ref={rootRef} className='app-popover'>
      {cloneElement(trigger, {
        ref: triggerRef,
        'aria-haspopup': role,
        'aria-expanded': open,
        onClick: (event: MouseEvent<HTMLElement>) => {
          trigger.props.onClick?.(event);
          toggle();
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          trigger.props.onKeyDown?.(event);
          handleEscapeKeyDown(event);
        },
      })}
      {open && (
        /* パネルは常に role="dialog" / "menu" を持つ（動的値のため静的解析が誤検出する）。
           keydown は Escape とメニュー操作キー（WAI-ARIA menu パターン）の委譲先として必要 */
        // biome-ignore lint/a11y/noStaticElementInteractions: パネルは role="dialog"/"menu" を持つ非静的要素
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: WAI-ARIA menu/dialog パターンのキー操作委譲
        <div
          {...rest}
          ref={panelRef}
          role={role}
          className={['app-popover__panel', className].filter(Boolean).join(' ')}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            handleEscapeKeyDown(event);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export type DropdownMenuProps = Omit<PopoverProps, 'role' | 'triggerRef' | 'panelRef'>;

export type DropdownMenuItemProps = Omit<ComponentProps<'button'>, 'type'> & {
  /** 選択時に実行される。実行後にメニューは閉じ、トリガーへフォーカスが戻る */
  onSelect?: () => void;
  /** 破壊的操作（削除等）を danger 配色で示す */
  destructive?: boolean;
};

const DropdownMenuItem = ({
  onSelect,
  destructive,
  className,
  onClick,
  children,
  ...rest
}: DropdownMenuItemProps) => (
  <button
    {...rest}
    type='button'
    role='menuitem'
    tabIndex={-1}
    data-destructive={destructive || undefined}
    className={['app-dropdown-menu__item', className].filter(Boolean).join(' ')}
    onClick={(event) => {
      onClick?.(event);
      onSelect?.();
    }}
  >
    {children}
  </button>
);

/**
 * DropdownMenu — Popover 基盤の特化（設計書 §4.1-9）。
 * パネルは role="menu"。ArrowUp/Down・Home/End で項目間をローヴィングフォーカスで移動し、
 * 項目の選択（Enter / Space / クリック）で onSelect 実行後に閉じてトリガーへフォーカスを返す。
 */
const DropdownMenuRoot = ({ open, onOpenChange, onClick, ...rest }: DropdownMenuProps) => {
  const { triggerRef, closeAndFocusTrigger } = useDisclosure({ open, onOpenChange });
  const { listRef, handleKeyDown } = useRovingFocus(open);

  return (
    <Popover
      {...rest}
      open={open}
      onOpenChange={onOpenChange}
      role='menu'
      triggerRef={triggerRef}
      panelRef={listRef}
      onKeyDown={handleKeyDown}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        /* 項目クリック（Enter/Space 由来含む）は Item の onSelect 実行後にここへ委譲で届く */
        if (event.target instanceof HTMLElement && event.target.closest('[role="menuitem"]')) {
          closeAndFocusTrigger();
        }
      }}
    />
  );
};

export const DropdownMenu = Object.assign(DropdownMenuRoot, { Item: DropdownMenuItem });
