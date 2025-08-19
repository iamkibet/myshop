<?php

namespace App\Http\Requests;

use Illuminate\Container\Attributes\Auth;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class ProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        Log::info('ProductRequest::authorize called');
        return auth()->user()->can('isAdmin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        Log::info('ProductRequest::rules - START');

        $productId = $this->route('product')?->id;



        $rules = [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100', // Temporarily removed unique validation
            'description' => 'nullable|string|max:1000',
            'brand' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'msrp' => 'required|numeric|min:0',
            'quantity_on_hand' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'images' => 'nullable|string', // Changed from array to string (JSON)
            'image_files' => 'nullable|array',
            'image_files.*' => 'nullable|image|mimes:jpeg,png,gif,webp|max:5120', // 5MB max
            'sizes' => 'nullable|string', // Changed from array to string (JSON)
            'colors' => 'nullable|string', // Changed from array to string (JSON)
            'is_active' => 'boolean',
        ];


        return $rules;
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {


        $validator->after(function ($validator) {


            // Custom validation for msrp >= cost_price
            $costPrice = $this->input('cost_price');
            $msrp = $this->input('msrp');



            if ($costPrice && $msrp && floatval($msrp) < floatval($costPrice)) {
                $validator->errors()->add('msrp', 'The MSRP must be greater than or equal to the cost price.');
            }

            // Validate JSON fields
            $jsonFields = ['sizes', 'colors', 'images'];
            foreach ($jsonFields as $field) {
                $value = $this->input($field);
                if ($value && is_string($value)) {
                    $decoded = json_decode($value, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $validator->errors()->add($field, "Invalid JSON format for {$field}");
                    }
                }
            }


        });


    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'msrp.gte' => 'The MSRP must be greater than or equal to the cost price.',
            'sizes.string' => 'Sizes must be a valid JSON string.',
            'colors.string' => 'Colors must be a valid JSON string.',
            'images.string' => 'Images must be a valid JSON string.',
        ];
    }
}
