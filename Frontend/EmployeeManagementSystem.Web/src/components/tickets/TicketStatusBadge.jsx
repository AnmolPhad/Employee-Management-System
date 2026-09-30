import React from 'react';
import Badge from '../common/Badge';

const TicketStatusBadge = ({ status, className = '' }) => {
  const normalized = status || 'Pending';
  return <Badge status={normalized} text={normalized} className={className} />;
};

export default TicketStatusBadge;
