import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { CanvasDragData } from './EmailBuilderDndWrapper'

interface SortableCanvasElementProps {
  id: string
  index: number
  children: ReactNode
  showPreview: boolean
}

export function SortableCanvasElement({
  id,
  index,
  children,
  showPreview,
}: SortableCanvasElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      origin: 'canvas',
      elementId: id,
      index,
    } satisfies CanvasDragData,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle – visible on hover, hidden in preview mode */}
      {!showPreview && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full px-1 py-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Element content */}
      {children}
    </div>
  )
}
