<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            abort(403);
        }

        $expenses = Expense::with('addedBy')
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
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Calculate summary statistics
        $totalExpenses = Expense::sum('amount');
        $totalSales = Sale::sum('total_amount');
        $totalProfit = $totalSales - $totalExpenses;

        $monthlyExpenses = Expense::selectRaw('MONTH(expense_date) as month, SUM(amount) as total')
            ->whereYear('expense_date', date('Y'))
            ->groupBy('month')
            ->get();

        $categoryTotals = Expense::selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get();

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'categories' => Expense::getCategories(),
            'summary' => [
                'total_expenses' => $totalExpenses,
                'total_sales' => $totalSales,
                'total_profit' => $totalProfit,
                'monthly_expenses' => $monthlyExpenses,
                'category_totals' => $categoryTotals,
            ],
            'filters' => $request->only(['search', 'category', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new expense.
     */
    public function create()
    {
        return Inertia::render('Expenses/Create', [
            'categories' => Expense::getCategories(),
        ]);
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|in:' . implode(',', array_keys(Expense::getCategories())),
            'expense_date' => 'required|date',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'category' => $request->category,
            'expense_date' => $request->expense_date,
            'added_by' => $user->id,
        ];

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            $data['receipt_path'] = $path;
        }

        Expense::create($data);

        return redirect()->route('expenses.index')->with('success', 'Expense added successfully.');
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense)
    {
        $expense->load('addedBy');

        return Inertia::render('Expenses/Show', [
            'expense' => $expense,
        ]);
    }

    /**
     * Show the form for editing the specified expense.
     */
    public function edit(Expense $expense)
    {
        return Inertia::render('Expenses/Edit', [
            'expense' => $expense,
            'categories' => Expense::getCategories(),
        ]);
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, Expense $expense)
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|in:' . implode(',', array_keys(Expense::getCategories())),
            'expense_date' => 'required|date',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
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

        if (!$user->isAdmin()) {
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
     * Download receipt file.
     */
    public function downloadReceipt(Expense $expense)
    {
        if (!$expense->receipt_path || !Storage::disk('public')->exists($expense->receipt_path)) {
            abort(404);
        }

        return response()->download(storage_path('app/public/' . $expense->receipt_path));
    }
}
