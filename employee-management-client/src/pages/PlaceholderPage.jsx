function PlaceholderPage({ title }) {
  return (
    <div className="card">
      <div className="card-body p-4">
        <h2 className="h4 fw-bold mb-2">{title}</h2>
        <p className="text-muted mb-0">
          This route is configured for Phase 1. Module UI and API functionality will be implemented in a later phase.
        </p>
      </div>
    </div>
  );
}

export default PlaceholderPage;
