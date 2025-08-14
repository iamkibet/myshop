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
                return '✓ Approved';
            case 'rejected':
                return '✗ Rejected';
            default:
                return '⏳ Pending Approval';
        }
    };

    return (
        <AppLayout>
            <Head title={`Expense: ${expense.title}`} />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl pb-20 sm:pb-6">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                                <Link href="/expenses" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    Expense Details
                                </h1>
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                {userRole === 'manager' ? 'Your expense submission details' : 'Expense details and approval'}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(expense.status)} text-sm px-3 py-1`}>
                                <span className="flex items-center gap-1">
                                    {getStatusIcon(expense.status)}
                                    {getStatusText(expense.status)}
                                </span>
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                    {/* Main Expense Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg sm:text-xl">Expense Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            {expense.title}
                                        </h2>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge className={`${getCategoryColor(expense.category)} text-sm px-3 py-1`}>
                                                {expense.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-center sm:text-right">
                                        <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(expense.amount)}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Amount
                                        </p>
                                    </div>
                                </div>

                                {expense.description && (
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            Description
                                        </Label>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {expense.description}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Expense Date</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(expense.expense_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Submitted By</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {expense.added_by.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {expense.added_by.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Submitted on {new Date(expense.created_at).toLocaleDateString()} at {new Date(expense.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Receipt/Proof Section */}
                        {expense.receipt_path && (
                            <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg sm:text-xl">Proof of Purchase</CardTitle>
                                    <CardDescription>Receipt or invoice for this expense</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Receipt Available
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                            Click below to view or download the receipt
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                            <Link 
                                                href={`/expenses/${expense.id}/receipt`}
                                                target="_blank"
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Receipt
                                            </Link>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => window.open(`/expenses/${expense.id}/receipt`, '_blank')}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Approval Information */}
                        {(expense.status === 'approved' || expense.status === 'rejected') && (
                            <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg sm:text-xl">
                                        {expense.status === 'approved' ? 'Approval Details' : 'Rejection Details'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {expense.status === 'approved' ? 'Approved by' : 'Rejected by'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {expense.approved_by?.name || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {expense.status === 'approved' ? 'Approved on' : 'Rejected on'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {expense.approved_at ? new Date(expense.approved_at).toLocaleDateString() : 'Unknown'}
                                            </p>
                                        </div>
                                    </div>

                                    {expense.approval_notes && (
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                                {expense.status === 'approved' ? 'Approval Notes' : 'Rejection Reason'}
                                            </Label>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {expense.approval_notes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Actions & Status */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Current Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                                        expense.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20' :
                                        expense.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20' :
                                        'bg-yellow-100 dark:bg-yellow-900/20'
                                    }`}>
                                        {getStatusIcon(expense.status)}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        {getStatusText(expense.status)}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {expense.status === 'pending' ? 'Waiting for admin review' :
                                         expense.status === 'approved' ? 'Expense has been approved' :
                                         'Expense has been rejected'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Edit Button - Only for pending expenses by submitter or admins */}
                                {(expense.status === 'pending' && (userRole === 'admin' || expense.added_by.email === 'current_user_email')) && (
                                    <Link href={`/expenses/${expense.id}/edit`} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Expense
                                        </Button>
                                    </Link>
                                )}

                                {/* Admin Approval Actions */}
                                {userRole === 'admin' && expense.status === 'pending' && (
                                    <>
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <Label htmlFor="approval-notes" className="text-sm font-medium text-green-700 dark:text-green-300 mb-2 block">
                                                Approval Notes (Optional)
                                            </Label>
                                            <Textarea
                                                id="approval-notes"
                                                placeholder="Add approval notes..."
                                                value={approvalNotes}
                                                onChange={(e) => setApprovalNotes(e.target.value)}
                                                className="border-green-200 focus:border-green-300 mb-3"
                                                rows={3}
                                            />
                                            <Button 
                                                onClick={handleApprove}
                                                disabled={isSubmitting}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
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

                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <Label htmlFor="rejection-notes" className="text-sm font-medium text-red-700 dark:text-red-300 mb-2 block">
                                                Rejection Reason (Required)
                                            </Label>
                                            <Textarea
                                                id="rejection-notes"
                                                placeholder="Provide reason for rejection..."
                                                value={rejectionNotes}
                                                onChange={(e) => setRejectionNotes(e.target.value)}
                                                className="border-red-200 focus:border-red-300 mb-3"
                                                rows={3}
                                            />
                                            <Button 
                                                onClick={handleReject}
                                                disabled={isSubmitting}
                                                variant="outline"
                                                className="w-full border-red-200 text-red-700 hover:bg-red-50"
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
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <Link href="/expenses" className="w-full">
                                        <Button variant="outline" className="w-full">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back to Expenses
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
