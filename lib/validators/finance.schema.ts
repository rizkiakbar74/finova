import { z } from "zod";
import { onboardingCurrencySchema, onboardingWalletTypeSchema } from "@/lib/validators/auth.schema";

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Pilih warna hex yang valid.");

const iconSchema = z.string().trim().min(1, "Ikon wajib diisi.").max(40, "Ikon terlalu panjang.");

export const uuidSchema = z.string().uuid("ID data tidak valid.");

export const walletCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama dompet wajib diisi.").max(80, "Nama dompet terlalu panjang."),
  type: onboardingWalletTypeSchema,
  initial_balance: z.coerce
    .number({ invalid_type_error: "Saldo awal harus berupa angka." })
    .finite("Saldo awal harus valid.")
    .min(-999999999999.99, "Saldo awal terlalu rendah.")
    .max(999999999999.99, "Saldo awal terlalu tinggi.")
    .multipleOf(0.01, "Saldo awal maksimal 2 angka desimal."),
  currency: onboardingCurrencySchema,
  color: colorSchema,
  icon: iconSchema
});

export const walletUpdateSchema = walletCreateSchema.extend({
  id: uuidSchema,
  is_archived: z.coerce.boolean().optional().default(false)
});

export const walletDeleteSchema = z.object({
  id: uuidSchema
});

export const categoryTypeSchema = z.enum(["income", "expense"]);

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(60, "Nama kategori terlalu panjang."),
  type: categoryTypeSchema,
  color: colorSchema,
  icon: iconSchema
});

export const categoryUpdateSchema = categoryCreateSchema.extend({
  id: uuidSchema,
  is_archived: z.coerce.boolean().optional().default(false)
});

export const categoryDeleteSchema = z.object({
  id: uuidSchema
});

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().max(max, message).nullable().optional()
  );

export const transactionStatusSchema = z.enum(["posted", "pending"]);

export const transactionCreateSchema = z.object({
  wallet_id: uuidSchema,
  category_id: uuidSchema,
  type: categoryTypeSchema,
  amount: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka." })
    .finite("Jumlah harus valid.")
    .positive("Jumlah harus lebih dari 0.")
    .max(999999999999.99, "Jumlah terlalu tinggi.")
    .multipleOf(0.01, "Jumlah maksimal 2 angka desimal."),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal transaksi yang valid."),
  merchant: optionalText(120, "Merchant maksimal 120 karakter."),
  notes: optionalText(500, "Catatan maksimal 500 karakter."),
  status: transactionStatusSchema,
  is_recurring: z.coerce.boolean().optional().default(false)
});

export const transactionUpdateSchema = transactionCreateSchema.extend({
  id: uuidSchema
});

export const transactionDeleteSchema = z.object({
  id: uuidSchema
});

export const transactionFilterSchema = z.object({
  query: z.string().trim().max(120).optional().default(""),
  type: z.enum(["all", "income", "expense"]).optional().default("all"),
  wallet_id: z.union([uuidSchema, z.literal("all")]).optional().default("all"),
  category_id: z.union([uuidSchema, z.literal("all")]).optional().default("all"),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""))
});

export const dashboardRangeSchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal mulai yang valid."),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal selesai yang valid.")
});

const budgetBaseSchema = z.object({
  name: z.string().trim().min(1, "Nama anggaran wajib diisi.").max(100, "Nama anggaran terlalu panjang."),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal mulai yang valid."),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal selesai yang valid."),
  total_limit: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.coerce
      .number({ invalid_type_error: "Total batas harus berupa angka." })
      .positive("Total batas harus lebih dari 0.")
      .max(999999999999.99, "Total batas terlalu tinggi.")
      .multipleOf(0.01, "Total batas maksimal 2 angka desimal.")
      .nullable()
      .optional()
  )
});

export const budgetCreateSchema = budgetBaseSchema.refine((input) => input.period_start <= input.period_end, {
    message: "Tanggal mulai anggaran harus sebelum atau sama dengan tanggal selesai.",
    path: ["period_end"]
  });

