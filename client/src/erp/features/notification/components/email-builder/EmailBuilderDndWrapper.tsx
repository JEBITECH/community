import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEmailBuilder, EmailElement } from './EmailBuilderContext'
import { BLOCKS } from './email-builder-constants'

// Custom collision detection: prefer pointerWithin, fallback to rectIntersection
// This works better than closestCenter for cross-container drags (sidebar → canvas)
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) {
    return pointerCollisions
  }
  return rectIntersection(args)
}

// --- Drag Data Types ---

export interface SidebarDragData {
  origin: 'sidebar'
  type: 'element' | 'block'
  elementType?: EmailElement['type']
  blockId?: string
}

export interface CanvasDragData {
  origin: 'canvas'
  elementId: string
  index: number
}

export type DragData = SidebarDragData | CanvasDragData

// --- DnD State Context ---

interface DndDragState {
  activeDragData: DragData | null
  dropIndicatorIndex: number | null
}

const DndDragStateContext = createContext<DndDragState>({
  activeDragData: null,
  dropIndicatorIndex: null,
})

export function useDndDragState() {
  return useContext(DndDragStateContext)
}

// --- DragOverlayContent ---

function DragOverlayContent({ dragData }: { dragData: DragData | null }) {
  if (!dragData) return null

  if (dragData.origin === 'sidebar') {
    if (dragData.type === 'element' && dragData.elementType) {
      return (
        <div className="bg-white border border-primary rounded-md px-3 py-2 shadow-lg opacity-80 text-sm font-medium capitalize">
          {dragData.elementType}
        </div>
      )
    }
    if (dragData.type === 'block' && dragData.blockId) {
      const block = BLOCKS.find((b) => b.id === dragData.blockId)
      if (block) {
        return (
          <div className="bg-white border border-primary rounded-md px-3 py-2 shadow-lg opacity-80">
            <div className="text-sm font-medium">{block.icon} {block.label}</div>
            <div className="text-xs text-muted-foreground">{block.description}</div>
          </div>
        )
      }
    }
    return null
  }

  if (dragData.origin === 'canvas') {
    return (
      <div className="bg-white border border-primary rounded-md px-3 py-2 shadow-lg opacity-70 text-sm">
        Moving element...
      </div>
    )
  }

  return null
}

// --- EmailBuilderDndWrapper ---

interface EmailBuilderDndWrapperProps {
  children: ReactNode
}


function generateElementId(type: string): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getDefaultContent(type: string): string {
  switch (type) {
    case 'text': return 'Your email content goes here. Click to edit this text.'
    case 'heading': return 'Email Heading'
    case 'button': return 'Click Here'
    case 'image': return 'https://via.placeholder.com/600x300'
    case 'social': return 'Follow us on social media'
    case 'footer': return 'Copyright © 2024 Your Company. All rights reserved.'
    default: return ''
  }
}

function getDefaultStyles(type: string): Record<string, string> {
  switch (type) {
    case 'text': return { fontSize: '16px', lineHeight: '1.6', color: '#333333', fontFamily: 'Arial, sans-serif', padding: '10px 20px' }
    case 'heading': return { fontSize: '24px', fontWeight: 'bold', color: '#333333', fontFamily: 'Arial, sans-serif', padding: '20px 20px 10px 20px', textAlign: 'left' }
    case 'button': return { backgroundColor: '#007bff', color: '#ffffff', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '10px 20px' }
    case 'image': return { width: '100%', maxWidth: '600px', height: 'auto', display: 'block', margin: '0 auto' }
    case 'divider': return { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' }
    case 'spacer': return { height: '20px', width: '100%' }
    case 'social': return { textAlign: 'center', padding: '20px' }
    case 'footer': return { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa' }
    default: return {}
  }
}

function getDefaultProperties(type: string): Record<string, any> {
  switch (type) {
    case 'button': return { href: '#', target: '_blank' }
    case 'image': return { alt: 'Email image', href: '' }
    case 'social': return { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] }
    default: return {}
  }
}

export function EmailBuilderDndWrapper({ children }: EmailBuilderDndWrapperProps) {
  const { elements, insertElementAt, insertElementsAt, moveElement } = useEmailBuilder()
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null)
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    if (data) {
      setActiveDragData(data)
    }
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event
      if (!over) {
        setDropIndicatorIndex(null)
        return
      }

      // Calculate drop index based on the over element's position in the elements array
      const overIndex = elements.findIndex((el) => el.id === over.id)
      if (overIndex !== -1) {
        setDropIndicatorIndex(overIndex)
      } else {
        // If over is a droppable zone (e.g., canvas container), drop at end
        setDropIndicatorIndex(elements.length)
      }
    },
    [elements]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      // Reset drag state
      setActiveDragData(null)
      setDropIndicatorIndex(null)

      // No-op when drop is outside canvas (over is null)
      if (!over) return

      const dragData = active.data.current as DragData | undefined
      if (!dragData) return

      // Calculate drop index from over.id
      const overIndex = elements.findIndex((el) => el.id === over.id)
      // If over.id matches an element, use its index; if it's the canvas droppable, insert at end
      const dropIndex = overIndex !== -1 ? overIndex : elements.length

      if (dragData.origin === 'sidebar') {
        if (dragData.type === 'element' && dragData.elementType) {
          // Insert a new element at the drop position with default content/styles
          const newElement: EmailElement = {
            id: generateElementId(dragData.elementType),
            type: dragData.elementType,
            content: getDefaultContent(dragData.elementType),
            styles: getDefaultStyles(dragData.elementType),
            properties: getDefaultProperties(dragData.elementType),
          }
          insertElementAt(newElement, dropIndex)
        } else if (dragData.type === 'block' && dragData.blockId) {
          // Find the block and insert all its elements
          const block = BLOCKS.find((b) => b.id === dragData.blockId)
          if (block) {
            const newElements: EmailElement[] = block.elements.map((el) => {
              const { children, ...rest } = el
              return {
                ...rest,
                id: generateElementId(el.type),
                type: el.type as EmailElement['type'],
              }
            })
            insertElementsAt(newElements, dropIndex)
          }
        }
      } else if (dragData.origin === 'canvas') {
        // Canvas reorder: move element from its current index to the drop index
        const fromIndex = dragData.index
        if (fromIndex !== dropIndex) {
          moveElement(fromIndex, dropIndex)
        }
      }
    },
    [elements, insertElementAt, insertElementsAt, moveElement]
  )

  return (
    <DndDragStateContext.Provider value={{ activeDragData, dropIndicatorIndex }}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          <DragOverlayContent dragData={activeDragData} />
        </DragOverlay>
      </DndContext>
    </DndDragStateContext.Provider>
  )
}
