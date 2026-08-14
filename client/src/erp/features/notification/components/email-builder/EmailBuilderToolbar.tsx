import { useEffect, useState } from 'react'
import { Monitor, Smartphone, Undo, Redo, Code, Copy, Check, Save, Eye, EyeOff } from 'lucide-react'
import { useEmailBuilder } from './EmailBuilderContext'
import type { VariableItem } from './VariablePicker'
import { VariablePicker } from './VariablePicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface EmailBuilderToolbarProps {
  onSaveDraft?: () => void
  onSaveAndExit?: () => void
  isSaving?: boolean
  showPreview?: boolean
  onTogglePreview?: () => void
  saveAndExitLabel?: string
  onVariableInsert?: (variable: VariableItem) => void
}

export function EmailBuilderToolbar({
  onSaveDraft,
  onSaveAndExit,
  isSaving,
  showPreview,
  onTogglePreview,
  saveAndExitLabel = 'Save & Exit',
  onVariableInsert,
}: EmailBuilderToolbarProps) {
  const {
    previewMode,
    setPreviewMode,
    selectedElement,
    updateElement,
    undo,
    redo,
    canUndo,
    canRedo,
    elements,
    templateSettings,
  } = useEmailBuilder()
  const { toast } = useToast()
  const [showHtmlDialog, setShowHtmlDialog] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [copied, setCopied] = useState(false)

  const stylesToString = (styles?: Record<string, string>): string => {
    if (!styles) return ''
    return Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')
  }

  const generateHTML = () => {
    const elementsHTML = elements.map(element => {
      switch (element.type) {
        case 'heading':
          return `<h2 style="${stylesToString(element.styles)}">${element.content || 'Heading'}</h2>`
        case 'text':
          return `<div style="${stylesToString(element.styles)}">${element.content || 'Text content'}</div>`
        case 'image':
          const imgHref = element.properties?.href
          const imgTag = `<img src="${element.content || 'https://via.placeholder.com/600x300'}" alt="${element.properties?.alt || 'Email image'}" style="${stylesToString(element.styles)}" />`
          return imgHref ? `<a href="${imgHref}">${imgTag}</a>` : imgTag
        case 'button':
          return `<div style="text-align: center; padding: 10px 20px;"><a href="${element.properties?.href || '#'}" target="${element.properties?.target || '_blank'}" style="${stylesToString(element.styles)}">${element.content || 'Button'}</a></div>`
        case 'divider':
          return `<hr style="${stylesToString(element.styles)}" />`
        case 'spacer':
          return `<div style="${stylesToString(element.styles)}"></div>`
        case 'social':
          const platforms = element.properties?.platforms || []
          const socialLinks = platforms.map((platform: string) =>
            `<a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #007bff; border-radius: 50%; text-align: center; line-height: 32px; color: white; text-decoration: none; margin: 0 5px;">${platform.charAt(0).toUpperCase()}</a>`
          ).join('')
          return `<div style="${stylesToString(element.styles)}"><div style="margin-bottom: 10px;">${element.content}</div><div style="text-align: center;">${socialLinks}</div></div>`
        case 'footer':
          return `<div style="${stylesToString(element.styles)}">${element.content || 'Footer content'}</div>`
        default:
          return ''
      }
    }).join('\n          ')

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateSettings.subject || 'Email Template'}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr>
              <td>
                ${elementsHTML}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  }

  const handleViewHtml = () => {
    setHtmlContent(generateHTML())
    setShowHtmlDialog(true)
    setCopied(false)
  }

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const handleVariableInsert = (variable: string) => {
    if (!selectedElement) {
      toast({
        title: 'No element selected',
        description: 'Select a text element first to insert a variable.',
        variant: 'destructive',
      })
      return
    }

    const textTypes = ['text', 'heading', 'button', 'footer']
    if (!textTypes.includes(selectedElement.type)) {
      toast({
        title: 'Cannot insert variable',
        description: 'Variables can only be inserted into text, heading, button, or footer elements.',
        variant: 'destructive',
      })
      return
    }

    const currentContent = selectedElement.content || ''
    updateElement(selectedElement.id, { content: currentContent + variable })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return (
    <div className="px-4 py-2 flex items-center justify-between border-b">
      {/* Left side - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" title="Undo" onClick={undo} disabled={!canUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Redo" onClick={redo} disabled={!canRedo}>
          <Redo className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button variant="ghost" size="sm" title="View HTML" onClick={handleViewHtml}>
          <Code className="h-4 w-4" />
        </Button>
        <VariablePicker onInsert={handleVariableInsert} onVariableSelect={onVariableInsert} />
      </div>

      {/* Center - Viewport Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`p-2 rounded transition-colors ${
              previewMode === 'desktop'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
            title="Desktop view (600px)"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`p-2 rounded transition-colors ${
              previewMode === 'mobile'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
            title="Mobile view (320px)"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
        {onTogglePreview && (
          <Button
            variant={showPreview ? 'default' : 'ghost'}
            size="sm"
            onClick={onTogglePreview}
            title={showPreview ? 'Exit Preview' : 'Preview Email'}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
        )}
      </div>

      {/* Right side - Save actions */}
      <div className="flex items-center gap-2">
        {onSaveDraft && (
          <Button variant="outline" size="sm" onClick={onSaveDraft} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
        {onSaveAndExit && (
          <Button size="sm" onClick={onSaveAndExit} disabled={isSaving}>
            {saveAndExitLabel}
          </Button>
        )}
      </div>

      {/* HTML View Dialog */}
      <Dialog open={showHtmlDialog} onOpenChange={setShowHtmlDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>HTML Source</span>
              <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <pre className="overflow-auto max-h-[60vh] p-4 bg-muted rounded-lg text-xs font-mono whitespace-pre-wrap break-words">
            {htmlContent}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
