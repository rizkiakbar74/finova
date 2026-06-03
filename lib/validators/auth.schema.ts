import { z } from "zod";

export const emailSchema = z.string().trim().email("Masukkan alamat email yang valid.").max(255);

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const signupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  email: emailSchema,
  password: passwordSchema
});

export const temporaryOnboardingSchema = z.object({
  onboarding_completed: z.literal(true)
});

export const onboardingCurrencySchema = z.literal("IDR");

export const onboardingWalletTypeSchema = z.enum([
  "cash",
  "bank",
  "e_wallet",
  "credit_card",
  "investment",
  "other"
]);

export const realOnboardingSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  currency: onboardingCurrencySchema,
  timezone: z
    .string()
    .trim()
    .min(1, "Zona waktu wajib diisi.")
    .max(80, "Zona waktu maksimal 80 karakter."),
  wallet_name: z
    .string()
    .trim()
    .min(1, "Nama dompet wajib diisi.")
    .max(80, "Nama dompet maksimal 80 karakter."),
  wallet_type: onboardingWalletTypeSchema,
  initial_balance: z.coerce
    .number({ invalid_type_error: "Saldo awal harus berupa angka." })
    .finite("Saldo awal harus berupa angka yang valid.")
    .min(-999999999999.99, "Saldo awal terlalu rendah.")
    .max(999999999999.99, "Saldo awal terlalu tinggi.")
    .multipleOf(0.01, "Saldo awal maksimal 2 angka desimal.")
});

export type RealOnboardingInput = z.infer<typeof realOnboardingSchema>;
