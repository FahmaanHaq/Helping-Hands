import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * pageData: the raw Spring Data Page object { number, totalPages, totalElements, first, last }
 * onPageChange: (newPageNumber) => void
 */
export default function Pagination({ pageData, onPageChange }) {
  if (!pageData || pageData.totalPages <= 1) return null;

  const { number, totalPages, totalElements } = pageData;

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(number - 1)}
        disabled={number <= 0}
      >
        <ChevronLeft size={16} /> Prev
      </button>

      <span className="pagination-info">
        Page {number + 1} of {totalPages} · {totalElements} total
      </span>

      <button
        className="pagination-btn"
        onClick={() => onPageChange(number + 1)}
        disabled={number >= totalPages - 1}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
