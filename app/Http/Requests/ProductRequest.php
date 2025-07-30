<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('isAdmin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productId = $this->route('product');
        $skuRule = $productId 
            ? "unique:products,sku,{$productId}" 
            : 'unique:products,sku';

        return [
            'name' => 'required|string|max:255',
            'sku' => "required|string|max:255|{$skuRule}",
            'cost_price' => 'required|numeric|min:0',
            'msrp' => 'required|numeric|min:0|gte:cost_price',
            'quantity_on_hand' => 'required|integer|min:0',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'msrp.gte' => 'The MSRP must be greater than or equal to the cost price.',
        ];
    }
} 