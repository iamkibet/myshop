import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Check, Download, Edit, Eye, Receipt, User, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Expense {
    id: number;
    title: string;
    description?: string;
    amount: number;
    category: string;
    expense_date: string;
    receipt_path?: string;
    status: 'pending' | 'approved' | 'rejected';
    is_approved: boolean;
    approved_at?: string;
    approved_by?: {
        name: string;
    };
    approval_notes?: string;
    added_by: {
        name: string;
        email: string;
    };
    created_at: string;
}

interface Props {
    expense: Expense;
    userRole: string;
}

export default function ExpenseShow({ expense, userRole }: Props) {
    const [approvalNotes, setApprovalNotes] = useState(expense.approval_notes || '');
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApprove = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            await router.post(`/expenses/${expense.id}/approve`, { approval_notes: approvalNotes });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionNotes.trim()) {
            alert('Please provide a reason for rejection.');
            return;
        }
        
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            await router.post(`/expenses/${expense.id}/reject`, { approval_notes: rejectionNotes });
        } finally {
            setIsSubmitting(false);
        }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <Check className="h-4 w-4" />;
            case 'rejected':
                return <X className="h-4 w-4" />;
            default:
                return <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            default:
                return 'Pending Approval';
        }
    };

    return (
        <AppLayout>
            <Head title={`Expense: ${expense.title}`} />

            <div className="container mx-auto px-4 py-6 max-w-4xl pb-20 sm:pb-6">
                {/* Header - Clean & Mobile Optimized */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link 
                            href="/expenses" 
                            className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                {expense.title}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {userRole === 'manager' ? 'Your expense details' : 'Expense management'}
                            </p>
                        </div>
                        
                        {/* Status Badge - Single, Clean Display */}
                        <div className="flex-shrink-0">
                            <Badge className={`${getStatusColor(expense.status)} text-sm px-3 py-2 font-medium`}>
                                {getStatusIcon(expense.status)}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Main Content - Clean & Mobile Optimized */}
                <div className="space-y-6">
                    {/* Key Information Card */}
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                        <CardContent className="p-6">
                            {/* Amount & Status Row - Mobile Optimized */}
                            <div className="space-y-4 mb-6">
                                {/* Amount - Full Width on Mobile */}
                                <div className="text-center sm:text-left">
                                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(expense.amount)}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Total Amount
                                    </p>
                                </div>
                                
                                {/* Category & Status - Stack on Mobile */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center sm:justify-start">
                                    <Badge className={`${getCategoryColor(expense.category)} text-sm px-3 py-2 font-medium w-fit mx-auto sm:mx-0`}>
                                        {expense.category}
                                    </Badge>
                                    <Badge className={`${getStatusColor(expense.status)} text-sm px-3 py-2 font-medium w-fit mx-auto sm:mx-0`}>
                                        {getStatusText(expense.status)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Description - If Available */}
                            {expense.description && (
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {expense.description}
                                    </p>
                                </div>
                            )}

                            {/* Metadata Grid - Mobile Optimized */}
                            <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Expense Date</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {new Date(expense.expense_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Submitted On</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {new Date(expense.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Receipt/Proof Section - Mobile Optimized */}
                    {expense.receipt_path && (
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardContent className="p-4 sm:p-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Receipt className="h-8 w-8 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        Proof of Purchase
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                                        Receipt or invoice available for this expense
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 justify-center">
                                        <Button 
                                            onClick={() => window.open(`/expenses/${expense.id}/receipt`, '_blank')}
                                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Proof
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = `/expenses/${expense.id}/receipt?download=true`;
                                                link.download = '';
                                                link.click();
                                            }}
                                            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/20 w-full sm:w-auto"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">Download Proof</span>
                                            <span className="sm:hidden">Download</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Approval Information - Mobile Optimized */}
                    {(expense.status === 'approved' || expense.status === 'rejected') && expense.approval_notes && (
                        <Card className={`border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800 ${
                            expense.status === 'approved' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                        }`}>
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                    <div className={`flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto sm:mx-0 ${
                                        expense.status === 'approved' 
                                            ? 'bg-green-100 dark:bg-green-900/20' 
                                            : 'bg-red-100 dark:bg-red-900/20'
                                    }`}>
                                        {expense.status === 'approved' ? (
                                            <Check className="h-6 w-6 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <X className="h-6 w-6 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className={`text-sm font-medium mb-2 ${
                                            expense.status === 'approved' 
                                                ? 'text-green-700 dark:text-green-300' 
                                                : 'text-red-700 dark:text-red-300'
                                        }`}>
                                            {expense.status === 'approved' ? 'Approval Notes' : 'Rejection Reason'}
                                        </h3>
                                        <p className={`text-sm ${
                                            expense.status === 'approved' 
                                                ? 'text-green-800 dark:text-green-200' 
                                                : 'text-red-800 dark:text-red-200'
                                        }`}>
                                            {expense.approval_notes}
                                        </p>
                                        {expense.approved_at && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                {expense.status === 'approved' ? 'Approved' : 'Rejected'} on {new Date(expense.approved_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons - Mobile Optimized */}
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Edit Button - Only for pending expenses by submitter or admins */}
                                {(expense.status === 'pending' && (userRole === 'admin' || expense.added_by.email === 'current_user_email')) && (
                                    <Link href={`/expenses/${expense.id}/edit`} className="w-full">
                                        <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Expense
                                        </Button>
                                    </Link>
                                )}

                                {/* Admin Approval Actions */}
                                {userRole === 'admin' && expense.status === 'pending' && (
                                    <>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <Label htmlFor="approval-notes" className="text-sm font-medium text-green-700 dark:text-green-300 mb-3 block">
                                                Approval Notes (Optional)
                                            </Label>
                                            <Textarea
                                                id="approval-notes"
                                                placeholder="Add approval notes..."
                                                value={approvalNotes}
                                                onChange={(e) => setApprovalNotes(e.target.value)}
                                                className="border-green-200 focus:border-green-300 mb-4"
                                                rows={3}
                                            />
                                            <Button 
                                                onClick={handleApprove}
                                                disabled={isSubmitting}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Approving...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Approve Expense
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <Label htmlFor="rejection-notes" className="text-sm font-medium text-red-700 dark:text-red-300 mb-3 block">
                                                Rejection Reason (Required)
                                            </Label>
                                            <Textarea
                                                id="rejection-notes"
                                                placeholder="Provide reason for rejection..."
                                                value={rejectionNotes}
                                                onChange={(e) => setRejectionNotes(e.target.value)}
                                                className="border-red-200 focus:border-red-300 mb-4"
                                                rows={3}
                                            />
                                            <Button 
                                                onClick={handleReject}
                                                disabled={isSubmitting}
                                                variant="outline"
                                                className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20 py-3"
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                                                        Rejecting...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <X className="h-4 w-4 mr-2" />
                                                        Reject Expense
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {/* Back to List */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Link href="/expenses" className="w-full">
                                        <Button variant="outline" className="w-full py-3">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back to Expenses
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
