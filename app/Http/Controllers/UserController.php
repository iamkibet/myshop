<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $users = User::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role', $role);
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Users/Form');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): Response
    {
        // Load user with sales and related data
        $user->load(['sales' => function ($query) {
            $query->with(['saleItems.productVariant.product'])
                ->orderBy('created_at', 'desc');
        }]);

        // Calculate sales statistics
        $salesStats = [
            'total_sales' => $user->sales->count(),
            'total_revenue' => $user->sales->sum('total_amount'),
            'total_products_sold' => $user->sales->sum(function ($sale) {
                return $sale->saleItems->sum('quantity');
            }),
            'average_sale_value' => $user->sales->count() > 0
                ? $user->sales->avg('total_amount')
                : 0,
            'today_sales' => $user->sales->where('created_at', '>=', now()->startOfDay())->sum('total_amount'),
            'this_week_sales' => $user->sales->where('created_at', '>=', now()->startOfWeek())->sum('total_amount'),
            'this_month_sales' => $user->sales->where('created_at', '>=', now()->startOfMonth())->sum('total_amount'),
        ];

        // Get recent sales for display
        $recentSales = $user->sales->take(10);

        return Inertia::render('Users/Show', [
            'user' => $user,
            'salesStats' => $salesStats,
            'recentSales' => $recentSales,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        return Inertia::render('Users/Form', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): \Illuminate\Http\RedirectResponse
    {
        if ($user->id === request()->user()->id) {
            return redirect()->route('users.index')->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
