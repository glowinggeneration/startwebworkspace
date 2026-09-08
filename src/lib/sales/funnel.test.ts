import { describe, expect, it } from "vitest";
import { computeCoverage, computeFunnelExpectations, computeMixPlan, diagnosePace } from "./funnel";

describe("computeFunnelExpectations", () => {
  it("reproduces the September 2026 worked example from the sales tracker", () => {
    const result = computeFunnelExpectations({ workingDays: 13, touchesPerWorkingDay: 20 });
    expect(result.touches).toBe(260);
    expect(result.conversations).toBe(47);
    expect(result.meetingsBooked).toBe(10);
    expect(result.meetingsHeld).toBe(8);
    expect(result.offersSent).toBe(5);
    expect(result.wins).toBe(2);
  });

  it("scales with a full working month", () => {
    const result = computeFunnelExpectations({ workingDays: 22, touchesPerWorkingDay: 20 });
    expect(result.touches).toBe(440);
  });
});

describe("computeMixPlan", () => {
  it("reproduces the September mix planner (Business + Starter + content = 25,000, 5,000 short)", () => {
    const result = computeMixPlan(
      [
        { packageId: "business", packageName: "Business Website", price: 18000, plannedUnits: 1 },
        { packageId: "starter", packageName: "Starter Website", price: 7000, plannedUnits: 1 },
      ],
      30000,
    );
    expect(result.plannedTotal).toBe(25000);
    expect(result.gapToTarget).toBe(-5000);
  });

  it("matches once the content job is added (32,000, 2,000 over target)", () => {
    const result = computeMixPlan(
      [
        { packageId: "business", packageName: "Business Website", price: 18000, plannedUnits: 1 },
        { packageId: "starter", packageName: "Starter Website", price: 7000, plannedUnits: 1 },
        { packageId: "content", packageName: "SMAIT content job", price: 7000, plannedUnits: 1 },
      ],
      30000,
    );
    expect(result.plannedTotal).toBe(32000);
    expect(result.gapToTarget).toBe(2000);
  });
});

describe("computeCoverage", () => {
  it("reproduces the 8 September snapshot: R58,000 open against a R30,000 target reads 1.93x, at risk", () => {
    const result = computeCoverage(58000, 30000);
    expect(result.coverage).toBeCloseTo(1.93, 2);
    expect(result.status).toBe("at-risk");
  });

  it("is on-track at or above the target multiplier", () => {
    expect(computeCoverage(105000, 30000).status).toBe("on-track");
  });

  it("is a watch between the risk floor and the target multiplier", () => {
    expect(computeCoverage(85000, 30000).status).toBe("watch");
  });
});

describe("diagnosePace", () => {
  const expected = computeFunnelExpectations({ workingDays: 13, touchesPerWorkingDay: 20 });

  it("flags touches first when activity itself is behind", () => {
    expect(diagnosePace({ touches: 100 }, expected)).toMatch(/08:00-10:00/);
  });

  it("flags meetings when touches and conversations are on pace but meetings lag", () => {
    const actual = { touches: 260, conversations: 47, meetingsBooked: 3 };
    expect(diagnosePace(actual, expected)).toMatch(/opening line/);
  });

  it("flags wins last, once every earlier stage is on pace", () => {
    const actual = {
      touches: 260,
      conversations: 47,
      meetingsBooked: 10,
      meetingsHeld: 8,
      offersSent: 5,
      wins: 0,
    };
    expect(diagnosePace(actual, expected)).toMatch(/can't buy/);
  });

  it("returns null when every stage is on pace", () => {
    expect(diagnosePace(expected, expected)).toBeNull();
  });
});
