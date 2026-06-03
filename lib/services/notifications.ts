import type { SupabaseClient } from "@supabase/supabase-js";
import { listBudgets } from "@/lib/repositories/budgets";
import { listSavingsGoals } from "@/lib/repositories/goals";
import { listRecurringBills } from "@/lib/repositories/recurring-bills";
import { listSubscriptions } from "@/lib/repositories/subscriptions";
import { defaultDashboardRange, getDashboardData } from "@/lib/services/dashboard";

export interface NotificationRecord {
  id: string;
  type: "budget" | "bill" | "goal" | "account" | "security" | "subscription" | "system";
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface InsightRecord {
  id: string;
  tone: "success" | "warning" | "danger";
  title: string;
  message: string;
  action_url: string;
}

interface RuleNotificationInput {
  rule_key: string;
  type: NotificationRecord["type"];
  severity: NotificationRecord["severity"];
  title: string;
  message: string;
  action_url: string;
  metadata?: Record<string, unknown>;
}

function daysUntil(date: string) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00.000Z`);
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return Math.ceil((target.getTime() - start.getTime()) / 86400000);
}

async function insertRuleNotification(
  supabase: SupabaseClient,
  userId: string,
  input: RuleNotificationInput
) {
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .is("archived_at", null)
    .contains("metadata", { rule_key: input.rule_key })
    .limit(1);

  if (existing && existing.length > 0) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    type: input.type,
    severity: input.severity,
    title: input.title,
    message: input.message,
    action_url: input.action_url,
    metadata: {
      ...(input.metadata || {}),
      rule_key: input.rule_key
    }
  });
}

export async function syncRuleNotifications(supabase: SupabaseClient, userId: string) {
  const [{ data: budgets }, { data: goals }, { data: bills }, { data: subscriptions }] = await Promise.all([
    listBudgets(supabase, userId),
    listSavingsGoals(supabase, userId),
    listRecurringBills(supabase, userId),
    listSubscriptions(supabase, userId)
  ]);

  for (const budget of budgets || []) {
    if (budget.progress > 100) {
      await insertRuleNotification(supabase, userId, {
        rule_key: `budget-over-${budget.id}-${budget.period_start}`,
        type: "budget",
        severity: "high",
        title: "Anggaran melewati batas",
        message: `${budget.name} sudah mencapai ${budget.progress}% dari batas yang direncanakan.`,
        action_url: "/budgets"
      });
    } else if (budget.progress >= 80) {
      await insertRuleNotification(supabase, userId, {
        rule_key: `budget-warning-${budget.id}-${budget.period_start}`,
        type: "budget",
        severity: "medium",
        title: "Anggaran mendekati batas",
        message: `${budget.name} sudah mencapai ${budget.progress}% dari batas yang direncanakan.`,
        action_url: "/budgets"
      });
    }
  }

  for (const goal of goals || []) {
    for (const milestone of [25, 50, 75, 100]) {
      if (goal.progress >= milestone) {
        await insertRuleNotification(supabase, userId, {
          rule_key: `goal-${goal.id}-${milestone}`,
          type: "goal",
          severity: milestone >= 100 ? "high" : "low",
          title: milestone >= 100 ? "Tujuan tabungan selesai" : "Milestone tujuan tercapai",
          message: `${goal.name} sudah mencapai progres ${milestone}%.`,
          action_url: "/goals"
        });
      }
    }
  }

  for (const subscription of subscriptions || []) {
    const dueIn = daysUntil(subscription.next_renewal_date);
    if (subscription.status === "active" && dueIn >= 0 && dueIn <= 7) {
      await insertRuleNotification(supabase, userId, {
        rule_key: `subscription-renewal-${subscription.id}-${subscription.next_renewal_date}`,
        type: "subscription",
        severity: "medium",
        title: "Langganan segera diperpanjang",
        message: `${subscription.name} diperpanjang dalam ${dueIn} hari.`,
        action_url: "/subscriptions"
      });
    }
  }

  for (const bill of bills || []) {
    const dueIn = daysUntil(bill.next_due_date);
    if (bill.status !== "paused" && dueIn >= 0 && dueIn <= bill.reminder_days) {
      await insertRuleNotification(supabase, userId, {
        rule_key: `bill-due-${bill.id}-${bill.next_due_date}`,
        type: "bill",
        severity: dueIn === 0 ? "high" : "medium",
        title: "Tagihan segera jatuh tempo",
        message: `${bill.name} jatuh tempo dalam ${dueIn} hari.`,
        action_url: "/recurring-bills"
      });
    }
  }
}

export async function listNotifications(supabase: SupabaseClient, userId: string) {
  await syncRuleNotifications(supabase, userId);

  return supabase
    .from("notifications")
    .select("id, type, severity, title, message, action_url, metadata, is_read, archived_at, created_at")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
}

export async function getUnreadNotificationCount(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .is("archived_at", null);

  return error ? 0 : count || 0;
}

export async function markNotificationRead(supabase: SupabaseClient, userId: string, id: string) {
  return supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId).select("id").single();
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string) {
  return supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}

export async function archiveNotification(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("notifications")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();
}

export async function getRuleBasedInsights(supabase: SupabaseClient, userId: string): Promise<InsightRecord[]> {
  const currentRange = defaultDashboardRange();
  const previousStart = new Date(`${currentRange.date_from}T00:00:00.000Z`);
  previousStart.setUTCMonth(previousStart.getUTCMonth() - 1);
  const previousEnd = new Date(`${currentRange.date_to}T00:00:00.000Z`);
  previousEnd.setUTCMonth(previousEnd.getUTCMonth() - 1);

  const [{ data: current }, { data: previous }, { data: budgets }] = await Promise.all([
    getDashboardData(supabase, userId, currentRange),
    getDashboardData(supabase, userId, {
      date_from: previousStart.toISOString().slice(0, 10),
      date_to: previousEnd.toISOString().slice(0, 10)
    }),
    listBudgets(supabase, userId)
  ]);

  const insights: InsightRecord[] = [];

  if (current && current.summary.net_cashflow < 0) {
    insights.push({
      id: "negative-cashflow",
      tone: "danger",
      title: "Arus kas bersih negatif",
      message: "Pengeluaran lebih tinggi daripada pemasukan pada periode berjalan.",
      action_url: "/dashboard"
    });
  }

  if (current && previous && previous.summary.expenses > 0) {
    const change = ((current.summary.expenses - previous.summary.expenses) / previous.summary.expenses) * 100;
    if (change > 15) {
      insights.push({
        id: "spending-increase",
        tone: "warning",
        title: "Pengeluaran meningkat",
        message: `Pengeluaran ${Math.round(change)}% lebih tinggi dibanding periode sebelumnya.`,
        action_url: "/reports"
      });
    } else if (change < -5) {
      insights.push({
        id: "spending-decrease",
        tone: "success",
        title: "Pengeluaran membaik",
        message: `Pengeluaran ${Math.abs(Math.round(change))}% lebih rendah dibanding periode sebelumnya.`,
        action_url: "/reports"
      });
    }
  }

  const budgetWarning = (budgets || []).find((budget) => budget.progress >= 80);
  if (budgetWarning) {
    insights.push({
      id: "budget-warning",
      tone: budgetWarning.progress > 100 ? "danger" : "warning",
      title: "Anggaran perlu perhatian",
      message: `${budgetWarning.name} sudah mencapai ${budgetWarning.progress}% dari batas yang direncanakan.`,
      action_url: "/budgets"
    });
  }

  return insights;
}
