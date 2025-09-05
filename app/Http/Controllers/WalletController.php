<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use App\Models\Payout;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /**
     * Display the wallet dashboard for managers.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->isManager()) {
            abort(403);
        }

        $wallet = $user->wallet()->firstOrCreate([
            'user_id' => $user->id,
        ], [
            'balance' => 0,
            'total_earned' => 0,
            'total_paid_out' => 0,
        ]);

        // Calculate current sales and commission data
        $totalSales = $user->sales()->sum('total_amount');
        $qualifiedSales = $wallet->getQualifiedSales($totalSales);
        $qualifiedCommission = $wallet->getQualifiedCommission($totalSales);
        $qualifiedCommissionBreakdown = $wallet->getQualifiedCommissionBreakdown($totalSales);
        $carryForwardAmount = $wallet->getCarryForwardAmount($totalSales);
        $nextMilestoneAmount = $wallet->getNextMilestoneAmount($totalSales);
        
        // Calculate commission difference (what should be added to balance)
        $commissionDifference = $qualifiedCommission - $wallet->balance;
        
        // Calculate total earned from qualified sales (not cumulative)
        $totalEarnedFromQualifiedSales = $qualifiedCommission;

        // Ensure commissionBreakdown has the required structure
        if (!isset($qualifiedCommissionBreakdown['breakdown'])) {
            $qualifiedCommissionBreakdown['breakdown'] = [];
        }

        $recentPayouts = $user->payouts()
            ->with('processedBy')
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Wallet/Index', [
            'wallet' => $wallet,
            'totalSales' => $totalSales,
            'qualifiedSales' => $qualifiedSales,
            'carryForwardAmount' => $carryForwardAmount,
            'commissionBreakdown' => $qualifiedCommissionBreakdown,
            'nextMilestoneAmount' => $nextMilestoneAmount,
            'expectedCommission' => $qualifiedCommission,
            'commissionDifference' => $commissionDifference,
            'totalEarnedFromQualifiedSales' => $totalEarnedFromQualifiedSales,
            'recentPayouts' => $recentPayouts,
        ]);
    }

    /**
     * Display all managers' wallets for admin.
     */
    public function adminIndex(Request $request)
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            abort(403);
        }

        $managers = User::where('role', 'manager')
            ->with(['wallet', 'sales'])
            ->withCount('sales')
            ->get()
            ->map(function ($manager) {
                $totalSales = $manager->sales->sum('total_amount');
                
                // Ensure wallet exists for this manager
                $wallet = $manager->wallet;
                if (!$wallet) {
                    // Create wallet if it doesn't exist
                    $wallet = $manager->wallet()->create([
                        'balance' => 0,
                        'total_earned' => 0,
                        'total_paid_out' => 0,
                        'paid_sales' => 0,
                    ]);
                }
                
                $qualifiedSales = $wallet->getQualifiedSales($totalSales);
                $qualifiedCommission = $wallet->getQualifiedCommission($totalSales);
                $qualifiedCommissionBreakdown = $wallet->getQualifiedCommissionBreakdown($totalSales);
                $carryForwardAmount = $wallet->getCarryForwardAmount($totalSales);
                $nextMilestoneAmount = $wallet->getNextMilestoneAmount($totalSales);

                // Ensure commissionBreakdown has the required structure
                if (!isset($qualifiedCommissionBreakdown['breakdown'])) {
                    $qualifiedCommissionBreakdown['breakdown'] = [];
                }

                return [
                    'id' => $manager->id,
                    'name' => $manager->name,
                    'email' => $manager->email,
                    'total_sales' => $totalSales,
                    'qualified_sales' => $qualifiedSales,
                    'carry_forward_amount' => $carryForwardAmount,
                    'sales_count' => $manager->sales_count,
                    'expected_commission' => $qualifiedCommission,
                    'next_milestone_amount' => $nextMilestoneAmount,
                    'commission_breakdown' => $qualifiedCommissionBreakdown,
                    'wallet' => $wallet ? [
                        'balance' => $wallet->balance,
                        'total_earned' => $wallet->total_earned,
                        'total_paid_out' => $wallet->total_paid_out,
                        'paid_sales' => $wallet->paid_sales,
                    ] : [
                        'balance' => 0,
                        'total_earned' => 0,
                        'total_paid_out' => 0,
                        'paid_sales' => 0,
                    ],
                ];
            });

        return Inertia::render('Wallet/AdminIndex', [
            'managers' => $managers,
        ]);
    }

    /**
     * Show manager details with payout history.
     */
    public function show(Request $request, User $manager)
    {
        $user = $request->user();

        if (!$user->isAdmin() || !$manager->isManager()) {
            abort(403);
        }

        $wallet = $manager->wallet()->firstOrCreate([
            'user_id' => $manager->id,
        ], [
            'balance' => 0,
            'total_earned' => 0,
            'total_paid_out' => 0,
        ]);

        $payouts = $manager->payouts()
            ->with('processedBy')
            ->latest()
            ->paginate(15);

        return Inertia::render('Wallet/Show', [
            'manager' => [
                'id' => $manager->id,
                'name' => $manager->name,
                'email' => $manager->email,
            ],
            'wallet' => $wallet,
            'payouts' => $payouts,
        ]);
    }

    /**
     * Process a payout for a manager.
     */
    public function processPayout(Request $request, User $manager)
    {
        $user = $request->user();

        if (!$user->isAdmin() || !$manager->isManager()) {
            abort(403);
        }

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $wallet = $manager->wallet()->firstOrCreate([
            'user_id' => $manager->id,
        ], [
            'balance' => 0,
            'total_earned' => 0,
            'total_paid_out' => 0,
        ]);

        if ($wallet->balance < $request->amount) {
            return back()->withErrors(['amount' => 'Insufficient balance for payout.']);
        }

        DB::transaction(function () use ($request, $manager, $wallet, $user) {
            // Create payout record
            $payout = Payout::create([
                'user_id' => $manager->id,
                'processed_by' => $user->id,
                'amount' => $request->amount,
                'status' => 'completed',
                'notes' => $request->notes,
                'processed_at' => now(),
            ]);

            // Update wallet balance
            $wallet->processPayout($request->amount);
            
            // Update paid sales
            $totalSales = $manager->sales()->sum('total_amount');
            $wallet->updatePaidSales($request->amount, $totalSales);
        });

        return back()->with('success', 'Payout processed successfully.');
    }

}
