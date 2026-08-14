import {
  Type,
  Heading1,
  Image as ImageIcon,
  MousePointerClick,
  Minus,
  ArrowUpDown,
  Share2,
  FileText,
  LucideIcon,
} from 'lucide-react'
import { BLOCKS } from './email-builder-constants'

interface SidebarDragData {
  origin: 'sidebar'
  type: 'element' | 'block'
  elementType?: string
  blockId?: string
}

interface CanvasDragData {
  origin: 'canvas'
  elementId: string
  index: number
}

export type DragData = SidebarDragData | CanvasDragData

const ELEMENT_ICONS: Record<string, LucideIcon> = {
  text: Type,
  heading: Heading1,
  image: ImageIcon,
  button: MousePointerClick,
  divider: Minus,
  spacer: ArrowUpDown,
  social: Share2,
  footer: FileText,
}

const ELEMENT_LABELS: Record<string, string> = {
  text: 'Text',
  heading: 'Heading',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
  spacer: 'Spacer',
  social: 'Social Links',
  footer: 'Footer',
}

interface DragOverlayContentProps {
  dragData: DragData | null
}

export function DragOverlayContent({ dragData }: DragOverlayContentProps) {
  if (!dragData) return null

  if (dragData.origin === 'sidebar' && dragData.type === 'element') {
    const elementType = dragData.elementType || ''
    const Icon = ELEMENT_ICONS[elementType]
    const label = ELEMENT_LABELS[elementType] || elementType

    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg opacity-80">
        {Icon && <Icon className="h-4 w-4 text-blue-600" />}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
    )
  }

  if (dragData.origin === 'sidebar' && dragData.type === 'block') {
    const block = BLOCKS.find((b) => b.id === dragData.blockId)
    if (!block) return null

    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg opacity-80">
        <span className="text-lg">{block.icon}</span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{block.label}</span>
          <span className="text-xs text-gray-500">{block.description}</span>
        </div>
      </div>
    )
  }

  if (dragData.origin === 'canvas') {
    const elementId = dragData.elementId
    // Extract element type from the ID pattern (e.g., "text-abc123" -> "text")
    const elementType = elementId.split('-')[0]
    const Icon = ELEMENT_ICONS[elementType]
    const label = ELEMENT_LABELS[elementType] || 'Element'

    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg scale-95">
        {Icon && <Icon className="h-4 w-4 text-blue-600" />}
        <span className="text-sm font-medium text-blue-700">Moving: {label}</span>
      </div>
    )
  }

  return null
}
