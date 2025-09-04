<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Models\SaleItem; // Added this import for gross profit calculation

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Allow both admins and managers to view expenses
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        $expenses = Expense::with(['addedBy', 'approvedBy'])
            ->when($request->search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->where('expense_date', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->where('expense_date', '<=', $dateTo);
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            // Managers can only see their own expenses, admins see all
            ->when(!$user->isAdmin(), function ($query) use ($user) {
                $query->where('added_by', $user->id);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $totalExpenses = Expense::approved()->when(!$user->isAdmin(), function ($query) use ($user) {
            $query->where('added_by', $user->id);
        })->sum('amount');

        // Only calculate profit data for admins
        $summary = [
            'total_expenses' => $totalExpenses,
            'monthly_expenses' => Expense::approved()->when(!$user->isAdmin(), function ($query) use ($user) {
                $query->where('added_by', $user->id);
            })
                ->selectRaw('MONTH(expense_date) as month, SUM(amount) as total')
                ->whereYear('expense_date', date('Y'))
                ->groupBy('month')
                ->get(),
            'category_totals' => Expense::approved()->when(!$user->isAdmin(), function ($query) use ($user) {
                $query->where('added_by', $user->id);
            })
                ->selectRaw('category, SUM(amount) as total')
                ->groupBy('category')
                ->get(),
        ];

        // Add profit data only for admins
        if ($user->isAdmin()) {
            $totalSales = Sale::when(!$user->isAdmin(), function ($query) use ($user) {
                $query->where('manager_id', $user->id);
            })->sum('total_amount');

            $grossProfit = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->when(!$user->isAdmin(), function ($query) use ($user) {
                    $query->where('sales.manager_id', $user->id);
                })
                ->selectRaw('SUM((sale_items.unit_price - products.cost_price) * sale_items.quantity) as gross_profit')
                ->value('gross_profit') ?? 0;

            $netProfit = $grossProfit - $totalExpenses;
            $netProfitMargin = $totalSales > 0 ? ($netProfit / $totalSales) * 100 : 0;

            $summary['total_sales'] = $totalSales;
            $summary['total_gross_profit'] = $grossProfit;
            $summary['total_profit'] = $netProfit;
            $summary['net_profit_margin'] = round($netProfitMargin, 1);
        }

        // Get pending expenses count for admins
        $pendingExpensesCount = $user->isAdmin() ? Expense::pending()->count() : 0;

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'categories' => Expense::getCategories(),
            'summary' => $summary,
            'filters' => $request->only(['search', 'category', 'date_from', 'date_to', 'status']),
            'userRole' => $user->role,
            'pendingExpensesCount' => $pendingExpensesCount,
        ]);
    }

    /**
     * Show the form for creating a new expense.
     */
    public function create()
    {
        $user = request()->user();
        
        // Allow both admins and managers to create expenses
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        return Inertia::render('Expenses/Create', [
            'categories' => Expense::getCategories(),
            'userRole' => $user->role,
        ]);
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Allow both admins and managers to create expenses
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|in:' . implode(',', array_keys(Expense::getCategories())),
            'expense_date' => 'required|date',
            'receipt' => $user->isManager() ? 'required|file|mimes:jpg,jpeg,png,pdf|max:5120' : 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'category' => $request->category,
            'expense_date' => $request->expense_date,
            'added_by' => $user->id,
            'status' => $user->isAdmin() ? 'approved' : 'pending',
            'is_approved' => $user->isAdmin(),
        ];

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            $data['receipt_path'] = $path;
        }

        $expense = Expense::create($data);

        // Create notification for expense approval if created by manager
        if ($user->isManager()) {
            $notificationService = new \App\Services\NotificationService();
            $notificationService->createExpenseApprovalNotification($expense);
        }

        return redirect()->route('expenses.index')->with('success', 'Expense added successfully.');
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense)
    {
        $user = request()->user();
        
        // Allow both admins and managers to view expenses
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        // Managers can only view their own expenses
        if ($user->isManager() && $expense->added_by !== $user->id) {
            abort(403);
        }

        $expense->load('addedBy');

        return Inertia::render('Expenses/Show', [
            'expense' => $expense,
            'userRole' => $user->role,
        ]);
    }

    /**
     * Show the form for editing the specified expense.
     */
    public function edit(Expense $expense)
    {
        $user = request()->user();
        
        // Allow both admins and managers to edit expenses
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        // Managers can only edit their own expenses
        if ($user->isManager() && $expense->added_by !== $user->id) {
            abort(403);
        }

        return Inertia::render('Expenses/Edit', [
            'expense' => $expense,
            'categories' => Expense::getCategories(),
            'userRole' => $user->role,
        ]);
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, Expense $expense)
    {
        $user = $request->user();

        // Allow both admins and managers to update expenses
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        // Managers can only update their own expenses
        if ($user->isManager() && $expense->added_by !== $user->id) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|in:' . implode(',', array_keys(Expense::getCategories())),
            'expense_date' => 'required|date',
            'receipt' => $user->isManager() ? 'required|file|mimes:jpg,jpeg,png,pdf|max:5120' : 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'category' => $request->category,
            'expense_date' => $request->expense_date,
        ];

        if ($request->hasFile('receipt')) {
            // Delete old receipt if exists
            if ($expense->receipt_path) {
                Storage::disk('public')->delete($expense->receipt_path);
            }

            $path = $request->file('receipt')->store('receipts', 'public');
            $data['receipt_path'] = $path;
        }

        $expense->update($data);

        return redirect()->route('expenses.index')->with('success', 'Expense updated successfully.');
    }

    /**
     * Remove the specified expense.
     */
    public function destroy(Request $request, Expense $expense)
    {
        $user = $request->user();

        // Allow both admins and managers to delete expenses
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        // Managers can only delete their own expenses
        if ($user->isManager() && $expense->added_by !== $user->id) {
            abort(403);
        }

        // Delete receipt file if exists
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $expense->delete();

        return redirect()->route('expenses.index')->with('success', 'Expense deleted successfully.');
    }

    /**
     * View or download receipt file.
     */
    public function downloadReceipt(Expense $expense)
    {
        $user = request()->user();
        
        // Allow both admins and managers to view/download receipts
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403);
        }

        // Managers can only view/download receipts for their own expenses
        if ($user->isManager() && $expense->added_by !== $user->id) {
            abort(403);
        }

        if (!$expense->receipt_path || !Storage::disk('public')->exists($expense->receipt_path)) {
            abort(404);
        }

        $filePath = storage_path('app/public/' . $expense->receipt_path);
        $fileName = basename($expense->receipt_path);
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        // Check if user wants to download the file
        $forceDownload = request()->has('download') && request('download') === 'true';

        // For images and PDFs, display in browser unless download is requested
        if (in_array($fileExtension, ['jpg', 'jpeg', 'png', 'gif', 'pdf']) && !$forceDownload) {
            $file = Storage::disk('public')->get($expense->receipt_path);
            $mimeType = Storage::disk('public')->mimeType($expense->receipt_path);
            
            return response($file, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $fileName . '"',
            ]);
        } else {
            // Force download for other file types or when download is requested
            return response()->download($filePath, $fileName);
        }
    }

    /**
     * Approve an expense.
     */
    public function approve(Request $request, Expense $expense)
    {
        $user = request()->user();
        
        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'approval_notes' => 'nullable|string|max:1000',
        ]);

        $expense->update([
            'status' => 'approved',
            'is_approved' => true,
            'approved_at' => now(),
            'approved_by' => $user->id,
            'approval_notes' => $request->approval_notes,
        ]);

        // Create notification for expense approval
        $notificationService = new \App\Services\NotificationService();
        $notificationService->createExpenseStatusNotification($expense, 'approved');

        return redirect()->back()->with('success', 'Expense approved successfully.');
    }

    /**
     * Reject an expense.
     */
    public function reject(Request $request, Expense $expense)
    {
        $user = request()->user();
        
        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'approval_notes' => 'required|string|max:1000',
        ]);

        $expense->update([
            'status' => 'rejected',
            'is_approved' => false,
            'approved_at' => now(),
            'approved_by' => $user->id,
            'approval_notes' => $request->approval_notes,
        ]);

        // Create notification for expense rejection
        $notificationService = new \App\Services\NotificationService();
        $notificationService->createExpenseStatusNotification($expense, 'rejected');

        return redirect()->back()->with('success', 'Expense rejected successfully.');
    }

    /**
     * Get pending expenses for admin approval.
     */
    public function pending()
    {
        $user = request()->user();
        
        if (!$user->isAdmin()) {
            abort(403);
        }

        $pendingExpenses = Expense::with(['addedBy', 'approvedBy'])
            ->pending()
            ->latest()
            ->paginate(20);

        return Inertia::render('Expenses/Pending', [
            'pendingExpenses' => $pendingExpenses,
        ]);
    }
}
