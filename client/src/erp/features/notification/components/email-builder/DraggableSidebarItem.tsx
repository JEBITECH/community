import { ReactNode } from 'react'
import { useDraggable } from '@dnd-kit/core'

export interface SidebarDragData {
  origin: 'sidebar'
  type: 'element' | 'block'
  elementType?: string
  blockId?: string
}

interface DraggableSidebarItemProps {
  id: string
  data: SidebarDragData
  children: ReactNode
  onClick?: () => void
}

export function DraggableSidebarItem({ id, data, children, onClick }: DraggableSidebarItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ opacity: isDragging ? 0.5 : undefined }}
    >
      {children}
    </div>
  )
}
