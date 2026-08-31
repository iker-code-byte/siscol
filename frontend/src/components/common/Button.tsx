import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow active:scale-[0.99] border border-transparent',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm active:scale-[0.99] border border-transparent',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white shadow-sm',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:scale-[0.99] border border-transparent',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
