function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      className="form-control"
      type="search"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}

export default SearchBar;
