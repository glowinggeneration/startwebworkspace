import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { usePackages } from "@/hooks/use-packages";
import { currency, documentTotal } from "@/lib/sales/currency";

export interface LineItemDraft {
  packageId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function emptyLineItem(): LineItemDraft {
  return { packageId: null, description: "", quantity: 1, unitPrice: 0 };
}

export function LineItemsEditor({
  items,
  onChange,
}: {
  items: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
}) {
  const { workspaceId } = useActiveWorkspace();
  const { data: packages } = usePackages(workspaceId);

  function update(index: number, patch: Partial<LineItemDraft>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addFromPackage(packageId: string) {
    const pkg = packages?.find((p) => p.id === packageId);
    if (!pkg) return;
    onChange([
      ...items,
      { packageId: pkg.id, description: pkg.name, quantity: 1, unitPrice: pkg.price },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Description"
              className="min-w-[10rem] flex-1"
              value={item.description}
              onChange={(event) => update(index, { description: event.target.value })}
            />
            <Input
              type="number"
              min={0}
              step={1}
              className="w-20"
              aria-label="Quantity"
              value={item.quantity}
              onChange={(event) => update(index, { quantity: event.target.valueAsNumber || 0 })}
            />
            <Input
              type="number"
              min={0}
              step={100}
              className="w-28"
              aria-label="Unit price"
              value={item.unitPrice}
              onChange={(event) => update(index, { unitPrice: event.target.valueAsNumber || 0 })}
            />
            <span className="type-meta w-24 text-right text-muted-foreground">
              {currency.format(item.quantity * item.unitPrice)}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => remove(index)}
              aria-label="Remove line"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="type-meta text-muted-foreground">No line items yet.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([...items, emptyLineItem()])}
        >
          <Plus className="size-4" aria-hidden="true" />
          Custom line
        </Button>
        <Select onValueChange={addFromPackage} value="">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Add from package…" />
          </SelectTrigger>
          <SelectContent>
            {packages?.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="type-card ml-auto">
          Total{" "}
          {currency.format(
            documentTotal(
              items.map((i) => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              })),
            ),
          )}
        </span>
      </div>
    </div>
  );
}
