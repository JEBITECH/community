import { useState } from 'react'
import { 
  Type, 
  Heading1, 
  Image, 
  MousePointer, 
  Minus, 
  Space, 
  Share2, 
  Mail
} from 'lucide-react'
import { useEmailBuilder, EmailElement } from './EmailBuilderContext'
import { DraggableSidebarItem } from './DraggableSidebarItem'
import { BLOCKS, TEMPLATE_PRESETS } from './email-builder-constants'

export function EmailBuilderSidebar() {
  const [activeTab, setActiveTab] = useState<'elements' | 'blocks' | 'templates'>('elements')
  const { addElement, insertElementsAt, setAllElements, elements } = useEmailBuilder()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null)

  const sidebarElements = [
    { id: 'text', label: 'Text', icon: Type, type: 'text' as const },
    { id: 'heading', label: 'Heading', icon: Heading1, type: 'heading' as const },
    { id: 'image', label: 'Image', icon: Image, type: 'image' as const },
    { id: 'button', label: 'Button', icon: MousePointer, type: 'button' as const },
    { id: 'divider', label: 'Divider', icon: Minus, type: 'divider' as const },
    { id: 'spacer', label: 'Spacer', icon: Space, type: 'spacer' as const },
    { id: 'social', label: 'Social Links', icon: Share2, type: 'social' as const },
    { id: 'footer', label: 'Footer', icon: Mail, type: 'footer' as const },
  ]

  const blocks = [
    { id: 'header', label: 'Email Header', preview: '📧', description: 'Logo and navigation' },
    { id: 'hero', label: 'Hero Banner', preview: '🎯', description: 'Main message with CTA' },
    { id: 'newsletter', label: 'Newsletter Content', preview: '📰', description: 'Article layout' },
    { id: 'product', label: 'Product Showcase', preview: '🛍️', description: 'Product grid' },
    { id: 'testimonial', label: 'Testimonial', preview: '💬', description: 'Customer review' },
    { id: 'cta', label: 'Call to Action', preview: '📢', description: 'Centered CTA button' },
    { id: 'footer', label: 'Email Footer', preview: '📄', description: 'Links and unsubscribe' },
  ]

  const templates = [
    { id: 'welcome', label: 'Welcome Email', preview: '👋', description: 'New user onboarding' },
    { id: 'newsletter', label: 'Newsletter', preview: '📰', description: 'Weekly updates' },
    { id: 'promotional', label: 'Promotional', preview: '🎁', description: 'Sales and offers' },
    { id: 'transactional', label: 'Transactional', preview: '📋', description: 'Order confirmations' },
    { id: 'announcement', label: 'Announcement', preview: '📢', description: 'Company news' },
    { id: 'event', label: 'Event Invitation', preview: '🎉', description: 'Event details' },
  ]

  const handleAddElement = (type: string) => {
    const newElement = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
      properties: getDefaultProperties(type),
    }
    addElement(newElement)
  }

  const handleInsertBlock = (blockId: string) => {
    const block = BLOCKS.find(b => b.id === blockId)
    if (!block) return
    const newElements: EmailElement[] = block.elements.map(el => {
      const { children, ...rest } = el
      return {
        ...rest,
        id: `${el.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: el.type as EmailElement['type'],
      }
    })
    insertElementsAt(newElements, elements.length)
  }

  const handleTemplateClick = (templateId: string) => {
    if (elements.length > 0) {
      setPendingTemplate(templateId)
      setShowConfirmDialog(true)
    } else {
      applyTemplate(templateId)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATE_PRESETS.find(t => t.id === templateId)
    if (!template) return
    const newElements: EmailElement[] = template.elements.map(el => {
      const { children, ...rest } = el
      return {
        ...rest,
        id: `${el.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: el.type as EmailElement['type'],
      }
    })
    setAllElements(newElements)
    setShowConfirmDialog(false)
    setPendingTemplate(null)
  }

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case 'text':
        return 'Your email content goes here. Click to edit this text.'
      case 'heading':
        return 'Email Heading'
      case 'button':
        return 'Click Here'
      case 'image':
        return 'https://via.placeholder.com/600x300'
      case 'social':
        return 'Follow us on social media'
      case 'footer':
        return 'Copyright © 2024 Your Company. All rights reserved.'
      default:
        return ''
    }
  }

  const getDefaultStyles = (type: string): Record<string, string> => {
    switch (type) {
      case 'text':
        return {
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#333333',
          fontFamily: 'Arial, sans-serif',
          padding: '10px 20px',
        }
      case 'heading':
        return {
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333333',
          fontFamily: 'Arial, sans-serif',
          padding: '20px 20px 10px 20px',
          textAlign: 'left',
        }
      case 'button':
        return {
          backgroundColor: '#007bff',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '4px',
          textDecoration: 'none',
          display: 'inline-block',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: '10px 20px',
        }
      case 'image':
        return {
          width: '100%',
          maxWidth: '600px',
          height: 'auto',
          display: 'block',
          margin: '0 auto',
        }
      case 'divider':
        return {
          borderTop: '1px solid #dddddd',
          margin: '20px 0',
          width: '100%',
        }
      case 'spacer':
        return {
          height: '20px',
          width: '100%',
        }
      case 'social':
        return {
          textAlign: 'center',
          padding: '20px',
        }
      case 'footer':
        return {
          fontSize: '12px',
          color: '#666666',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f8f9fa',
        }
      default:
        return {}
    }
  }

  const getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'button':
        return {
          href: '#',
          target: '_blank',
        }
      case 'image':
        return {
          alt: 'Email image',
          href: '',
        }
      case 'social':
        return {
          platforms: ['facebook', 'twitter', 'instagram', 'linkedin'],
        }
      default:
        return {}
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('elements')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
              activeTab === 'elements'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Elements
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
              activeTab === 'blocks'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Blocks
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
              activeTab === 'templates'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'elements' && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Drag or click to add
            </p>
            {sidebarElements.map((element) => {
              const Icon = element.icon
              return (
                <DraggableSidebarItem
                  key={element.id}
                  id={`sidebar-element-${element.id}`}
                  data={{ origin: 'sidebar', type: 'element', elementType: element.type }}
                  onClick={() => handleAddElement(element.type)}
                >
                  <div className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-accent hover:border-primary transition-colors text-left cursor-grab active:cursor-grabbing">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{element.label}</span>
                  </div>
                </DraggableSidebarItem>
              )
            })}
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Drag or click to add sections
            </p>
            {blocks.map((block) => (
              <DraggableSidebarItem
                key={block.id}
                id={`sidebar-block-${block.id}`}
                data={{ origin: 'sidebar', type: 'block', blockId: block.id }}
                onClick={() => handleInsertBlock(block.id)}
              >
                <div className="w-full p-3 rounded-lg border bg-background hover:bg-accent hover:border-primary transition-colors text-left cursor-grab active:cursor-grabbing">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{block.preview}</div>
                    <div>
                      <div className="text-sm font-medium">{block.label}</div>
                      <div className="text-xs text-muted-foreground">{block.description}</div>
                    </div>
                  </div>
                </div>
              </DraggableSidebarItem>
            ))}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Email template layouts
            </p>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template.id)}
                className="w-full p-3 rounded-lg border bg-background hover:bg-accent hover:border-primary transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">{template.preview}</div>
                  <div>
                    <div className="text-sm font-medium">{template.label}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Replace Current Content?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Loading this template will replace all current email content. This action can be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowConfirmDialog(false); setPendingTemplate(null) }}
                className="px-4 py-2 text-sm rounded-md border hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => pendingTemplate && applyTemplate(pendingTemplate)}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Load Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
