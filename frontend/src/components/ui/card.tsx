import React from 'react';
import { cn } from '@/lib/utils';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, hover, onClick }) => {
  return (
    <div
      className={cn(
        'card border-4 border-black shadow-neo bg-white text-black rounded-lg',
        hover && 'hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-200', 
        onClick && 'cursor-pointer active:translate-y-1', 
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn('card-header', className)}>{children}</div>;
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <h3 className={cn('card-title', className)}>{children}</h3>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn('card-content', className)}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn('card-footer', className)}>{children}</div>;
};
