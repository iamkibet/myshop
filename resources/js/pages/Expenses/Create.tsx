import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Head, useForm } from '@inertiajs/react';
import { Loader2, Plus } from 'lucide-react';
import React from 'react';

interface Props {
    categories: Record<string, string>;
}

export default function ExpensesCreate({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        amount: '',
        category: '',
        expense_date: '',
        receipt: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/expenses');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('receipt', file);
    };

    return (
        <>
            <Head title="Add Expense" />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Expense</h1>
                    <p className="text-muted-foreground">Record a new expense for the shop</p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Expense Details</CardTitle>
                        <CardDescription>Fill in the details for the new expense</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g., Monthly Rent"
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-destructive">{errors.amount}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(categories).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="expense_date">Expense Date *</Label>
                                    <Input
                                        id="expense_date"
                                        type="date"
                                        value={data.expense_date}
                                        onChange={(e) => setData('expense_date', e.target.value)}
                                    />
                                    {errors.expense_date && <p className="mt-1 text-sm text-destructive">{errors.expense_date}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Optional description of the expense..."
                                    rows={3}
                                />
                                {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
                            </div>

                            <div>
                                <Label htmlFor="receipt">Receipt (Optional)</Label>
                                <Input id="receipt" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="mt-1" />
                                <p className="mt-1 text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF (max 2MB)</p>
                                {errors.receipt && <p className="mt-1 text-sm text-destructive">{errors.receipt}</p>}
                            </div>

                            <div className="flex items-center justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Expense
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
