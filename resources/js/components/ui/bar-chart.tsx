import React from 'react';

interface BarChartProps {
    data: Array<{
        label: string;
        value: number;
        color: string;
        secondaryValue?: number;
        secondaryColor?: string;
    }>;
    height?: number;
    maxValue?: number;
    showSecondary?: boolean;
    formatValue?: (value: number) => string;
}

export function BarChart({ 
    data, 
    height = 200, 
    maxValue, 
    showSecondary = false,
    formatValue = (value) => value.toString()
}: BarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm">No data available</p>
                </div>
            </div>
        );
    }

    const maxDataValue = maxValue || Math.max(...data.map(item => Math.max(item.value, item.secondaryValue || 0)));
    const barWidth = 100 / data.length;
    const barSpacing = Math.max(1, Math.min(3, 100 / data.length * 0.1)); // Responsive spacing

    return (
        <div className="w-full">
            <div className="relative" style={{ height: `${height}px` }}>
                {/* Chart Bars */}
                <div className="flex items-end justify-between h-full space-x-1">
                    {data.map((item, index) => {
                        const barHeight = maxDataValue > 0 ? (item.value / maxDataValue) * 100 : 0;
                        const secondaryBarHeight = showSecondary && item.secondaryValue && maxDataValue > 0
                            ? (item.secondaryValue / maxDataValue) * 100 
                            : 0;
                        
                        return (
                            <div 
                                key={index} 
                                className="flex-1 flex flex-col items-center"
                                style={{ width: `${barWidth - barSpacing}%` }}
                            >
                                {/* Secondary Bar (if enabled) */}
                                {showSecondary && item.secondaryValue && item.secondaryValue > 0 && (
                                    <div 
                                        className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                                        style={{
                                            height: `${secondaryBarHeight}%`,
                                            backgroundColor: item.secondaryColor || '#E5E7EB',
                                            minHeight: '4px'
                                        }}
                                    />
                                )}
                                
                                {/* Primary Bar */}
                                <div 
                                    className="w-full rounded-sm transition-all duration-300 hover:opacity-80 relative group"
                                    style={{
                                        height: `${barHeight}%`,
                                        backgroundColor: item.color,
                                        minHeight: '4px'
                                    }}
                                >
                                    {/* Tooltip - Hidden on mobile */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 hidden sm:block">
                                        <div className="font-medium">{item.label}</div>
                                        <div>Primary: {formatValue(item.value)}</div>
                                        {showSecondary && item.secondaryValue && item.secondaryValue > 0 && (
                                            <div>Secondary: {formatValue(item.secondaryValue)}</div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Bar Label */}
                                <div className="mt-2 text-center">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-full">
                                        {item.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatValue(item.value)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Y-axis grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                    {[0, 25, 50, 75, 100].map((percentage) => (
                        <div
                            key={percentage}
                            className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                            style={{ top: `${100 - percentage}%` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
