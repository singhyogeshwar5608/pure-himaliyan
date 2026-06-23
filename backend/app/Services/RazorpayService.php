<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class RazorpayService
{
    public function isConfigured(): bool
    {
        return filled(config('services.razorpay.key_id')) && filled(config('services.razorpay.key_secret'));
    }

    public function keyId(): string
    {
        return (string) config('services.razorpay.key_id');
    }

    public function createOrder(float $amountInRupees, string $receipt): array
    {
        $amountInPaise = (int) round($amountInRupees * 100);

        $response = Http::baseUrl((string) config('services.razorpay.base_url'))
            ->acceptJson()
            ->asJson()
            ->withBasicAuth(
                (string) config('services.razorpay.key_id'),
                (string) config('services.razorpay.key_secret'),
            )
            ->post('/orders', [
                'amount' => $amountInPaise,
                'currency' => 'INR',
                'receipt' => $receipt,
                'payment_capture' => 1,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Razorpay order create failed: '.$response->body());
        }

        $data = $response->json();

        if (! is_array($data) || ! isset($data['id'])) {
            throw new RuntimeException('Razorpay returned invalid order response.');
        }

        return $data;
    }

    public function verifySignature(string $orderId, string $paymentId, string $signature): bool
    {
        $payload = $orderId.'|'.$paymentId;
        $expected = hash_hmac('sha256', $payload, (string) config('services.razorpay.key_secret'));

        return hash_equals($expected, $signature);
    }
}
