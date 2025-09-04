import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { router } from '@inertiajs/react';
import { AlertTriangle, Check, Package, X, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface Alert {
    id: number;
    type: 'low_stock' | 'out_of_stock' | 'pending_expense';
    title: string;
    message: string;
    amount?: number;
    quantity?: number;
    sku?: string;
    category?: string;
    added_by?: string;
    date?: string;
}

interface AlertCounts {
    lowStock: number;
    outOfStock: number;
    pendingExpenses: number;
    total: number;
}

interface AlertsDropdownProps {
    alerts: {
        lowStock: Alert[];
        outOfStock: Alert[];
        pendingExpenses: Alert[];
    };
    alertCounts: AlertCounts;
    onAlertResolved?: (alertId: number, alertType: string) => void;
}

export default function AlertsDropdown({ alerts, alertCounts, onAlertResolved }: AlertsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(new Set());

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'low_stock':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'out_of_stock':
                return <X className="h-4 w-4 text-red-500" />;
            case 'pending_expense':
                return <DollarSign className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'low_stock':
                return 'border-l-orange-500 bg-orange-50';
            case 'out_of_stock':
                return 'border-l-red-500 bg-red-50';
            case 'pending_expense':
                return 'border-l-yellow-500 bg-yellow-50';
            default:
                return 'border-l-gray-500 bg-gray-50';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const markAsResolved = async (alertId: number, alertType: string) => {
        try {
            setLoading(true);
            
            // Add to resolved alerts set
            const alertKey = `${alertType}_${alertId}`;
            setResolvedAlerts(prev => new Set([...prev, alertKey]));

            // Notify parent component
            onAlertResolved?.(alertId, alertType);

            // Here you could make an API call to mark the alert as resolved
            // For now, we'll just update the local state
        } catch (error) {
            console.error('Failed to mark alert as resolved:', error);
            // Remove from resolved alerts if failed
            const alertKey = `${alertType}_${alertId}`;
            setResolvedAlerts(prev => {
                const newSet = new Set(prev);
                newSet.delete(alertKey);
                return newSet;
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAlertClick = (alert: Alert) => {
        // Navigate to appropriate page based on alert type
        switch (alert.type) {
            case 'low_stock':
            case 'out_of_stock':
                router.visit('/products');
                break;
            case 'pending_expense':
                router.visit('/expenses');
                break;
        }
        setIsOpen(false);
    };

    // Combine all alerts and filter out resolved ones
    const allAlerts = [
        ...alerts.lowStock.map(alert => ({ ...alert, type: 'low_stock' as const })),
        ...alerts.outOfStock.map(alert => ({ ...alert, type: 'out_of_stock' as const })),
        ...alerts.pendingExpenses.map(alert => ({ ...alert, type: 'pending_expense' as const }))
    ].filter(alert => !resolvedAlerts.has(`${alert.type}_${alert.id}`));

    const recentAlerts = allAlerts.slice(0, 5);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    {alertCounts.total > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                        >
                            {alertCounts.total > 9 ? '9+' : alertCounts.total}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-sm">
                            <span>Active Alerts</span>
                            <Button variant="ghost" size="sm" onClick={() => router.visit('/admin-dashboard')} className="h-6 px-2 text-xs">
                                View All
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="max-h-80 space-y-2 overflow-y-auto">
                            {recentAlerts.length > 0 ? (
                                recentAlerts.map((alert) => (
                                    <div
                                        key={`${alert.type}_${alert.id}`}
                                        className={`flex items-start space-x-3 rounded-lg p-3 transition-all hover:shadow-sm ${getAlertColor(alert.type)}`}
                                    >
                                        {getAlertIcon(alert.type)}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center space-x-2">
                                                <h4 className="truncate text-sm font-medium">{alert.title}</h4>
                                                <Badge 
                                                    variant="secondary" 
                                                    className={`text-xs ${
                                                        alert.type === 'low_stock' ? 'bg-orange-100 text-orange-800' :
                                                        alert.type === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {alert.type === 'low_stock' ? 'Low Stock' :
                                                     alert.type === 'out_of_stock' ? 'Out of Stock' :
                                                     'Pending'}
                                                </Badge>
                                            </div>
                                            <p className="mb-1 line-clamp-2 text-xs text-muted-foreground">{alert.message}</p>
                                            {alert.amount && (
                                                <p className="mb-1 text-xs font-medium text-gray-700">
                                                    {formatCurrency(alert.amount)}
                                                </p>
                                            )}
                                            {alert.quantity && (
                                                <p className="mb-1 text-xs text-gray-600">
                                                    {alert.quantity} units remaining
                                                </p>
                                            )}
                                            {alert.sku && (
                                                <p className="mb-1 text-xs text-gray-500">
                                                    SKU: {alert.sku}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {alert.date || 'Just now'}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsResolved(alert.id, alert.type);
                                                        }}
                                                        disabled={loading}
                                                        title="Mark as Resolved"
                                                    >
                                                        <Check className="h-3 w-3 text-green-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs"
                                                        onClick={() => handleAlertClick(alert)}
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 text-center">
                                    <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                                    <p className="text-sm text-muted-foreground">No active alerts</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    );
}
