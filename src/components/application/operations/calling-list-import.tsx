import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, Panel } from "@/components/application/shell/page-parts";
import {
  matchRows,
  useCommitCallingList,
  type ImportRow,
  type MatchedRow,
} from "@/hooks/use-calling-list-import";
import { useCallingListImports, type OpsAccount } from "@/hooks/use-operations";

const FIELDS: { key: keyof ImportRow; label: string; required: boolean }[] = [
  { key: "company", label: "Company name", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "activityDate", label: "Date of activity", required: true },
  { key: "outcome", label: "Outcome", required: true },
  { key: "contact", label: "Contact person", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "nextStep", label: "Next step", required: false },
  { key: "nextDate", label: "Next date", required: false },
];

const MAPPING_STORAGE_KEY = "startweb.calling-list-mapping";

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/** Upload a calling list, say once which column is which, check what the
 * app matched, then commit. Nothing is written before the commit. */
export function CallingListImport({
  workspaceId,
  accounts,
}: {
  workspaceId: string;
  accounts: OpsAccount[];
}) {
  const commit = useCommitCallingList(workspaceId);
  const { data: history } = useCallingListImports(workspaceId);
  const [fileName, setFileName] = useState("");
  const [listName, setListName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const mappedRows: ImportRow[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.map((raw) => {
      const pick = (field: keyof ImportRow) => {
        const column = mapping[field];
        return column ? cellText(raw[column]) : "";
      };
      return {
        company: pick("company"),
        phone: pick("phone"),
        activityDate: pick("activityDate"),
        outcome: pick("outcome"),
        contact: pick("contact"),
        industry: pick("industry"),
        notes: pick("notes"),
        nextStep: pick("nextStep"),
        nextDate: pick("nextDate"),
      };
    });
  }, [rawRows, mapping]);

  const matches: MatchedRow[] = useMemo(
    () => (mappedRows.length > 0 ? matchRows(mappedRows, accounts) : []),
    [mappedRows, accounts],
  );

  const counts = {
    existing: matches.filter((m) => m.kind === "existing").length,
    created: matches.filter((m) => m.kind === "new").length,
    ambiguous: matches.filter((m) => m.kind === "ambiguous").length,
    invalid: matches.filter((m) => m.kind === "invalid").length,
  };

  const requiredMapped = FIELDS.filter((field) => field.required).every(
    (field) => mapping[field.key],
  );

  async function handleFile(file: File) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      toast.error("That file has no sheets in it");
      return;
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (rows.length === 0) {
      toast.error("That sheet has no rows");
      return;
    }
    const columns = Object.keys(rows[0] ?? {});
    setFileName(file.name);
    setListName((current) => current || file.name.replace(/\.[^.]+$/, ""));
    setHeaders(columns);
    setRawRows(rows);

    // Reuse the column mapping from the last file with the same headers,
    // so a recurring template only has to be mapped once.
    const stored = window.localStorage.getItem(MAPPING_STORAGE_KEY);
    if (stored) {
      try {
        const saved = JSON.parse(stored) as Record<string, string>;
        const usable = Object.fromEntries(
          Object.entries(saved).filter(([, column]) => columns.includes(column)),
        );
        setMapping(usable);
      } catch {
        setMapping({});
      }
    }
  }

  async function handleCommit() {
    try {
      const result = await commit.mutateAsync({ fileName, listName, mapping, matches });
      window.localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
      toast.success(
        `Imported ${result.activities} activities and added ${result.companies} companies`,
      );
      setHeaders([]);
      setRawRows([]);
      setFileName("");
    } catch (error) {
      toast.error("Couldn't import that list", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <h2 className="text-base font-semibold text-foreground">Upload a calling list</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Excel or CSV. Companies already on the platform get the activity added to the record you
          already have, never a second copy.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm text-muted-foreground" htmlFor="ops-file">
              File
            </label>
            <Input
              id="ops-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>
          <div className="min-w-56 flex-1">
            <label className="text-sm text-muted-foreground" htmlFor="ops-list-name">
              List name
            </label>
            <Input
              id="ops-list-name"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder="September manufacturing"
            />
          </div>
        </div>
      </Panel>

      {headers.length > 0 ? (
        <>
          <Panel className="p-6">
            <h2 className="text-base font-semibold text-foreground">Match the columns</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-sm text-muted-foreground">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  <Select
                    value={mapping[field.key] ?? "none"}
                    onValueChange={(value) =>
                      setMapping((current) => {
                        const next = { ...current };
                        if (value === "none") delete next[field.key];
                        else next[field.key] = value;
                        return next;
                      })
                    }
                  >
                    <SelectTrigger aria-label={field.label}>
                      <SelectValue placeholder="Not in this file" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not in this file</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Check before importing: {counts.existing} matched · {counts.created} new ·{" "}
                {counts.ambiguous} unclear · {counts.invalid} skipped
              </h2>
              <Button
                onClick={handleCommit}
                disabled={!requiredMapped || commit.isPending || counts.existing + counts.created === 0}
              >
                <Upload className="size-4" aria-hidden="true" /> Import{" "}
                {counts.existing + counts.created} rows
              </Button>
            </div>
            {!requiredMapped ? (
              <p className="px-5 py-4 text-sm text-destructive">
                Company name, phone, date of activity and outcome all need a column before this can
                be imported.
              </p>
            ) : null}
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {matches.slice(0, 200).map((match, index) => (
                <li
                  key={`${match.row.company}-${index}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {match.row.company || "Blank company"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.row.activityDate} · {match.row.outcome || "no outcome"}
                      {match.problem ? ` · ${match.problem}` : ""}
                      {match.kind === "ambiguous"
                        ? ` · matches ${match.candidates.map((c) => c.name).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={
                      match.kind === "existing"
                        ? "text-xs font-medium text-primary"
                        : match.kind === "new"
                          ? "text-xs font-medium text-foreground"
                          : "text-xs font-medium text-destructive"
                    }
                  >
                    {match.kind === "existing"
                      ? "Existing company"
                      : match.kind === "new"
                        ? "New company"
                        : match.kind === "ambiguous"
                          ? "Unclear, skipped"
                          : "Skipped"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      ) : null}

      <Panel>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Lists imported before</h2>
        </div>
        {(history?.length ?? 0) === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No lists imported yet"
            description="Imported lists keep their name so reports can show which list produced conversations."
          />
        ) : (
          <ul className="divide-y divide-border">
            {(history ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.list_name ?? item.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.imported_at).toLocaleDateString()} · {item.file_name}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.companies_created} new companies · {item.activities_created} activities
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
