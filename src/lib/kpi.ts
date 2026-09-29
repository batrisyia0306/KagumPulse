export type PeriodPreset =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_12_months"
  | "custom";

export type DateRange = {
  start: string;
  end: string;
  asOfLabel: string | null;
  isPartial: boolean;
};

export type KpiTotals = {
  totalAmount: number;
  transactionCount: number;
  uniqueDonorCount: number;
};

export type KpiCardValues = {
  totalAmount: number;
  donorCount: number;
  avgDonation: number;
  transactionCount: number;
  totalAmountChange: number | null;
  donorCountChange: number | null;
  avgDonationChange: number | null;
  transactionCountChange: number | null;
  asOfLabel: string | null;
};

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function averageDonation(totalAmount: number, transactionCount: number): number {
  if (transactionCount === 0) {
    return 0;
  }
  return totalAmount / transactionCount;
}

export function buildKpiValues(
  current: KpiTotals,
  previous: KpiTotals,
  asOfLabel: string | null,
): KpiCardValues {
  const avg = averageDonation(current.totalAmount, current.transactionCount);
  const prevAvg = averageDonation(previous.totalAmount, previous.transactionCount);
  return {
    totalAmount: current.totalAmount,
    donorCount: current.uniqueDonorCount,
    avgDonation: avg,
    transactionCount: current.transactionCount,
    totalAmountChange: percentChange(current.totalAmount, previous.totalAmount),
    donorCountChange: percentChange(current.uniqueDonorCount, previous.uniqueDonorCount),
    avgDonationChange: percentChange(avg, prevAvg),
    transactionCountChange: percentChange(
      current.transactionCount,
      previous.transactionCount,
    ),
    asOfLabel,
  };
}

export function resolvePeriod(
  preset: PeriodPreset,
  asOfYmd: string,
  customStart?: string,
  customEnd?: string,
): DateRange {
  const year = Number(asOfYmd.slice(0, 4));
  const month = Number(asOfYmd.slice(5, 7));
  const day = Number(asOfYmd.slice(8, 10));
  const monthStart = `${asOfYmd.slice(0, 7)}-01`;
  const daysThisMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const isPartialThisMonth = day < daysThisMonth;

  if (preset === "this_month") {
    return {
      start: monthStart,
      end: asOfYmd,
      asOfLabel: isPartialThisMonth ? asOfYmd : null,
      isPartial: isPartialThisMonth,
    };
  }

  if (preset === "last_month") {
    const prev = new Date(Date.UTC(year, month - 2, 1));
    const prevYm = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
    const prevDays = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 0)).getUTCDate();
    return {
      start: `${prevYm}-01`,
      end: `${prevYm}-${String(prevDays).padStart(2, "0")}`,
      asOfLabel: null,
      isPartial: false,
    };
  }

  if (preset === "last_3_months") {
    const startDate = new Date(Date.UTC(year, month - 3, 1));
    const start = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
    return {
      start,
      end: asOfYmd,
      asOfLabel: isPartialThisMonth ? asOfYmd : null,
      isPartial: isPartialThisMonth,
    };
  }

  if (preset === "last_12_months") {
    const startDate = new Date(Date.UTC(year, month - 12, 1));
    const start = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
    return {
      start,
      end: asOfYmd,
      asOfLabel: isPartialThisMonth ? asOfYmd : null,
      isPartial: isPartialThisMonth,
    };
  }

  const start = customStart && customEnd ? customStart : monthStart;
  const end = customStart && customEnd ? customEnd : asOfYmd;
  return {
    start,
    end,
    asOfLabel: null,
    isPartial: false,
  };
}

export function previousComparableRange(current: DateRange, asOfYmd: string): DateRange {
  if (current.isPartial && current.asOfLabel) {
    const [y, m] = current.start.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 2, 1));
    const prevYm = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
    const day = Number(asOfYmd.slice(8, 10));
    const prevDays = new Date(
      Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const endDay = Math.min(day, prevDays);
    return {
      start: `${prevYm}-01`,
      end: `${prevYm}-${String(endDay).padStart(2, "0")}`,
      asOfLabel: null,
      isPartial: false,
    };
  }

  const start = new Date(current.start + "T00:00:00Z");
  const end = new Date(current.end + "T00:00:00Z");
  const ms = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - ms);
  const toYmd = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return {
    start: toYmd(prevStart),
    end: toYmd(prevEnd),
    asOfLabel: null,
    isPartial: false,
  };
}

export function yearMonthsInRange(startYmd: string, endYmd: string): string[] {
  const months: string[] = [];
  let cursor = startYmd.slice(0, 7);
  const endYm = endYmd.slice(0, 7);
  while (cursor <= endYm) {
    months.push(cursor);
    const [y, m] = cursor.split("-").map(Number);
    const next = new Date(Date.UTC(y, m, 1));
    cursor = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return months;
}
