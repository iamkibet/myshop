import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: number;
    change: number;
    changeType: string;
    icon: any;
    color: string;
    bgColor: string;
    format?: 'currency' | 'number';
    tooltip?: string;
    changeLabel?: string;
    showAbsoluteValue?: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatNumber = (value: number) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};

export default function KPICard({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color, 
    bgColor, 
    format = 'currency', 
    tooltip,
    changeLabel = 'vs Last Month',
    showAbsoluteValue = false
}: KPICardProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null);
    
    const isPositive = changeType === 'increase';
    
    const formatValue = (val: number) => {
        if (format === 'number') {
            return formatNumber(val);
        }
        return formatCurrency(val);
    };

    const handleMouseEnter = () => {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            setTooltipTimeout(null);
        }
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    const handleClick = () => {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            setTooltipTimeout(null);
        }
        
        if (!showTooltip) {
            // Show immediately on click
            setShowTooltip(true);
        } else {
            // Hide immediately on click
            setShowTooltip(false);
        }
    };

    const handleTouchStart = () => {
        // Add a delay for mobile to prevent accidental triggers
        const timeout = setTimeout(() => {
            setShowTooltip(true);
        }, 500);
        setTooltipTimeout(timeout);
    };

    const handleTouchEnd = () => {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            setTooltipTimeout(null);
        }
    };

    return (
        <Card className={`${bgColor} text-white border-0 shadow-lg relative`}>
            <CardContent className="px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center gap-1">
                                <p className="text-xs sm:text-sm font-medium opacity-90 truncate">{title}</p>
                                {tooltip && (
                                    <div className="relative">
                                        <button
                                            className="flex-shrink-0 ml-1 p-1 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors cursor-help touch-manipulation"
                                            onClick={handleClick}
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                            onTouchStart={handleTouchStart}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            <Info className="h-3 w-3 sm:h-4 sm:w-4 opacity-70" />
                                        </button>
                                        
                                        {/* Info Icon Tooltip */}
                                        {showTooltip && (
                                            <div className="fixed sm:absolute top-1/2 sm:top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:translate-y-0 sm:mt-2 px-4 py-3 bg-gray-900 text-white text-xs sm:text-sm rounded-xl shadow-2xl z-50 w-80 sm:w-72 text-center sm:text-left">
                                                <div className="font-semibold mb-2 text-white">{title}</div>
                                                <div className="text-gray-200 leading-relaxed text-xs sm:text-sm">
                                                    {tooltip}
                                                </div>
                                                {/* Arrow - hidden on mobile, shown on desktop */}
                                                <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 opacity-80 flex-shrink-0 ml-2" />
                        </div>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 truncate">{formatValue(value)}</p>
                    </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="text-xs sm:text-sm font-medium">
                            {showAbsoluteValue ? formatValue(Math.abs(change)) : `${Math.abs(change)}%`}
                        </span>
                    </div>
                    <span className="pt-2 text-xs sm:text-sm opacity-75">
                        {changeLabel}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
