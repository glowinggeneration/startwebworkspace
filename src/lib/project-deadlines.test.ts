import { describe, expect, it } from "vitest";
import { nearestDeadline } from "./project-deadlines";
import type { ProjectBoardProject } from "@/hooks/use-project-board";

const TODAY = new Date("2026-09-10T12:00:00Z");

function project(overrides: Partial<ProjectBoardProject>): ProjectBoardProject {
  return {
    id: "p1",
    name: "Website rebuild",
    status: "active",
    status_label: null,
    start_date: null,
    due_date: null,
    account_id: "a1",
    accounts: null,
    project_phases: [],
    tasks: [],
    quotes: [],
    invoices: [],
    campaigns: [],
    ...overrides,
  };
}

describe("nearestDeadline", () => {
  it("returns null when nothing is due soon", () => {
    expect(project({ due_date: "2026-12-25" })).toSatisfy(
      (p: ProjectBoardProject) => nearestDeadline(p, TODAY) === null,
    );
  });

  it("flags an overdue project as overdue", () => {
    const alert = nearestDeadline(project({ due_date: "2026-09-01" }), TODAY);
    expect(alert?.severity).toBe("overdue");
    expect(alert?.label).toBe("Project due");
  });

  it("flags a project due within the week as due soon", () => {
    const alert = nearestDeadline(project({ due_date: "2026-09-14" }), TODAY);
    expect(alert?.severity).toBe("soon");
  });

  it("prefers overdue over merely-soon across multiple candidates", () => {
    const alert = nearestDeadline(
      project({
        due_date: "2026-09-12", // soon
        tasks: [
          {
            id: "t1",
            title: "Send invoice",
            status: "todo",
            status_label: null,
            due_date: "2026-09-05",
          },
        ], // overdue
      }),
      TODAY,
    );
    expect(alert?.severity).toBe("overdue");
    expect(alert?.label).toBe("Send invoice");
  });

  it("ignores a done phase's due date", () => {
    const alert = nearestDeadline(
      project({
        project_phases: [
          { id: "ph1", name: "Kickoff", status: "done", sort_order: 1, due_date: "2026-09-01" },
        ],
      }),
      TODAY,
    );
    expect(alert).toBeNull();
  });

  it("ignores a completed task's due date", () => {
    const alert = nearestDeadline(
      project({
        tasks: [
          {
            id: "t1",
            title: "Old task",
            status: "done",
            status_label: null,
            due_date: "2026-09-01",
          },
        ],
      }),
      TODAY,
    );
    expect(alert).toBeNull();
  });
});
