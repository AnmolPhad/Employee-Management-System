import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const ErrorMessage = ({ message = 'Something went wrong.', onRetry = null, className = '' }) => {
  return (
    <div
      className={`flex items-start p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 shadow-xs ${className}`}
      role="alert"
    >
      <FiAlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0 mr-3" />
      <div className="flex-1 text-sm font-medium">
        <p>{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