export const budgetUpdateSchema = budgetBaseSchema.extend({
  id: uuidSchema
}).refine((input) => input.period_start <= input.period_end, {
  message: "Tanggal mulai anggaran harus sebelum atau sama dengan tanggal selesai.",
  path: ["period_end"]
});

export const budgetDeleteSchema = z.object({
  id: uuidSchema
});

export const budgetItemCreateSchema = z.object({
  budget_id: uuidSchema,
  category_id: uuidSchema,
  limit_amount: z.coerce
    .number({ invalid_type_error: "Jumlah batas harus berupa angka." })
    .positive("Jumlah batas harus lebih dari 0.")
    .max(999999999999.99, "Jumlah batas terlalu tinggi.")
    .multipleOf(0.01, "Jumlah batas maksimal 2 angka desimal."),
  alert_threshold: z.coerce
    .number({ invalid_type_error: "Ambang peringatan harus berupa angka." })
    .positive("Ambang peringatan harus lebih dari 0.")
    .max(100, "Ambang peringatan tidak boleh melebihi 100.")
});

export const budgetItemUpdateSchema = budgetItemCreateSchema.extend({
  id: uuidSchema
});

export const budgetItemDeleteSchema = z.object({
  id: uuidSchema,
  budget_id: uuidSchema
});

export const goalStatusSchema = z.enum(["active", "completed", "archived"]);

export const savingsGoalCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama tujuan wajib diisi.").max(100, "Nama tujuan terlalu panjang."),
  target_amount: z.coerce
    .number({ invalid_type_error: "Target harus berupa angka." })
    .positive("Target harus lebih dari 0.")
    .max(999999999999.99, "Target terlalu tinggi.")
    .multipleOf(0.01, "Target maksimal 2 angka desimal."),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal target yang valid."),
  icon: iconSchema,
  color: colorSchema,
  status: goalStatusSchema.optional().default("active")
});

export const savingsGoalUpdateSchema = savingsGoalCreateSchema.extend({
  id: uuidSchema
});

export const savingsGoalDeleteSchema = z.object({
  id: uuidSchema
});

export const goalContributionCreateSchema = z.object({
  goal_id: uuidSchema,
  wallet_id: z.union([uuidSchema, z.literal("")]).optional().transform((value) => value || null),
  amount: z.coerce
    .number({ invalid_type_error: "Jumlah kontribusi harus berupa angka." })
    .positive("Jumlah kontribusi harus lebih dari 0.")
    .max(999999999999.99, "Jumlah kontribusi terlalu tinggi.")
    .multipleOf(0.01, "Jumlah kontribusi maksimal 2 angka desimal."),
  contribution_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal kontribusi yang valid."),
  notes: optionalText(500, "Catatan kontribusi maksimal 500 karakter.")
});

export const goalContributionDeleteSchema = z.object({
  id: uuidSchema,
  goal_id: uuidSchema
});

export const reportTypeSchema = z.enum([
  "monthly_summary",
  "spending_by_category",
  "cashflow",
  "savings_progress"
]);

export const reportExportSchema = z
  .object({
    report_type: reportTypeSchema,
    export_format: z.literal("csv"),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal mulai yang valid."),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal selesai yang valid.")
  })
  .refine((input) => input.date_from <= input.date_to, {
    message: "Tanggal mulai laporan harus sebelum atau sama dengan tanggal selesai.",
    path: ["date_to"]
  });

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  z.string().url("Masukkan URL yang valid.").max(500, "URL terlalu panjang.").nullable().optional()
);

const optionalTime = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  z.string().regex(/^\d{2}:\d{2}$/, "Pilih waktu yang valid.").nullable().optional()
);

