import type { ComponentProps } from 'react';
import './Skeleton.css';

export type SkeletonShape = 'text' | 'rect' | 'circle';

export type SkeletonProps = ComponentProps<'span'> & {
  /** プレースホルダの形状 */
  shape?: SkeletonShape;
  /** 幅（style.width へ反映。数値は px 扱い） */
  width?: string | number;
  /** 高さ（style.height へ反映。数値は px 扱い） */
  height?: string | number;
};

/**
 * Skeleton — 読込中プレースホルダ（設計書 §4.2.5、DADS progress-indicator 派生）。
 *
 * 実データと同じ寸法・同じレイアウト位置に配置し、読込完了時のレイアウトシフトを
 * 起こさないこと。width / height は表示予定の実データ（行高・アバター径・カード高など）に
 * 合わせて指定する。純粋な装飾要素のため常に aria-hidden となり、読み込み状態の
 * 支援技術への通知は SkeletonGroup が担う。
 */
export const Skeleton = ({
  shape = 'text',
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) => (
  <span
    className={['app-skeleton', className].filter(Boolean).join(' ')}
    data-shape={shape}
    aria-hidden='true'
    style={{ width, height, ...style }}
    {...rest}
  />
);

export type SkeletonGroupProps = ComponentProps<'div'> & {
  /** 視覚非表示の読み込みラベル（role="status" で支援技術に通知） */
  label?: string;
};

/**
 * SkeletonGroup — Skeleton 群のコンテナ（設計書 §4.2.5）。
 *
 * コンテナに aria-busy="true" を付与し、視覚非表示の読み込みラベルを
 * role="status" で支援技術に公開する。読込完了時はこのコンテナごと実データに
 * 置き換える（= aria-busy の解除）。内部の Skeleton は実データと同じ構造・寸法で
 * 並べ、切替時のレイアウトシフトを起こさないこと。
 */
export const SkeletonGroup = ({
  label = '読み込み中',
  children,
  className,
  ...rest
}: SkeletonGroupProps) => (
  <div
    className={['app-skeleton-group', className].filter(Boolean).join(' ')}
    aria-busy='true'
    {...rest}
  >
    <span role='status' className='app-skeleton-group__label'>
      {label}
    </span>
    {children}
  </div>
);
