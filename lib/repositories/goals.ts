import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoalContributionCreateInput,
  SavingsGoalCreateInput,
  SavingsGoalUpdateInput
} from "@/lib/validators/finance.schema";

export interface GoalContributionRecord {
  id: string;
  goal_id: string;
  wallet_id: string | null;
  amount: number | string;
  contribution_date: string;
  notes: string | null;
  created_at: string;
  wallet: {
    id: string;
    name: string;
    currency: string;
  } | null;
}

export interface SavingsGoalRecord {
  id: string;
  name: string;
  target_amount: number | string;
  target_date: string;
  icon: string | null;
  color: string | null;
  status: "active" | "completed" | "archived";
  created_at: string;
  contributions: GoalContributionRecord[];
  contributed_amount: number;
  remaining_amount: number;
  progress: number;
}

type RawGoalContribution = Omit<GoalContributionRecord, "wallet"> & {
  wallet: GoalContributionRecord["wallet"] | GoalContributionRecord["wallet"][];
};

type RawGoal = Omit<SavingsGoalRecord, "contributions" | "contributed_amount" | "remaining_amount" | "progress"> & {
  contributions: RawGoalContribution[];
};

const goalSelect = `
  id,
  name,
  target_amount,
  target_date,
  icon,
  color,
  status,
  created_at,
  contributions:goal_contributions(
    id,
    goal_id,
    wallet_id,
    amount,
    contribution_date,
    notes,
    created_at,
    wallet:wallets(id, name, currency)
  )
`;

function normalizeContribution(contribution: RawGoalContribution): GoalContributionRecord {
  return {
    ...contribution,
    wallet: Array.isArray(contribution.wallet) ? contribution.wallet[0] ?? null : contribution.wallet
  };
}

function normalizeGoal(goal: RawGoal): SavingsGoalRecord {
  const contributions = (goal.contributions || [])
    .map(normalizeContribution)
    .sort((a, b) => {
      if (a.contribution_date === b.contribution_date) return b.created_at.localeCompare(a.created_at);
      return b.contribution_date.localeCompare(a.contribution_date);
    });
  const contributedAmount = contributions.reduce((total, contribution) => total + Number(contribution.amount), 0);
  const targetAmount = Number(goal.target_amount);

  return {
    ...goal,
    contributions,
    contributed_amount: contributedAmount,
    remaining_amount: Math.max(0, targetAmount - contributedAmount),
    progress: targetAmount > 0 ? Math.min(100, Math.round((contributedAmount / targetAmount) * 100)) : 0
  };
}

export async function listSavingsGoals(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select(goalSelect)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("status", { ascending: true })
    .order("target_date", { ascending: true });

  if (error) return { data: null, error };

  return {
    data: ((data || []) as unknown as RawGoal[]).map(normalizeGoal),
    error: null
  };
}

export async function createSavingsGoal(
  supabase: SupabaseClient,
  userId: string,
  input: SavingsGoalCreateInput
) {
  return supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: input.name,
      target_amount: input.target_amount,
      target_date: input.target_date,
      icon: input.icon,
      color: input.color,
      status: input.status
    })
    .select("id")
    .single();
}

export async function updateSavingsGoal(
  supabase: SupabaseClient,
  userId: string,
  input: SavingsGoalUpdateInput
) {
  return supabase
    .from("savings_goals")
    .update({
      name: input.name,
      target_amount: input.target_amount,
      target_date: input.target_date,
      icon: input.icon,
      color: input.color,
      status: input.status
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}

export async function softDeleteSavingsGoal(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("savings_goals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}

export async function createGoalContribution(
  supabase: SupabaseClient,
  userId: string,
  input: GoalContributionCreateInput
) {
  return supabase
    .from("goal_contributions")
    .insert({
      user_id: userId,
      goal_id: input.goal_id,
      wallet_id: input.wallet_id,
      amount: input.amount,
      contribution_date: input.contribution_date,
      notes: input.notes ?? null
    })
    .select("id")
    .single();
}

export async function deleteGoalContribution(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  goalId: string
) {
  return supabase
    .from("goal_contributions")
    .delete()
    .eq("id", id)
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .select("id")
    .single();
}
