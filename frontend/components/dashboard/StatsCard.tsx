'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'orange';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatsCard({ title, value, icon: Icon, color = 'green', trend, className = '' }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-600 text-white',
    green: 'bg-emerald-600 text-white',
    yellow: 'bg-yellow-600 text-white',
    purple: 'bg-purple-600 text-white',
    red: 'bg-red-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    orange: 'bg-orange-600 text-white',
  };

  return (
    <div className={`bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
        <div className={`${colorClasses[color]} rounded-xl p-4`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

