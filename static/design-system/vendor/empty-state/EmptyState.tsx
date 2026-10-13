import type { ComponentProps, ReactNode } from 'react';
import './EmptyState.css';

export type EmptyStateVariant = 'no-data' | 'no-results' | 'error';

export type EmptyStateProps = Omit<ComponentProps<'div'>, 'title'> & {
  /** 空状態の種類（設計書 §4.2.4）。用途を混同しないこと */
  variant: EmptyStateVariant;
  /** 状況を一言で伝える見出しテキスト（必須） */
  title: ReactNode;
  /** 補足説明（次に取るべき行動のヒント等） */
  description?: ReactNode;
  /** アイコンの差し替え。省略時はバリアント標準の線画アイコンを表示する */
  icon?: ReactNode;
  /** アクション領域（作成CTA・条件クリア・再試行等のボタンは利用側が渡す） */
  children?: ReactNode;
};

/*
 * バリアント標準の線画アイコン（stroke: currentColor / 装飾なので aria-hidden）。
 * 注: イラストを使用する場合、デジタル庁のイラストレーション・アイコン素材は
 * 「イラストレーション・アイコン素材利用規約」の範囲で無料利用可能だが、
 * 行政手続きの説明コンテンツ向けに作られたものであるため、SaaS の文脈に
 * 合うかを個別に判断すること（設計書 §4.2.4）。
 */
const defaultIcons: Record<EmptyStateVariant, ReactNode> = {
  /* no-data: 空の箱 */
  'no-data': (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' aria-hidden='true'>
      <path
        d='M8 18L24 10L40 18L24 26L8 18Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M8 18V34L24 42L40 34V18'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M24 26V42' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' />
    </svg>
  ),
  /* no-results: 検索（虫めがね）＋ × */
  'no-results': (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' aria-hidden='true'>
      <circle cx='21' cy='21' r='11' stroke='currentColor' strokeWidth='2' />
      <path d='M29.5 29.5L39 39' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path
        d='M17.5 17.5L24.5 24.5M24.5 17.5L17.5 24.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  ),
  /* error: 丸に「!」 */
  error: (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' aria-hidden='true'>
      <circle cx='24' cy='24' r='16' stroke='currentColor' strokeWidth='2' />
      <path d='M24 16V26' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <circle cx='24' cy='31.5' r='1.5' fill='currentColor' />
    </svg>
  ),
};

/**
 * EmptyState — DADS notice-block 派生（設計書 §4.2.4）。
 * 「初回データなし / 検索結果0件 / 取得失敗」の3用途を variant で明示的に
 * 区別し、状況説明（title/description）とアクション（children）を中央寄せで示す。
 */
export const EmptyState = ({
  variant,
  title,
  description,
  icon,
  children,
  className,
  ...rest
}: EmptyStateProps) => (
  <div
    className={['app-empty-state', className].filter(Boolean).join(' ')}
    data-variant={variant}
    {...rest}
  >
    <span className='app-empty-state-icon'>{icon ?? defaultIcons[variant]}</span>
    <p className='app-empty-state-title'>{title}</p>
    {description != null && <p className='app-empty-state-description'>{description}</p>}
    {children != null && <div className='app-empty-state-actions'>{children}</div>}
  </div>
);
