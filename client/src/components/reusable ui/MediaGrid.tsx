import { cn } from "@/lib/utils";

export interface MediaGridItem {
  src: string;
  description?: string;
  comment?: string;
}

export type MediaGridType = "image" | "video";

interface MediaGridProps {
  title: string;
  items: MediaGridItem[];
  type?: MediaGridType;
  maxItems?: number;
  emptyMessage?: string;
  className?: string;
}

/**
 * Card of media thumbnails (images or videos) with a title + count header.
 * Fills its grid cell height (`h-full flex flex-col`) so multiple MediaGrids
 * placed side by side in a `grid` row line up even when their item counts differ.
 */
export function MediaGrid({
  title,
  items,
  type = "image",
  maxItems = 6,
  emptyMessage = "No items available.",
  className,
}: MediaGridProps) {
  return (
    <div className={cn("flex h-full flex-col rounded-2xl border border-border bg-card p-4", className)}>
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {items.slice(0, maxItems).map((item, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
            >
              <div className="aspect-[4/3] bg-muted/30">
                {type === "image" ? (
                  <img
                    src={item.src}
                    alt={item.description || title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video src={item.src} controls className="h-full w-full object-cover bg-black" />
                )}
              </div>

              {(item.description || item.comment) && (
                <div className="px-3 py-2 text-xs text-muted-foreground line-clamp-2">
                  {item.description || item.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
