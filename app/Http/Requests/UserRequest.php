<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
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
        $user = $this->route('user');
        $userId = $user ? $user->id : null;

        $emailRule = $userId
            ? "unique:users,email,{$userId}"
            : 'unique:users,email';

        return [
            'name' => 'required|string|max:255',
            'email' => "required|email|{$emailRule}",
            'password' => $this->isMethod('POST') ? 'required|string|min:8' : 'nullable|string|min:8',
            'role' => 'required|in:admin,manager',
        ];
    }
}
