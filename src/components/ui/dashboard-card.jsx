import React from 'react';
import { cn } from '@/lib/utils';

export function DashboardCard({
  title,
  value,
  icon,
  description,
  trend,
  trendValue,
  className,
  ...props
}) {
  const isPositiveTrend = trend === 'up';
  const trendColor = isPositiveTrend ? 'text-green-500' : 'text-red-500';
  const trendIcon = isPositiveTrend ? '↑' : '↓';

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold">{value}</p>
            {trendValue && (
              <span className={`ml-2 text-sm font-medium ${trendColor} flex items-center`}>
                {trendIcon} {trendValue}
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        {icon && <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>}
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="mt-2 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="mt-1 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="p-2 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}