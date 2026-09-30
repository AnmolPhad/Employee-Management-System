import React from 'react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

const SalarySummaryCard = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50 text-blue-600',
  isRawValue = false,
  badge,
}) => {
  const displayValue = isRawValue ? amount : formatCurrency(amount);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {displayValue}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {badge && <div className="mt-3 pt-3 border-t border-slate-100">{badge}</div>}
    </Card>
  );
};

export default SalarySummaryCard;
