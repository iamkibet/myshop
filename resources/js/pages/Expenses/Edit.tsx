import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';

interface Expense {
    id: number;
    title: string;
    description?: string;
    amount: number;
    category: string;
    expense_date: string;
    receipt_path?: string;
    status: string;
}

interface Props {
    expense: Expense;
    categories: Record<string, string>;
    userRole: string;
}

export default function ExpensesEdit({ expense, categories, userRole }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    
    const { data, setData, put, processing, errors } = useForm({
        title: expense.title,
        description: expense.description || '',
        amount: expense.amount.toString(),
        category: expense.category,
        expense_date: expense.expense_date,
        receipt: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/expenses/${expense.id}`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('receipt', file);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
            setIsDeleting(true);
            try {
                await router.delete(`/expenses/${expense.id}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const canEdit = expense.status === 'pending' || userRole === 'admin';

    return (
        <AppLayout>
            <Head title={`Edit Expense: ${expense.title}`} />

            <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6 px-3 sm:px-0 pb-20 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                            <Link href="/expenses" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Expense</h1>
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            {userRole === 'manager' ? 'Update your expense details' : 'Update expense information'}
                        </p>
                    </div>
                    
                    {canEdit && (
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full sm:w-auto"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Status Warning */}
                {!canEdit && (
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                    <span className="text-white text-xs">!</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        Cannot Edit Expense
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                        This expense has been {expense.status} and cannot be modified.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Expense Details</CardTitle>
                        <CardDescription className="text-sm">
                            {userRole === 'manager' ? 'Update the details and proof of your expense' : 'Update the expense information'}
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
                                        disabled={!canEdit}
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
                                        disabled={!canEdit}
                                    />
                                    {errors.amount && <p className="mt-1 text-xs sm:text-sm text-destructive">{errors.amount}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                                    <Select 
                                        value={data.category} 
                                        onValueChange={(value) => setData('category', value)}
                                        disabled={!canEdit}
                                    >
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
                                        disabled={!canEdit}
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
                                    placeholder="Additional details about the expense..."
                                    className="mt-1"
                                    rows={3}
                                    disabled={!canEdit}
                                />
                                {errors.description && <p className="mt-1 text-xs sm:text-sm text-destructive">{errors.description}</p>}
                            </div>

                            {/* Current Receipt Display */}
                            {expense.receipt_path && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Current Receipt</Label>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        Receipt attached
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Current proof of purchase
                                                    </p>
                                                </div>
                                            </div>
                                            <Link 
                                                href={`/expenses/${expense.id}/receipt`}
                                                target="_blank"
                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Receipt Upload Section */}
                            {canEdit && (
                                <div className="space-y-3">
                                    <Label htmlFor="receipt" className="text-sm font-medium">
                                        {userRole === 'manager' ? 'Update Proof of Purchase' : 'Update Receipt'}
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
                                                    {userRole === 'manager' ? 'Upload new proof of purchase' : 'Upload new receipt'}
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
                            )}

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                                <Link href="/expenses" className="w-full sm:w-auto">
                                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                                        Cancel
                                    </Button>
                                </Link>
                                {canEdit && (
                                    <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Update Expense
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
