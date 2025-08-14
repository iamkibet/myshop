import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Check, Eye, Receipt, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface PendingExpense {
    id: number;
    title: string;
    description?: string;
    amount: number;
    category: string;
    expense_date: string;
    receipt_path?: string;
    status: 'pending' | 'approved' | 'rejected';
    added_by: {
        name: string;
        email: string;
    };
    created_at: string;
}

interface Props {
    pendingExpenses: {
        data: PendingExpense[];
        links: any[];
    };
}

export default function PendingExpenses({ pendingExpenses }: Props) {
    const [approvalNotes, setApprovalNotes] = useState<Record<number, string>>({});
    const [rejectionNotes, setRejectionNotes] = useState<Record<number, string>>({});

    const handleApprove = (expenseId: number) => {
        const notes = approvalNotes[expenseId] || '';
        router.post(`/expenses/${expenseId}/approve`, { approval_notes: notes });
    };

    const handleReject = (expenseId: number) => {
        const notes = rejectionNotes[expenseId];
        if (!notes || notes.trim() === '') {
            alert('Please provide a reason for rejection.');
            return;
        }
        router.post(`/expenses/${expenseId}/reject`, { approval_notes: notes });
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            rent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
            utilities: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            inventory: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        };
        return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    };

    return (
        <AppLayout>
            <Head title="Pending Expenses Approval" />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl pb-20 sm:pb-6">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                                <Link href="/expenses" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    Pending Expenses Approval
                                </h1>
                            </div>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                                Review and approve manager expense submissions
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                                {pendingExpenses.data.length} Pending
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Pending Expenses List */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base sm:text-lg font-semibold">Pending Expenses</CardTitle>
                        <CardDescription className="text-sm">
                            Review these expenses and approve or reject them with notes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingExpenses.data.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        No pending expenses
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        All expenses have been reviewed
                                    </p>
                                </div>
                            ) : (
                                pendingExpenses.data.map((expense) => (
                                    <div key={expense.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-4">
                                        {/* Expense Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {expense.title}
                                                    </h3>
                                                    <Badge className={`${getCategoryColor(expense.category)} text-xs px-2 py-1`}>
                                                        {expense.category}
                                                    </Badge>
                                                </div>
                                                
                                                {expense.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                        {expense.description}
                                                    </p>
                                                )}
                                                
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(expense.expense_date).toLocaleDateString()}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Submitted by {expense.added_by.name}</span>
                                                    <span>•</span>
                                                    <span>{expense.added_by.email}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="text-center sm:text-right">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(expense.amount)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Submitted {new Date(expense.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Receipt Preview */}
                                        {expense.receipt_path && (
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Receipt className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Proof of Purchase
                                                    </span>
                                                </div>
                                                <Link 
                                                    href={`/expenses/${expense.id}/receipt`}
                                                    target="_blank"
                                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center gap-1"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View Receipt
                                                </Link>
                                            </div>
                                        )}

                                        {/* Approval Actions */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            {/* Approval Notes */}
                                            <div className="flex-1">
                                                <Label htmlFor={`approval-notes-${expense.id}`} className="text-sm font-medium text-green-700 dark:text-green-300">
                                                    Approval Notes (Optional)
                                                </Label>
                                                <Textarea
                                                    id={`approval-notes-${expense.id}`}
                                                    placeholder="Add approval notes..."
                                                    value={approvalNotes[expense.id] || ''}
                                                    onChange={(e) => setApprovalNotes(prev => ({ ...prev, [expense.id]: e.target.value }))}
                                                    className="mt-1 border-green-200 focus:border-green-300"
                                                    rows={2}
                                                />
                                            </div>

                                            {/* Rejection Notes */}
                                            <div className="flex-1">
                                                <Label htmlFor={`rejection-notes-${expense.id}`} className="text-sm font-medium text-red-700 dark:text-red-300">
                                                    Rejection Reason (Required for rejection)
                                                </Label>
                                                <Textarea
                                                    id={`rejection-notes-${expense.id}`}
                                                    placeholder="Provide reason for rejection..."
                                                    value={rejectionNotes[expense.id] || ''}
                                                    onChange={(e) => setRejectionNotes(prev => ({ ...prev, [expense.id]: e.target.value }))}
                                                    className="mt-1 border-red-200 focus:border-red-300"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-3">
                                            <Button 
                                                onClick={() => handleApprove(expense.id)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <Check className="mr-2 h-4 w-4" />
                                                Approve Expense
                                            </Button>
                                            
                                            <Button 
                                                onClick={() => handleReject(expense.id)}
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Reject Expense
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {pendingExpenses.links && pendingExpenses.links.length > 3 && (
                            <div className="mt-6 sm:mt-8 flex items-center justify-center">
                                <nav className="flex items-center gap-1 sm:gap-2">
                                    {pendingExpenses.links.map((link: any, index: number) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : link.url
                                                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
