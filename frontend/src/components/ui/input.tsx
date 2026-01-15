import React from 'react';
import { cn } from '@/lib/utils';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="input-wrapper">
        {label && <label className="input-label">{label}</label>}
        <div className="input-container relative">
          {leftIcon && <span className="input-icon input-icon-left absolute left-3 top-1/2 -translate-y-1/2 z-10">{leftIcon}</span>}
          <input
            ref={ref}
            className={cn(
              'input w-full p-3 bg-white border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-200 outline-none font-bold text-base md:text-lg',
              error && 'border-red-500', 
              leftIcon && 'pl-10', 
              className
            )}
            {...props}
          />
          {rightIcon && <span className="input-icon input-icon-right absolute right-3 top-1/2 -translate-y-1/2 z-10">{rightIcon}</span>}
        </div>
        {error && <span className="input-error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="input-wrapper">
        {label && <label className="input-label">{label}</label>}
        <textarea
          ref={ref}
          className={cn('input input-textarea', error && 'input-error', className)}
          {...props}
        />
        {error && <span className="input-error-text">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
