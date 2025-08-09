<?php

namespace App\Http\Controllers;

use App\Models\CommissionRate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CommissionRateController extends Controller
{
    /**
     * Display a listing of commission rates.
     */
    public function index()
    {
        $rates = CommissionRate::ordered()->get();
        
        return Inertia::render('CommissionRates/Index', [
            'rates' => $rates,
        ]);
    }

    /**
     * Show the form for creating a new commission rate.
     */
    public function create()
    {
        return Inertia::render('CommissionRates/Create');
    }

    /**
     * Store a newly created commission rate.
     */
    public function store(Request $request)
    {
        $request->validate([
            'sales_threshold' => 'required|numeric|min:0.01',
            'commission_amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);

        CommissionRate::create([
            'sales_threshold' => $request->sales_threshold,
            'commission_amount' => $request->commission_amount,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return redirect()->route('commission-rates.index')
            ->with('success', 'Commission rate created successfully.');
    }

    /**
     * Show the form for editing the specified commission rate.
     */
    public function edit(CommissionRate $commissionRate)
    {
        return Inertia::render('CommissionRates/Edit', [
            'rate' => $commissionRate,
        ]);
    }

    /**
     * Update the specified commission rate.
     */
    public function update(Request $request, CommissionRate $commissionRate)
    {
        $request->validate([
            'sales_threshold' => 'required|numeric|min:0.01',
            'commission_amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $commissionRate->update([
            'sales_threshold' => $request->sales_threshold,
            'commission_amount' => $request->commission_amount,
            'description' => $request->description,
            'is_active' => $request->is_active,
        ]);

        return redirect()->route('commission-rates.index')
            ->with('success', 'Commission rate updated successfully.');
    }

    /**
     * Remove the specified commission rate.
     */
    public function destroy(CommissionRate $commissionRate)
    {
        $commissionRate->delete();

        return redirect()->route('commission-rates.index')
            ->with('success', 'Commission rate deleted successfully.');
    }

    /**
     * Toggle the active status of a commission rate.
     */
    public function toggleStatus(CommissionRate $commissionRate)
    {
        $commissionRate->update([
            'is_active' => !$commissionRate->is_active,
        ]);

        return back()->with('success', 'Commission rate status updated successfully.');
    }

    /**
     * Get commission calculation preview.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'sales_amount' => 'required|numeric|min:0',
        ]);

        $salesAmount = $request->sales_amount;
        $breakdown = CommissionRate::getCommissionBreakdown($salesAmount);
        $nextThreshold = CommissionRate::getNextThreshold($salesAmount);

        return response()->json([
            'breakdown' => $breakdown,
            'next_threshold' => $nextThreshold,
            'sales_amount' => $salesAmount,
        ]);
    }
}
