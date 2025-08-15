import React from 'react';

interface PieChartProps {
    data: Array<{
        category: string;
        total: number;
        percentage: number;
        color: string;
    }>;
    size?: number;
    strokeWidth?: number;
}

export function PieChart({ data, size = 200, strokeWidth = 40 }: PieChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">🥧</div>
                    <p className="text-sm">No data available</p>
                </div>
            </div>
        );
    }

    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    let currentAngle = -90; // Start from top

    const createArc = (startAngle: number, endAngle: number) => {
        const startRadians = (startAngle * Math.PI) / 180;
        const endRadians = (endAngle * Math.PI) / 180;
        
        const x1 = center + radius * Math.cos(startRadians);
        const y1 = center + radius * Math.sin(startRadians);
        const x2 = center + radius * Math.cos(endRadians);
        const y2 = center + radius * Math.sin(endRadians);
        
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
        
        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                <svg width={size} height={size} className="transform -rotate-90">
                    {data.map((item, index) => {
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + (item.percentage * 360) / 100;
                        const path = createArc(startAngle, endAngle);
                        
                        currentAngle = endAngle;
                        
                        return (
                            <path
                                key={index}
                                d={path}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                className="transition-all duration-300 hover:stroke-width-2"
                            />
                        );
                    })}
                </svg>
                
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {data.length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Categories
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                        <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {item.category}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {item.percentage.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
