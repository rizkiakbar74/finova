import type { SupabaseClient } from "@supabase/supabase-js";
import { getDashboardData } from "@/lib/services/dashboard";
import type { ReportExportInput } from "@/lib/validators/finance.schema";

export interface ReportExportRecord {
  id: string;
  report_type: string;
  export_format: "csv" | "pdf";
  date_from: string;
  date_to: string;
  status: "pending" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
}

function csvEscape(value: string | number | null | undefined) {
  const raw = value === null || value === undefined ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\r\n");
}

export async function listReportExports(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("report_exports")
    .select("id, report_type, export_format, date_from, date_to, status, error_message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);
}

async function createExportLog(
  supabase: SupabaseClient,
  userId: string,
  input: ReportExportInput,
  status: "completed" | "failed",
  errorMessage?: string
) {
  await supabase.from("report_exports").insert({
    user_id: userId,
    report_type: input.report_type,
    export_format: input.export_format,
    date_from: input.date_from,
    date_to: input.date_to,
    status,
    error_message: errorMessage || null
  });
}

export async function buildCsvReport(supabase: SupabaseClient, userId: string, input: ReportExportInput) {
  const { data: dashboard, error } = await getDashboardData(supabase, userId, {
    date_from: input.date_from,
    date_to: input.date_to
  });

  if (error || !dashboard) {
    await createExportLog(supabase, userId, input, "failed", error || "Laporan belum bisa dibuat.");
    return { csv: null, filename: null, error: error || "Laporan belum bisa dibuat." };
  }

  let csv: string;

  if (input.report_type === "monthly_summary") {
    csv = toCsv(
      ["metrik", "nilai", "mata_uang", "tanggal_mulai", "tanggal_selesai"],
      [
        ["total_saldo", dashboard.summary.total_balance, dashboard.summary.currency, input.date_from, input.date_to],
        ["pemasukan", dashboard.summary.income, dashboard.summary.currency, input.date_from, input.date_to],
        ["pengeluaran", dashboard.summary.expenses, dashboard.summary.currency, input.date_from, input.date_to],
        ["arus_kas_bersih", dashboard.summary.net_cashflow, dashboard.summary.currency, input.date_from, input.date_to],
        ["jumlah_tertunda", dashboard.summary.pending_count, dashboard.summary.currency, input.date_from, input.date_to],
        ["jumlah_transaksi", dashboard.summary.transaction_count, dashboard.summary.currency, input.date_from, input.date_to]
      ]
    );
  } else if (input.report_type === "spending_by_category") {
    csv = toCsv(
      ["id_kategori", "kategori", "jumlah", "persentase", "mata_uang", "tanggal_mulai", "tanggal_selesai"],
      dashboard.spendingByCategory.map((item) => [
        item.category_id,
        item.name,
        item.amount,
        item.percentage,
        dashboard.summary.currency,
        input.date_from,
        input.date_to
      ])
    );
  } else if (input.report_type === "cashflow") {
    csv = toCsv(
      ["tanggal", "pemasukan", "pengeluaran", "bersih", "mata_uang"],
      dashboard.cashflow.map((item) => [item.date, item.income, item.expenses, item.net, dashboard.summary.currency])
    );
  } else {
    csv = toCsv(
      ["nama_tujuan", "target", "kontribusi", "sisa", "progres", "tanggal_target", "status"],
      []
    );

    const { data: goals, error: goalsError } = await supabase
      .from("savings_goals")
      .select(
        `
        id,
        name,
        target_amount,
        target_date,
        status,
        contributions:goal_contributions(amount)
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (goalsError) {
      await createExportLog(supabase, userId, input, "failed", goalsError.message);
      return { csv: null, filename: null, error: goalsError.message };
    }

    csv = toCsv(
      ["nama_tujuan", "target", "kontribusi", "sisa", "progres", "tanggal_target", "status"],
      (goals || []).map((goal) => {
        const contributions = (goal.contributions || []) as Array<{ amount: number | string }>;
        const contributed = contributions.reduce((total, contribution) => total + Number(contribution.amount), 0);
        const target = Number(goal.target_amount);
        return [
          goal.name,
          target,
          contributed,
          Math.max(0, target - contributed),
          target > 0 ? Math.min(100, Math.round((contributed / target) * 100)) : 0,
          goal.target_date,
          goal.status
        ];
      })
    );
  }

  await createExportLog(supabase, userId, input, "completed");

  return {
    csv,
    filename: `finova-${input.report_type}-${input.date_from}-to-${input.date_to}.csv`,
    error: null
  };
}
