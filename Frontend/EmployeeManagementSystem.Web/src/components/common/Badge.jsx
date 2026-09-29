import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

const Badge = ({ status, text, className = '' }) => {
  const content = text || status || '';
  const colorClass = getStatusBadgeClass(status || text);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {content}
    </span>
  );
};

export default Badge;
