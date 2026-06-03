import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BudgetCreateInput,
  BudgetItemCreateInput,
  BudgetItemUpdateInput,
  BudgetUpdateInput
} from "@/lib/validators/finance.schema";

export interface BudgetItemRecord {
  id: string;
  budget_id: string;
  category_id: string;
  limit_amount: number | string;
  alert_threshold: number | string;
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
  spent_amount: number;
  progress: number;
}

export interface BudgetRecord {
  id: string;
  name: string;
  period_type: "monthly";
  period_start: string;
  period_end: string;
  total_limit: number | string | null;
  created_at: string;
  items: BudgetItemRecord[];
  spent_amount: number;
  limit_amount: number;
  progress: number;
}

type RawBudgetItem = Omit<BudgetItemRecord, "category" | "spent_amount" | "progress"> & {
  category: BudgetItemRecord["category"] | BudgetItemRecord["category"][];
};

type RawBudget = Omit<BudgetRecord, "items" | "spent_amount" | "limit_amount" | "progress"> & {
  items: RawBudgetItem[];
};

const budgetSelect = `
  id,
  name,
  period_type,
  period_start,
  period_end,
  total_limit,
  created_at,
  items:budget_items(
    id,
    budget_id,
    category_id,
    limit_amount,
    alert_threshold,
    category:categories(id, name, color, icon)
  )
`;

function normalizeBudgetItem(item: RawBudgetItem, spentAmount: number): BudgetItemRecord {
  const category = Array.isArray(item.category) ? item.category[0] ?? null : item.category;
  const limit = Number(item.limit_amount);

  return {
    ...item,
    category,
    spent_amount: spentAmount,
    progress: limit > 0 ? Math.round((spentAmount / limit) * 100) : 0
  };
}

function normalizeBudget(budget: RawBudget, spentByCategory: Map<string, number>): BudgetRecord {
  const items = (budget.items || []).map((item) =>
    normalizeBudgetItem(item, spentByCategory.get(item.category_id) || 0)
  );
  const itemLimit = items.reduce((total, item) => total + Number(item.limit_amount), 0);
  const limit = budget.total_limit ? Number(budget.total_limit) : itemLimit;
  const spent = items.reduce((total, item) => total + item.spent_amount, 0);

  return {
    ...budget,
    items,
    spent_amount: spent,
    limit_amount: limit,
    progress: limit > 0 ? Math.round((spent / limit) * 100) : 0
  };
}

export async function listBudgets(supabase: SupabaseClient, userId: string) {
  const { data: budgets, error: budgetError } = await supabase
    .from("budgets")
    .select(budgetSelect)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false });

  if (budgetError) {
    return { data: null, error: budgetError };
  }

  const budgetRows = (budgets || []) as unknown as RawBudget[];
  const dateRanges = budgetRows.map((budget) => [budget.period_start, budget.period_end]).flat();
  const dateStart = dateRanges.length > 0 ? dateRanges.sort()[0] : null;
  const dateEnd = dateRanges.length > 0 ? dateRanges.sort().at(-1) || null : null;
  const spentByCategory = new Map<string, number>();

  if (dateStart && dateEnd) {
    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("category_id, amount, transaction_date")
      .eq("user_id", userId)
      .eq("type", "expense")
      .eq("status", "posted")
      .is("deleted_at", null)
      .gte("transaction_date", dateStart)
      .lte("transaction_date", dateEnd);

    if (transactionError) {
      return { data: null, error: transactionError };
    }

    budgetRows.forEach((budget) => {
      (transactions || [])
        .filter(
          (transaction) =>
            transaction.transaction_date >= budget.period_start && transaction.transaction_date <= budget.period_end
        )
        .forEach((transaction) => {
          const key = `${budget.id}:${transaction.category_id}`;
          spentByCategory.set(key, (spentByCategory.get(key) || 0) + Number(transaction.amount));
        });
    });
  }

  return {
    data: budgetRows.map((budget) => {
      const scopedSpent = new Map<string, number>();
      budget.items.forEach((item) => {
        scopedSpent.set(item.category_id, spentByCategory.get(`${budget.id}:${item.category_id}`) || 0);
      });
      return normalizeBudget(budget, scopedSpent);
    }),
    error: null
  };
}

export async function createBudget(supabase: SupabaseClient, userId: string, input: BudgetCreateInput) {
  return supabase
    .from("budgets")
    .insert({
      user_id: userId,
      name: input.name,
      period_type: "monthly",
      period_start: input.period_start,
      period_end: input.period_end,
      total_limit: input.total_limit ?? null
    })
    .select("id")
    .single();
}

export async function updateBudget(supabase: SupabaseClient, userId: string, input: BudgetUpdateInput) {
  return supabase
    .from("budgets")
    .update({
      name: input.name,
      period_start: input.period_start,
      period_end: input.period_end,
      total_limit: input.total_limit ?? null
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}

export async function softDeleteBudget(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("budgets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}

export async function createBudgetItem(supabase: SupabaseClient, userId: string, input: BudgetItemCreateInput) {
  return supabase
    .from("budget_items")
    .insert({
      user_id: userId,
      budget_id: input.budget_id,
      category_id: input.category_id,
      limit_amount: input.limit_amount,
      alert_threshold: input.alert_threshold
    })
    .select("id")
    .single();
}

export async function updateBudgetItem(supabase: SupabaseClient, userId: string, input: BudgetItemUpdateInput) {
  return supabase
    .from("budget_items")
    .update({
      category_id: input.category_id,
      limit_amount: input.limit_amount,
      alert_threshold: input.alert_threshold
    })
    .eq("id", input.id)
    .eq("budget_id", input.budget_id)
    .eq("user_id", userId)
    .select("id")
    .single();
}

export async function deleteBudgetItem(supabase: SupabaseClient, userId: string, id: string, budgetId: string) {
  return supabase
    .from("budget_items")
    .delete()
    .eq("id", id)
    .eq("budget_id", budgetId)
    .eq("user_id", userId)
    .select("id")
    .single();
}
