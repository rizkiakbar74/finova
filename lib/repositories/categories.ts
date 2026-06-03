import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryCreateInput, CategoryUpdateInput } from "@/lib/validators/finance.schema";

export interface CategoryRecord {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
  icon: string | null;
  is_default: boolean;
  is_archived: boolean;
  created_at: string;
}

const categorySelect = "id, name, type, color, icon, is_default, is_archived, created_at";

export async function listCategories(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("categories")
    .select(categorySelect)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("type", { ascending: true })
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
}

export async function createCategory(supabase: SupabaseClient, userId: string, input: CategoryCreateInput) {
  return supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
      is_default: false
    })
    .select(categorySelect)
    .single();
}

export async function updateCategory(supabase: SupabaseClient, userId: string, input: CategoryUpdateInput) {
  return supabase
    .from("categories")
    .update({
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
      is_archived: input.is_archived
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(categorySelect)
    .single();
}

export async function softDeleteCategory(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}
