import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
