import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Head, useForm } from '@inertiajs/react';
import { Loader2, Plus } from 'lucide-react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';

interface Props {
    categories: Record<string, string>;
    userRole: string;
}

export default function ExpensesCreate({ categories, userRole }: Props) {
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
        <AppLayout>
            <Head title="Add Expense" />

            <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6 px-3 sm:px-0 pb-20 sm:pb-6">
                {/* Header */}
                <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Expense</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-2">
                        {userRole === 'manager' ? 'Record your expense with proof of purchase' : 'Record a new expense for the shop'}
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Expense Details</CardTitle>
                        <CardDescription className="text-sm">
                            {userRole === 'manager' ? 'Fill in the details and attach proof of your expense' : 'Fill in the details for the new expense'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g., Monthly Rent"
                                        className="mt-1"
                                    />
                                    {errors.title && <p className="mt-1 text-xs sm:text-sm text-destructive">{errors.title}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        className="mt-1"
                                    />
                                    {errors.amount && <p className="mt-1 text-xs sm:text-sm text-destructive">{errors.amount}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                                    <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                                        <SelectTrigger className="mt-1">
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
                                    {errors.category && <p className="mt-1 text-xs sm:text-sm text-destructive">{errors.category}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="expense_date" className="text-sm font-medium">Expense Date *</Label>
                                    <Input
                                        id="expense_date"
                                        type="date"
                                        value={data.expense_date}
                                        onChange={(e) => setData('expense_date', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.expense_date && <p className="mt-1 text-xs sm:text-sm text-destructive">{errors.expense_date}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Optional description of the expense..."
                                    rows={3}
                                    className="mt-1"
                                />
                                {errors.description && <p className="mt-1 text-xs sm:text-sm text-destructive">{errors.description}</p>}
                            </div>

                            {/* Enhanced Receipt Upload Section */}
                            <div className="space-y-3">
                                <Label htmlFor="receipt" className="text-sm font-medium">
                                    {userRole === 'manager' ? 'Proof of Purchase *' : 'Receipt (Optional)'}
                                </Label>
                                
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                                    <div className="space-y-3">
                                        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        
                                        <div>
                                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                                                {userRole === 'manager' ? 'Upload proof of purchase' : 'Upload receipt'}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {userRole === 'manager' 
                                                    ? 'Take a photo or upload a screenshot of your receipt/invoice' 
                                                    : 'Drag and drop or click to upload'
                                                }
                                            </p>
                                        </div>
                                        
                                        <Input 
                                            id="receipt" 
                                            type="file" 
                                            accept=".jpg,.jpeg,.png,.pdf" 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                        />
                                        
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => document.getElementById('receipt')?.click()}
                                            className="mx-auto"
                                        >
                                            Choose File
                                        </Button>
                                        
                                        {data.receipt && (
                                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-sm font-medium">
                                                        {data.receipt.name} selected
                                                    </span>
                                                </div>
                                                </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">
                                        Accepted formats: JPG, PNG, PDF (max 5MB)
                                        {userRole === 'manager' && (
                                            <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                                                ⚠️ Proof of purchase is required for manager expenses
                                            </span>
                                        )}
                                    </p>
                                </div>
                                
                                {errors.receipt && <p className="mt-1 text-xs sm:text-sm text-destructive text-center">{errors.receipt}</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
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
        </AppLayout>
    );
}
