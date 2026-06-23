<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'inquiries' => Inquiry::query()->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'message' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'string', 'max:100'],
        ]);

        $inquiry = Inquiry::query()->create([
            'name' => trim($data['name']),
            'email' => isset($data['email']) ? trim((string) $data['email']) : null,
            'phone' => trim($data['phone']),
            'address' => isset($data['address']) ? trim((string) $data['address']) : null,
            'message' => isset($data['message']) ? trim((string) $data['message']) : null,
            'source' => isset($data['source']) ? trim((string) $data['source']) : 'website',
            'status' => 'new',
        ]);

        return response()->json([
            'message' => 'Inquiry submitted successfully.',
            'inquiry' => $inquiry,
        ], 201);
    }
}
