import { useState } from "react";
import { IOKnob } from "@/components/ui/io-knob";

export default function IOKnobDemo() {
  const [volume, setVolume] = useState(60);
  const [allocation, setAllocation] = useState(50);

  return (
    <div className="flex w-full flex-wrap items-end justify-center gap-10 bg-background p-10">
      <IOKnob label="Volume" value={volume} onChange={setVolume} unit="%" />
      <IOKnob
        label="Weekly load"
        value={allocation}
        onChange={setAllocation}
        min={0}
        max={40}
        step={5}
        size={88}
        unit="h"
      />
      <IOKnob label="Disabled" value={30} disabled />
    </div>
  );
}
