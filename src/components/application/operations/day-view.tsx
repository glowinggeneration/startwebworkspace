import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, ListChecks, PhoneCall, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyState,
  MetricTile,
  Panel,
  SegmentedControl,
  Toolbar,
} from "@/components/application/shell/page-parts";
import {
  ACTIVITY_TYPES,
  OUTCOMES,
  totalsFromEvents,
  useDeleteActivity,
  useLogActivity,
  useUpdateAccountMotion,
  type ActivityEvent,
  type ActivityType,
  type OpsAccount,
  type OutcomeValue,
} from "@/hooks/use-operations";

/**
 * The working day: the list in front of the person, one tap to record what
 * happened, and live totals that come from the rows just written.
 */
export function DayView({
  workspaceId,
  date,
  accounts,
  events,
}: {
  workspaceId: string;
  date: string;
  accounts: OpsAccount[];
  events: ActivityEvent[];
}) {
  const logActivity = useLogActivity(workspaceId);
  const deleteActivity = useDeleteActivity(workspaceId);
  const updateMotion = useUpdateAccountMotion(workspaceId);
  const [world, setWorld] = useState<"targeted" | "existing">("targeted");
  const [search, setSearch] = useState("");
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextDate, setNextDate] = useState("");

  const totals = useMemo(() => totalsFromEvents(events), [events]);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts
      .filter((account) => (account.world === "existing") === (world === "existing"))
      .filter((account) =>
        term
          ? [account.name, account.next_step ?? "", account.source ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(term)
          : true,
      )
      .sort((a, b) => (a.next_date ?? "9999").localeCompare(b.next_date ?? "9999"));
  }, [accounts, world, search]);

  async function record(account: OpsAccount, type: ActivityType, outcome: OutcomeValue | null) {
    try {
      await logActivity.mutateAsync({
        accountId: account.id,
        eventDate: date,
        eventType: type,
        outcome,
        notes: openAccountId === account.id && note ? note : null,
      });
      if (openAccountId === account.id) setNote("");
      toast.success(`Logged against ${account.name}`);
    } catch (error) {
      toast.error("Couldn't log that", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function saveNextStep(account: OpsAccount) {
    try {
      await updateMotion.mutateAsync({
        id: account.id,
        next_step: nextStep || null,
        next_date: nextDate || null,
      });
      setNextStep("");
      setNextDate("");
      toast.success("Next step saved");
    } catch (error) {
      toast.error("Couldn't save the next step", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const todaysEvents = events.filter((event) => event.event_date === date);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="Outreach" value={String(totals.outreach)} hint="Companies contacted" />
        <MetricTile
          label="Conversations"
          value={String(totals.conversations)}
          hint="People who actually spoke"
        />
        <MetricTile
          label="Meetings"
          value={`${totals.meetingsBooked} booked · ${totals.meetingsHeld} held`}
        />
        <MetricTile label="Written offers" value={String(totals.offers)} />
      </div>

      <Toolbar>
        <SegmentedControl
          ariaLabel="Which list"
          value={world}
          onValueChange={setWorld}
          options={[
            { value: "targeted", label: "Targeted companies" },
            { value: "existing", label: "Existing clients" },
          ]}
        />
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search companies..."
            aria-label="Search companies"
            className="h-11 bg-card pl-9"
          />
        </div>
      </Toolbar>

      <Panel>
        {list.length === 0 ? (
          <EmptyState
            icon={PhoneCall}
            title="Nothing on this list yet"
            description="Import a calling list or add a company to start the day."
          />
        ) : (
          <ul className="divide-y divide-border">
            {list.map((account) => {
              const isOpen = openAccountId === account.id;
              const logged = todaysEvents.filter((event) => event.account_id === account.id);
              const needsNextDate = !account.next_date;
              return (
                <li key={account.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {account.contacts[0]?.phone ?? "No phone on file"}
                        {account.source ? ` · ${account.source}` : ""}
                      </p>
                      <p
                        className={
                          needsNextDate
                            ? "mt-1 text-sm font-medium text-destructive"
                            : "mt-1 text-sm text-muted-foreground"
                        }
                      >
                        {account.next_step
                          ? `${account.next_step}${account.next_date ? ` · ${account.next_date}` : " · no date set"}`
                          : "No next step set"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          ["no_answer", "No answer"],
                          ["left_note", "Left note"],
                          ["spoke", "Spoke"],
                          ["meeting", "Meeting"],
                        ] as [OutcomeValue, string][]
                      ).map(([outcome, label]) => (
                        <Button
                          key={outcome}
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            record(
                              account,
                              outcome === "spoke"
                                ? "conversation"
                                : outcome === "meeting"
                                  ? "meeting_booked"
                                  : "outreach",
                              outcome,
                            )
                          }
                        >
                          {label}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOpenAccountId(isOpen ? null : account.id);
                          setNextStep(account.next_step ?? "");
                          setNextDate(account.next_date ?? "");
                          setNote("");
                        }}
                      >
                        {isOpen ? "Close" : "More"}
                      </Button>
                    </div>
                  </div>

                  {logged.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Today: {logged.length} logged
                    </p>
                  ) : null}

                  {isOpen ? (
                    <div className="mt-4 space-y-3 rounded-card bg-muted/40 p-4">
                      <div className="flex flex-wrap gap-2">
                        {ACTIVITY_TYPES.filter(
                          (type) => !["outreach", "conversation"].includes(type.value),
                        ).map((type) => (
                          <Button
                            key={type.value}
                            size="sm"
                            variant="secondary"
                            onClick={() => record(account, type.value, null)}
                          >
                            {type.label}
                          </Button>
                        ))}
                      </div>
                      <Textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="What was said (saved with the next action you log)"
                        aria-label="Note for this company"
                      />
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-56 flex-1">
                          <label
                            className="text-xs text-muted-foreground"
                            htmlFor={`next-step-${account.id}`}
                          >
                            Next step
                          </label>
                          <Input
                            id={`next-step-${account.id}`}
                            value={nextStep}
                            onChange={(event) => setNextStep(event.target.value)}
                            placeholder="Call the owner back"
                          />
                        </div>
                        <div>
                          <label
                            className="text-xs text-muted-foreground"
                            htmlFor={`next-date-${account.id}`}
                          >
                            Next date
                          </label>
                          <Input
                            id={`next-date-${account.id}`}
                            type="date"
                            value={nextDate}
                            onChange={(event) => setNextDate(event.target.value)}
                          />
                        </div>
                        <Button onClick={() => saveNextStep(account)}>Save next step</Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Logged today</h2>
        </div>
        {todaysEvents.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Nothing logged yet"
            description="Every action you record today appears here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {todaysEvents.map((event) => {
              const account = accounts.find((item) => item.id === event.account_id);
              const type = ACTIVITY_TYPES.find((item) => item.value === event.event_type);
              const outcome = OUTCOMES.find((item) => item.value === event.outcome);
              return (
                <li key={event.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {account?.name ?? "Unlinked"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type?.label ?? event.event_type}
                      {outcome ? ` · ${outcome.label}` : ""}
                      {event.notes ? ` · ${event.notes}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteActivity.mutate(event.id)}
                    aria-label="Remove this entry"
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
