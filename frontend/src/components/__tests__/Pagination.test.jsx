import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination.jsx';

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination pageData={{ number: 0, totalPages: 1, totalElements: 3 }} onPageChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when pageData is missing', () => {
    const { container } = render(<Pagination pageData={null} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current page and total count', () => {
    render(<Pagination pageData={{ number: 2, totalPages: 5, totalElements: 47 }} onPageChange={() => {}} />);
    expect(screen.getByText(/Page 3 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/47 total/)).toBeInTheDocument();
  });

  it('disables Prev on the first page and Next on the last page', () => {
    const { rerender } = render(
      <Pagination pageData={{ number: 0, totalPages: 3, totalElements: 30 }} onPageChange={() => {}} />
    );
    expect(screen.getByText(/Prev/).closest('button')).toBeDisabled();
    expect(screen.getByText(/Next/).closest('button')).not.toBeDisabled();

    rerender(<Pagination pageData={{ number: 2, totalPages: 3, totalElements: 30 }} onPageChange={() => {}} />);
    expect(screen.getByText(/Prev/).closest('button')).not.toBeDisabled();
    expect(screen.getByText(/Next/).closest('button')).toBeDisabled();
  });

  it('calls onPageChange with the correct target page', () => {
    const onPageChange = vi.fn();
    render(<Pagination pageData={{ number: 1, totalPages: 5, totalElements: 50 }} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText(/Next/).closest('button'));
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByText(/Prev/).closest('button'));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });
});
