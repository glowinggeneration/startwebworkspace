import { FolderCard } from "@/components/ui/folder-card";

export default function FolderCardDemo() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-8 bg-background p-10">
      {/* No cover image, so the built-in brand-blue aurora gradient stands in. */}
      <FolderCard
        title="Brand kit"
        subtitle="Logos & Typography"
        count="18"
        countLabel="Files"
        meta="240 Assets"
      />

      {/* Every string is a prop; the colours follow the light / dark theme. */}
      <FolderCard
        title="Field notes"
        subtitle="Research & Ideas"
        count="12"
        countLabel="Docs"
        meta="842 Notes"
      />
    </div>
  );
}
