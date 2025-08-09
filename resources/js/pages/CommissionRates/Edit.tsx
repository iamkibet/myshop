import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface CommissionRate {
    id: number;
    sales_threshold: number;
    commission_amount: number;
    is_active: boolean;
    description: string | null;
}

interface Props {
    rate: CommissionRate;
}

export default function CommissionRateEdit({ rate }: Props) {
    const [formData, setFormData] = useState({
        sales_threshold: rate.sales_threshold.toString(),
        commission_amount: rate.commission_amount.toString(),
        description: rate.description || '',
        is_active: rate.is_active,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Commission Rates',
            href: '/commission-rates',
        },
        {
            title: 'Edit',
            href: `/commission-rates/${rate.id}/edit`,
        },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(`/commission-rates/${rate.id}`, formData);
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Commission Rate" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => router.get('/commission-rates')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Commission Rate</h1>
                        <p className="text-muted-foreground">Update commission rate settings</p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Commission Rate Details</CardTitle>
                        <CardDescription>
                            Update the commission rate configuration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sales_threshold">Sales Threshold</Label>
                                    <Input
                                        id="sales_threshold"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="5000.00"
                                        value={formData.sales_threshold}
                                        onChange={(e) => handleChange('sales_threshold', e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Sales amount required to earn commission
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="commission_amount">Commission Amount</Label>
                                    <Input
                                        id="commission_amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="300.00"
                                        value={formData.commission_amount}
                                        onChange={(e) => handleChange('commission_amount', e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Commission amount earned per threshold
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="e.g., Base commission rate for all managers"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Optional description to help identify this commission rate
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Active</Label>
                                <p className="text-xs text-muted-foreground">
                                    Enable this commission rate for calculations
                                </p>
                            </div>

                            <div className="flex items-center justify-end space-x-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => router.get('/commission-rates')}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Update Commission Rate</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
