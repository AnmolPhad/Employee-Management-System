import { FaBuilding, FaCalendarTimes, FaFolderOpen, FaTicketAlt, FaUserCheck, FaUsers } from 'react-icons/fa';

const summaryCards = [
  { label: 'Total Employees', value: '—', icon: FaUsers, color: 'primary' },
  { label: 'Active Employees', value: '—', icon: FaUserCheck, color: 'success' },
  { label: 'Departments', value: '—', icon: FaBuilding, color: 'info' },
  { label: 'Active Projects', value: '—', icon: FaFolderOpen, color: 'warning' },
  { label: 'Pending Leaves', value: '—', icon: FaCalendarTimes, color: 'danger' },
  { label: 'Open Tickets', value: '—', icon: FaTicketAlt, color: 'secondary' },
];

function Dashboard() {
  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1">Employee Management Dashboard</h2>
          <p className="text-muted mb-0">Overview shell ready for API data from <code>/api/dashboard/summary</code>.</p>
        </div>
        <button className="btn btn-primary align-self-start" type="button">Generate Report</button>
      </div>

      <div className="row g-3 mb-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div className="col-12 col-sm-6 col-xl-4" key={label}>
            <div className="card h-100">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1">{label}</p>
                  <h3 className="fw-bold mb-0">{value}</h3>
                </div>
                <div className={`stat-card-icon bg-${color} bg-opacity-10 text-${color}`}>
                  <Icon className="fs-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="card h-100">
            <div className="card-header bg-white fw-semibold">Workforce Trend</div>
            <div className="card-body">
              <div className="d-flex align-items-end gap-3" style={{ height: 220 }} aria-label="Placeholder chart">
                {[45, 58, 52, 70, 64, 78, 84, 80].map((height, index) => (
                  <div className="flex-fill bg-primary bg-opacity-25 rounded-top" style={{ height: `${height}%` }} key={index} />
                ))}
              </div>
              <small className="text-muted d-block mt-3">Chart placeholder. Real chart data will be integrated in Phase 3.</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white fw-semibold">Recent Activity</div>
            <div className="card-body">
              <div className="text-center py-5">
                <p className="text-muted mb-0">No activity loaded yet.</p>
                <small className="text-muted">API integration comes in later phases.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
