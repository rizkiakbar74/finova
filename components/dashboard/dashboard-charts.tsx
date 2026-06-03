"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { CashflowPoint, SpendingCategoryPoint } from "@/lib/services/dashboard";

interface DashboardChartsProps {
  cashflow: CashflowPoint[];
  spendingByCategory: SpendingCategoryPoint[];
  currency: string;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function CashflowChart({ cashflow, currency }: Pick<DashboardChartsProps, "cashflow" | "currency">) {
  return (
    <div className="h-[220px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={cashflow} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={18}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            contentStyle={{
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)"
            }}
          />
          <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="net" stroke="#0F172A" strokeWidth={2} dot={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpendingCategoryChart({
  spendingByCategory,
  currency
}: Pick<DashboardChartsProps, "spendingByCategory" | "currency">) {
  if (spendingByCategory.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-muted-foreground">
        Belum ada kategori pengeluaran pada rentang ini.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="h-[200px] sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={spendingByCategory} dataKey="amount" nameKey="name" innerRadius="54%" outerRadius="82%" paddingAngle={2}>
              {spendingByCategory.map((item) => (
                <Cell key={item.category_id} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(Number(value), currency)}
              contentStyle={{
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {spendingByCategory.slice(0, 6).map((item) => (
          <div key={item.category_id} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate font-medium text-slate-700">{item.name}</span>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-slate-950">{formatMoney(item.amount, currency)}</p>
              <p className="text-xs text-muted-foreground">{item.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
