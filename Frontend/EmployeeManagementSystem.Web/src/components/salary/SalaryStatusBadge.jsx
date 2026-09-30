import React from 'react';
import Badge from '../common/Badge';
import { formatSalaryStatus } from '../../utils/formatters';

const SalaryStatusBadge = ({ status, className = '' }) => {
  const label = formatSalaryStatus(status);
  return <Badge status={label} text={label} className={className} />;
};

export default SalaryStatusBadge;
