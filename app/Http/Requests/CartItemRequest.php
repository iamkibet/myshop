<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class CartItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('isManager');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'sale_price' => 'required|numeric|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $product = Product::find($this->input('product_id'));
            
            if ($product) {
                // Check if sale price is at least MSRP
                if ($this->input('sale_price') < $product->msrp) {
                    $validator->errors()->add('sale_price', 'Sale price must be at least the MSRP.');
                }

                // Check if we have enough stock
                if ($this->input('quantity') > $product->quantity_on_hand) {
                    $validator->errors()->add('quantity', 'Not enough stock available.');
                }
            }
        });
    }
} 