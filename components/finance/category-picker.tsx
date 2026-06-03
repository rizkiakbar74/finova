import type { CategoryRecord } from "@/lib/repositories/categories";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { localizeCategoryName } from "@/lib/utils/localization";

interface CategoryPickerProps {
  categories: CategoryRecord[];
  name: string;
  type?: "income" | "expense";
  selectedId?: string;
}

export function CategoryPicker({ categories, name, type, selectedId }: CategoryPickerProps) {
  const filteredCategories = categories.filter((category) => {
    if (type && category.type !== type) return false;
    return !category.is_archived;
  });

  if (filteredCategories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-muted-foreground">
        Belum ada kategori aktif.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {filteredCategories.map((category) => (
        <label
          key={category.id}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40",
            selectedId === category.id && "border-emerald-300 bg-emerald-50 text-emerald-800"
          )}
        >
          <input
            type="radio"
            name={name}
            value={category.id}
            defaultChecked={selectedId === category.id}
            className="sr-only"
          />
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
            style={{ backgroundColor: category.color || "#059669" }}
          >
            {(category.icon || localizeCategoryName(category.name)).slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate">{localizeCategoryName(category.name)}</span>
          <Badge variant={category.type === "income" ? "success" : "secondary"}>
            {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
          </Badge>
        </label>
      ))}
    </div>
  );
}