export const userSettingsUpdateSchema = z.object({
  full_name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter.").max(100, "Nama lengkap terlalu panjang."),
  avatar_url: optionalUrl,
  currency: onboardingCurrencySchema,
  language: z.literal("id"),
  theme: z.enum(["light", "dark", "system"]),
  timezone: z.string().trim().min(1, "Zona waktu wajib diisi.").max(80, "Zona waktu terlalu panjang."),
  date_format: z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]),
  budget_alerts: z.coerce.boolean().optional().default(false),
  bill_reminders: z.coerce.boolean().optional().default(false),
  goal_milestones: z.coerce.boolean().optional().default(false),
  subscription_renewals: z.coerce.boolean().optional().default(false),
  security_alerts: z.coerce.boolean().optional().default(false),
  quiet_hours_enabled: z.coerce.boolean().optional().default(false),
  quiet_hours_start: optionalTime,
  quiet_hours_end: optionalTime
});

export const recurringFrequencySchema = z.enum(["weekly", "monthly", "yearly"]);
export const recurringBillStatusSchema = z.enum(["active", "paused", "overdue"]);

export const recurringBillCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama tagihan wajib diisi.").max(120, "Nama tagihan terlalu panjang."),
  amount: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka." })
    .positive("Jumlah harus lebih dari 0.")
    .max(999999999999.99, "Jumlah terlalu tinggi.")
    .multipleOf(0.01, "Jumlah maksimal 2 angka desimal."),
  category_id: z.union([uuidSchema, z.literal("")]).optional().transform((value) => value || null),
  wallet_id: z.union([uuidSchema, z.literal("")]).optional().transform((value) => value || null),
  frequency: recurringFrequencySchema,
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal jatuh tempo yang valid."),
  reminder_days: z.coerce.number().int("Hari pengingat harus berupa bilangan bulat.").min(0).max(365),
  auto_pay: z.coerce.boolean().optional().default(false),
  status: recurringBillStatusSchema
});

export const recurringBillUpdateSchema = recurringBillCreateSchema.extend({
  id: uuidSchema
});

export const recurringBillDeleteSchema = z.object({
  id: uuidSchema
});

export const subscriptionCycleSchema = z.enum(["monthly", "yearly"]);
export const subscriptionStatusSchema = z.enum(["active", "cancelled", "paused"]);

export const subscriptionCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama langganan wajib diisi.").max(120, "Nama langganan terlalu panjang."),
  amount: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka." })
    .positive("Jumlah harus lebih dari 0.")
    .max(999999999999.99, "Jumlah terlalu tinggi.")
    .multipleOf(0.01, "Jumlah maksimal 2 angka desimal."),
  billing_cycle: subscriptionCycleSchema,
  next_renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal perpanjangan yang valid."),
  category: optionalText(80, "Kategori maksimal 80 karakter."),
  auto_renew: z.coerce.boolean().optional().default(false),
  status: subscriptionStatusSchema,
  unused_flag: z.coerce.boolean().optional().default(false)
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.extend({
  id: uuidSchema
});

export const subscriptionDeleteSchema = z.object({
  id: uuidSchema
});

export const notificationUpdateSchema = z.object({
  id: uuidSchema
});

export type WalletCreateInput = z.infer<typeof walletCreateSchema>;
export type WalletUpdateInput = z.infer<typeof walletUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionFilters = z.infer<typeof transactionFilterSchema>;
export type DashboardRange = z.infer<typeof dashboardRangeSchema>;
export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;
export type BudgetItemCreateInput = z.infer<typeof budgetItemCreateSchema>;
export type BudgetItemUpdateInput = z.infer<typeof budgetItemUpdateSchema>;
export type SavingsGoalCreateInput = z.infer<typeof savingsGoalCreateSchema>;
export type SavingsGoalUpdateInput = z.infer<typeof savingsGoalUpdateSchema>;
export type GoalContributionCreateInput = z.infer<typeof goalContributionCreateSchema>;
export type ReportExportInput = z.infer<typeof reportExportSchema>;
export type UserSettingsUpdateInput = z.infer<typeof userSettingsUpdateSchema>;
export type RecurringBillCreateInput = z.infer<typeof recurringBillCreateSchema>;
export type RecurringBillUpdateInput = z.infer<typeof recurringBillUpdateSchema>;
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>;
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;
