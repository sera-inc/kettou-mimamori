import type { ReactNode } from 'react';
import { paginationItems } from './paginationItems';
import { useIndeterminate } from './useIndeterminate';
import { useStableRowCount } from './useStableRowCount';
import './DataGrid.css';

export type DataGridDensity = 'dense' | 'standard' | 'comfy';
export type DataGridSortDirection = 'ascending' | 'descending';
export type DataGridSort = { key: string; direction: DataGridSortDirection };

export type DataGridColumn<T> = {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  /** 数値列: 右寄せ + 等幅（.app-text-numeric 相当） */
  numeric?: boolean;
  render?: (row: T) => ReactNode;
};

export type DataGridProps<T> = {
  columns: DataGridColumn<T>[];
  rows: T[];
  /** <caption> の内容。横スクロール region の aria-label も兼ねる */
  caption: string;
  /** caption を視覚的に非表示にする（支援技術には読み上げられる） */
  visuallyHiddenCaption?: boolean;
  /** 行の一意キー。省略時は row.id を使う */
  getRowId?: (row: T) => string;
  sort?: DataGridSort;
  onSortChange?: (sort: DataGridSort) => void;
  /** 行選択チェックボックス列を表示する（DADS checkbox 派生） */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  density?: DataGridDensity;
  /** 読込中。行数は前回描画数を維持しレイアウトシフトを避ける（設計書 §4.2.2） */
  loading?: boolean;
  /** rows が空のとき全列にわたって描画する内容 */
  emptyState?: ReactNode;
};

/* ソート状態アイコン（色のみで伝達しない） */
const sortIcons: Record<'none' | DataGridSortDirection, ReactNode> = {
  none: (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <path
        d='M5 6L8 3L11 6M5 10L8 13L11 10'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
  ascending: (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <path
        d='M8 13V3M4 7L8 3L12 7'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
  descending: (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <path
        d='M8 3V13M4 9L8 13L12 9'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
};

const defaultGetRowId = <T,>(row: T): string => String((row as { id?: unknown }).id);

/* 全選択チェックボックス。indeterminate は DOM プロパティのため ref 経由で設定する */
const SelectAllCheckbox = ({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) => {
  const ref = useIndeterminate(indeterminate);
  return (
    <input
      ref={ref}
      type='checkbox'
      className='app-data-grid__checkbox'
      checked={checked}
      onChange={onChange}
      aria-label='すべての行を選択'
    />
  );
};

/**
 * DataGrid — DADS table / checkbox 派生（設計書 §4.2.2）。
 * <table> による実装（<div> 疑似テーブル禁止）。controlled コンポーネント。
 */
function DataGridRoot<T>({
  columns,
  rows,
  caption,
  visuallyHiddenCaption = false,
  getRowId = defaultGetRowId,
  sort,
  onSortChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  density = 'standard',
  loading = false,
  emptyState,
}: DataGridProps<T>) {
  const skeletonRowCount = useStableRowCount(rows.length, loading);
  const rowIds = rows.map((row) => getRowId(row));
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
  const someSelected = rowIds.some((id) => selectedIds.includes(id));
  const columnCount = columns.length + (selectable ? 1 : 0);
  const skeletonKeys = Array.from({ length: skeletonRowCount }, (_, i) => `skeleton-${i + 1}`);

  const handleSortClick = (column: DataGridColumn<T>) => {
    const direction: DataGridSortDirection =
      sort?.key === column.key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    onSortChange?.({ key: column.key, direction });
  };

  const toggleAll = () => onSelectionChange?.(allSelected ? [] : rowIds);
  const toggleRow = (id: string) =>
    onSelectionChange?.(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );

  const shimmerCell = <span className='app-data-grid__shimmer' aria-hidden='true' />;

  return (
    /* 横スクロール領域は WCAG 2.1.1 / axe scrollable-region-focusable のため
       キーボードフォーカス可能にする（設計書 §4.2.2 禁止事項） */
    // biome-ignore lint/a11y/useSemanticElements: 設計書 §4.2.2 指定の role='region' + tabIndex + aria-label マークアップ
    <div
      className='app-data-grid'
      role='region'
      aria-label={caption}
      aria-busy={loading || undefined}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 横スクロール領域のキーボード到達性に必須（axe scrollable-region-focusable）
      tabIndex={0}
      data-density={density}
      data-loading={loading || undefined}
    >
      <table className='app-data-grid__table'>
        <caption
          className='app-data-grid__caption'
          data-visually-hidden={visuallyHiddenCaption || undefined}
        >
          {caption}
        </caption>
        <thead>
          <tr>
            {selectable && (
              <th scope='col' className='app-data-grid__select-cell'>
                <SelectAllCheckbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((column) => {
              const sorted = sort?.key === column.key ? sort.direction : undefined;
              return (
                <th
                  key={column.key}
                  scope='col'
                  aria-sort={sorted}
                  data-numeric={column.numeric || undefined}
                >
                  {column.sortable ? (
                    <button
                      type='button'
                      className='app-data-grid__sort-button'
                      onClick={() => handleSortClick(column)}
                    >
                      {column.header}
                      {sortIcons[sorted ?? 'none']}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            skeletonKeys.map((rowKey) => (
              <tr key={rowKey}>
                {selectable && <td className='app-data-grid__select-cell'>{shimmerCell}</td>}
                {columns.map((column) => (
                  <td key={column.key} data-numeric={column.numeric || undefined}>
                    {shimmerCell}
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className='app-data-grid__empty-cell'>
                {emptyState ?? 'データがありません'}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const selected = selectable && selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  data-selected={selected || undefined}
                  aria-selected={selectable ? selected : undefined}
                >
                  {selectable && (
                    <td className='app-data-grid__select-cell'>
                      <input
                        type='checkbox'
                        className='app-data-grid__checkbox'
                        checked={selected}
                        onChange={() => toggleRow(id)}
                        aria-label='行を選択'
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} data-numeric={column.numeric || undefined}>
                      {column.render
                        ? column.render(row)
                        : ((row as Record<string, unknown>)[column.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export type DataGridPaginationProps = {
  /** 現在ページ（1始まり） */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** <nav> の aria-label（既定: 'ページ'） */
  label?: string;
};

/** DataGrid.Pagination — DADS page-navigation 派生 */
const DataGridPagination = ({
  page,
  pageCount,
  onPageChange,
  label = 'ページ',
}: DataGridPaginationProps) => {
  const pages = paginationItems(page, pageCount);
  return (
    <nav className='app-data-grid-pagination' aria-label={label}>
      <button
        type='button'
        className='app-data-grid-pagination__arrow'
        aria-label='前のページ'
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
          <path
            d='M10 3L5 8L10 13'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>
      <ol className='app-data-grid-pagination__pages'>
        {pages.map((p) =>
          typeof p === 'string' ? (
            <li key={p} aria-hidden='true'>
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type='button'
                className='app-data-grid-pagination__page'
                aria-current={p === page ? 'page' : undefined}
                aria-label={`${p}ページ目`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        type='button'
        className='app-data-grid-pagination__arrow'
        aria-label='次のページ'
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
          <path
            d='M6 3L11 8L6 13'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>
    </nav>
  );
};

export const DataGrid = Object.assign(DataGridRoot, { Pagination: DataGridPagination });
