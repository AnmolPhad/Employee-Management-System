import React from 'react';
import Badge from '../common/Badge';

const LeaveStatusBadge = ({ status, className = '' }) => {
  const normStatus = (status || '').toString();
  
  let label = normStatus;
  let statusKey = normStatus;

  switch (normStatus.toLowerCase()) {
    case '1':
    case 'pending':
      label = 'Pending';
      statusKey = 'Pending';
      break;
    case '2':
    case 'approved':
      label = 'Approved';
      statusKey = 'Approved';
      break;
    case '3':
    case 'rejected':
      label = 'Rejected';
      statusKey = 'Rejected';
      break;
    case '4':
    case 'cancelled':
      label = 'Cancelled';
      statusKey = 'Cancelled';
      break;
    default:
      label = normStatus || 'Unknown';
      statusKey = normStatus;
      break;
  }

  return <Badge status={statusKey} text={label} className={className} />;
};

export default LeaveStatusBadge;
