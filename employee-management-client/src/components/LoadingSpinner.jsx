function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-4">
      <div className="spinner-border text-primary" role="status" aria-hidden="true" />
      <span className="text-muted">{message}</span>
    </div>
  );
}

export default LoadingSpinner;
