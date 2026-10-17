import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={`w-full py-1.5 text-xs bg-surface border border-border rounded-xl text-text-main placeholder-text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors ${
          icon ? 'pl-9 pr-3' : 'px-3'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
