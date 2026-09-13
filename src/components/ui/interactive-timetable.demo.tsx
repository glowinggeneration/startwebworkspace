import { InteractiveTimetable, type TimetableEvent } from "@/components/ui/interactive-timetable";

const events: TimetableEvent[] = [
  {
    id: "e1",
    day: 0,
    start: 9,
    end: 9.5,
    title: "Standup",
    subtitle: "Daily sync with the delivery team.",
  },
  {
    id: "e2",
    day: 0,
    start: 10,
    end: 11.5,
    title: "Client review",
    subtitle: "Walk AfriBiz through the staging build.",
    color: "#04A777",
  },
  {
    id: "e3",
    day: 1,
    start: 9.5,
    end: 10,
    title: "Standup",
  },
  {
    id: "e4",
    day: 1,
    start: 13,
    end: 15,
    title: "Design review",
    subtitle: "Brand kit v2 — colour, spacing, radius tokens.",
    color: "#F79824",
  },
  {
    id: "e5",
    day: 2,
    start: 9,
    end: 9.5,
    title: "Standup",
  },
  {
    id: "e6",
    day: 3,
    start: 11,
    end: 12,
    title: "Invoice cutoff",
    subtitle: "Finalise line items before month-end billing run.",
    color: "#E24E1B",
  },
  {
    id: "e7",
    day: 4,
    start: 14,
    end: 16,
    title: "Sprint planning",
  },
];

export default function InteractiveTimetableDemo() {
  return (
    <div className="w-full bg-background p-10">
      <InteractiveTimetable events={events} onEventClick={(event) => console.log(event)} />
    </div>
  );
}
