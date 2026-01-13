// src/presentation/components/shared/Tabs.tsx
// Reusable tabs component

import React from 'react';
import { cn } from '@/shared/utils/cn';

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}

export function Tabs({ children, defaultValue, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={cn('space-y-4', className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === TabsList) {
          return React.cloneElement(child, {
            activeTab,
            setActiveTab,
          } as any);
        }
        return child;
      })}

      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === TabsContent) {
          return child.props.value === activeTab ? child : null;
        }
        return null;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export function TabsList({ children, className, activeTab, setActiveTab }: TabsListProps) {
  return (
    <div className={cn('flex space-x-1 rounded-lg bg-gray-100 p-1', className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === TabsTrigger) {
          return React.cloneElement(child, {
            active: child.props.value === activeTab,
            onClick: () => setActiveTab?.(child.props.value),
          } as any);
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}

export function TabsTrigger({ children, className, active, onClick }: TabsTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active 
          ? 'bg-white text-blue-600 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function TabsContent({ children, className }: TabsContentProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 p-4', className)}>
      {children}
    </div>
  );
}