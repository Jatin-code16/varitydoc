import React from 'react';
import { cn } from '@/lib/utils';
import './Badge.css';

export interface BadgeProps {
  variant: 'role' | 'severity' | 'verdict' | 'status';
  type?: 'admin' | 'document_owner' | 'auditor' | 'guest' | 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS' | 'AUTHENTIC' | 'TAMPERED' | 'INVALID_SIGNATURE' | 'OK' | 'ERROR';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, type, icon, children, className }) => {
  return (
    <span className={cn(
      'badge border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]', 
      `badge-${variant}`, 
      type && `badge-${type.toLowerCase()}`, 
      className
    )}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
};
