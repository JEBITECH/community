import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useEmailBuilder } from './EmailBuilderContext'
import { SortableCanvasElement } from './SortableCanvasElement'
import { DropIndicator } from './DropIndicator'
import { useDndDragState } from './EmailBuilderDndWrapper'
import { Trash2 } from 'lucide-react'

interface EmailBuilderCanvasProps {
  showPreview?: boolean
}

export function EmailBuilderCanvas({ showPreview = false }: EmailBuilderCanvasProps) {
  const { elements, selectedElement, selectElement, deleteElement, previewMode } = useEmailBuilder()
  const { dropIndicatorIndex, activeDragData } = useDndDragState()
  const sortableItems = elements.map((el) => el.id)

  // Make the canvas a droppable zone so sidebar items can be dropped even when empty
  const { setNodeRef: setCanvasDropRef } = useDroppable({
    id: 'email-canvas-droppable',
  })

  const renderElement = (element: any) => {
    const isSelected = selectedElement?.id === element.id
    const baseClasses = showPreview
      ? ''
      : `cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-muted-foreground'
        }`

    const commonProps = {
      onClick: (e: React.MouseEvent) => {
        if (!showPreview) {
          e.stopPropagation()
          selectElement(element)
        }
      },
      className: `relative group ${baseClasses}`,
      style: element.styles || {},
    }

    switch (element.type) {
      case 'text':
        return (
          <div {...commonProps}>
            <div 
              style={element.styles}
              dangerouslySetInnerHTML={{ __html: element.content || 'Text content' }}
            />
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      case 'heading':
        return (
          <div {...commonProps}>
            <h2 style={element.styles}>
              {element.content || 'Email Heading'}
            </h2>
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      case 'image':
        return (
          <div {...commonProps}>
            <img 
              src={element.content || 'https://via.placeholder.com/600x300'} 
              alt={element.properties?.alt || 'Email image'}
              style={element.styles}
            />
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      case 'button':
        return (
          <div {...commonProps}>
            <div style={{ textAlign: element.styles?.textAlign || 'center', padding: '10px 20px' }}>
              <a 
                href={element.properties?.href || '#'}
                style={element.styles}
                target={element.properties?.target || '_blank'}
              >
                {element.content || 'Button Text'}
              </a>
            </div>
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      case 'divider':
        return (
          <div {...commonProps}>
            <hr style={element.styles} />
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      case 'spacer':
        return (
          <div {...commonProps}>
            <div style={element.styles}>
              {!showPreview && (
                <div className="border-2 border-dashed border-muted-foreground/30 h-full flex items-center justify-center text-xs text-muted-foreground">
                  Spacer ({element.styles?.height || '20px'})
                </div>
              )}
            </div>
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      case 'social':
        return (
          <div {...commonProps}>
            <div style={element.styles}>
              <div style={{ marginBottom: '10px' }}>{element.content}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {element.properties?.platforms?.map((platform: string) => (
                  <a 
                    key={platform}
                    href="#"
                    style={{
                      display: 'inline-block',
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#007bff',
                      borderRadius: '50%',
                      textAlign: 'center',
                      lineHeight: '32px',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '14px'
                    }}
                  >
                    {platform.charAt(0).toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      case 'footer':
        return (
          <div {...commonProps}>
            <div style={element.styles}>
              {element.content || 'Footer content'}
            </div>
            {!showPreview && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteElement(element.id)
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const canvasWidth = previewMode === 'desktop' ? '600px' : '320px'

  return (
    <div
      className="min-h-full p-8 flex justify-center"
      onClick={() => !showPreview && selectElement(null)}
    >
      <div 
        ref={setCanvasDropRef}
        className="bg-white shadow-lg min-h-[800px]"
        style={{ 
          width: canvasWidth,
          maxWidth: '100%',
          transition: 'width 0.3s ease'
        }}
      >
        {elements.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Start building your email template
              </p>
              <p className="text-sm text-muted-foreground">
                Add elements from the sidebar to get started
              </p>
            </div>
          </div>
        ) : (
          <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
            <div>
              {elements.map((element, index) => (
                <div key={element.id}>
                  <DropIndicator isVisible={activeDragData !== null && dropIndicatorIndex === index} />
                  <SortableCanvasElement
                    id={element.id}
                    index={index}
                    showPreview={showPreview}
                  >
                    {renderElement(element)}
                  </SortableCanvasElement>
                </div>
              ))}
              <DropIndicator isVisible={activeDragData !== null && dropIndicatorIndex === elements.length} />
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}
