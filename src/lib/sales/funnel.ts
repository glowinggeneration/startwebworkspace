/**
 * Pure sales-funnel math for the Command Board. Mirrors the working
 * spreadsheet described in docs/sales-ops/PIPELINE_REQUIREMENTS.md #9-10 —
 * touches needed comes from working days × touches/day, not from revenue,
 * and every later stage is that number carried through a conversion rate.
 * No I/O here; callers wire real deal/target data in from Supabase.
 */

export interface FunnelRates {
  /** Share of touches that become a real conversation. */
  touchToConversation: number;
  /** Share of conversations that become a booked meeting. */
  conversationToMeetingBooked: number;
  /** Share of booked meetings that actually happen. */
  meetingBookedToHeld: number;
  /** Share of meetings held that become a written offer. */
  meetingHeldToOffer: number;
  /** Share of written offers that become a win. */
  offerToWin: number;
}

export const DEFAULT_FUNNEL_RATES: FunnelRates = {
  touchToConversation: 0.18,
  conversationToMeetingBooked: 0.22,
  meetingBookedToHeld: 0.8,
  meetingHeldToOffer: 0.65,
  offerToWin: 0.3,
};

export interface FunnelStageCounts {
  touches: number;
  conversations: number;
  meetingsBooked: number;
  meetingsHeld: number;
  offersSent: number;
  wins: number;
}

export interface FunnelExpectationsInput {
  workingDays: number;
  touchesPerWorkingDay: number;
  rates?: FunnelRates;
}

/**
 * The "This month against the plan" row: touches needed is a floor
 * (working days × touches/day), everything after it is that number
 * carried through the funnel rates, rounded to a whole count at each
 * stage (matching the tracker's own rounding, e.g. 46.8 conversations
 * reads as 47).
 */
export function computeFunnelExpectations({
  workingDays,
  touchesPerWorkingDay,
  rates = DEFAULT_FUNNEL_RATES,
}: FunnelExpectationsInput): FunnelStageCounts {
  const touches = Math.round(workingDays * touchesPerWorkingDay);
  const conversations = Math.round(touches * rates.touchToConversation);
  const meetingsBooked = Math.round(conversations * rates.conversationToMeetingBooked);
  const meetingsHeld = Math.round(meetingsBooked * rates.meetingBookedToHeld);
  const offersSent = Math.round(meetingsHeld * rates.meetingHeldToOffer);
  const wins = Math.round(offersSent * rates.offerToWin);
  return { touches, conversations, meetingsBooked, meetingsHeld, offersSent, wins };
}

export interface MixPlanLine {
  packageId: string;
  packageName: string;
  price: number;
  plannedUnits: number;
}

export interface MixPlanResult {
  lines: Array<MixPlanLine & { revenue: number }>;
  plannedTotal: number;
  gapToTarget: number;
}

/** Mix planner: units typed in × working price, summed, against the target. */
export function computeMixPlan(lines: MixPlanLine[], targetAmount: number): MixPlanResult {
  const withRevenue = lines.map((line) => ({ ...line, revenue: line.price * line.plannedUnits }));
  const plannedTotal = withRevenue.reduce((sum, line) => sum + line.revenue, 0);
  return { lines: withRevenue, plannedTotal, gapToTarget: plannedTotal - targetAmount };
}

export type CoverageStatus = "at-risk" | "watch" | "on-track";

export interface CoverageResult {
  coverage: number;
  status: CoverageStatus;
}

/**
 * Open pipeline value ÷ target. ≥3.5× (or the workspace's own multiplier)
 * is on track, below 2.5× is a flagged risk, the band between is a watch.
 */
export function computeCoverage(
  openPipelineValue: number,
  targetAmount: number,
  targetMultiplier = 3.5,
): CoverageResult {
  if (targetAmount <= 0) return { coverage: 0, status: "at-risk" };
  const coverage = openPipelineValue / targetAmount;
  const riskFloor = targetMultiplier - 1;
  const status: CoverageStatus =
    coverage >= targetMultiplier ? "on-track" : coverage >= riskFloor ? "watch" : "at-risk";
  return { coverage, status };
}

/**
 * "If the week is off, change only one thing" — walks the funnel from the
 * earliest stage, returns the first (most upstream) shortfall so the
 * fix stays singular instead of piling on every gap at once. `null` means
 * the week is on pace everywhere the data covers.
 */
export function diagnosePace(
  actual: Partial<FunnelStageCounts>,
  expected: FunnelStageCounts,
): string | null {
  if ((actual.touches ?? 0) < expected.touches) {
    return "Behind on touches: protect the 08:00-10:00 calling block.";
  }
  if ((actual.conversations ?? 0) < expected.conversations) {
    return "Behind on conversations: the list is soft, or you're emailing instead of calling.";
  }
  if ((actual.meetingsBooked ?? 0) < expected.meetingsBooked) {
    return "Behind on meetings: the opening line isn't specific enough — use the desk card.";
  }
  if ((actual.offersSent ?? 0) < expected.offersSent) {
    return "Behind on written offers: a meeting ended without a next step and a date.";
  }
  if ((actual.wins ?? 0) < expected.wins) {
    return "Behind on wins: offers are going to people who can't buy, or follow-up went quiet.";
  }
  return null;
}
