function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  return (
    <nav aria-label="Pagination">
      <ul className="pagination mb-0">
        <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
          <button className="page-link" type="button" onClick={() => onPageChange?.(currentPage - 1)}>Previous</button>
        </li>
        <li className="page-item active"><span className="page-link">{currentPage}</span></li>
        <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
          <button className="page-link" type="button" onClick={() => onPageChange?.(currentPage + 1)}>Next</button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
