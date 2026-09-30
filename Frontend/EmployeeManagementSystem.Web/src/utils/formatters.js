export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatEmploymentStatus = (status) => {
  if (!status) return '-';
  switch (status.toString()) {
    case 'FullTime':
      return 'Full Time';
    case 'PartTime':
      return 'Part Time';
    default:
      return status.toString();
  }
};

export const formatSalaryStatus = (status) => {
  if (status === undefined || status === null) return '-';
  if (status === 1 || status === '1' || status === 'Active') return 'Active';
  if (status === 2 || status === '2' || status === 'Inactive') return 'Inactive';
  if (status === 3 || status === '3' || status === 'Revised') return 'Revised';
  return status.toString();
};

export const getStatusBadgeClass = (status) => {
  const normalized = (status || '').toString().toLowerCase().replace(/\s+/g, '');
  switch (normalized) {
    case 'approved':
    case 'active':
    case '1':
    case 'present':
    case 'online':
    case 'fulltime':
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending':
    case 'inreview':
    case 'halfday':
    case 'onleave':
    case 'resigned':
    case 'unpaid':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'rejected':
    case 'inactive':
    case '2':
    case 'absent':
    case 'terminated':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'revised':
    case '3':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'parttime':
    case 'holiday':
    case 'weekoff':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'contract':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'intern':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'admin':
    case 'systemadministrator':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'hr':
    case 'hrspecialist':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'manager':
    case 'projectmanager':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'softwareengineer':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'financialanalyst':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const formatTimeSpan = (timeStr) => {
  if (!timeStr) return '-';
  const parts = timeStr.toString().split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

export const formatWorkHours = (hours) => {
  if (hours === undefined || hours === null || isNaN(hours)) return '-';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0 && m === 0) return '0 hrs';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

