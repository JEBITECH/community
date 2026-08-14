import { useState } from 'react'
import { useEmailBuilder } from './EmailBuilderContext'
import { Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-950";

export function EmailBuilderProperties() {
  const [activeTab, setActiveTab] = useState<'element' | 'template' | 'style'>('element')
  const { selectedElement, updateElement } = useEmailBuilder()

  const updateElementStyle = (property: string, value: string) => {
    if (!selectedElement) return
    updateElement(selectedElement.id, {
      styles: {
        ...selectedElement.styles,
        [property]: value
      }
    })
  }

  const updateElementProperty = (property: string, value: any) => {
    if (!selectedElement) return
    updateElement(selectedElement.id, {
      properties: {
        ...selectedElement.properties,
        [property]: value
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('element')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'element'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-3 w-3" />
            Element
          </button>
          {/* <button
            onClick={() => setActiveTab('template')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'template'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="h-3 w-3" />
            Template
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'style'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="h-3 w-3" />
            Style
          </button> */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'element' && (
          <div className="space-y-4">
            {selectedElement ? (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-3">Element Properties</h3>
                  <div className="space-y-3">
                    {/* Content */}
                    {(selectedElement.type === 'text' ||
                      selectedElement.type === 'heading' ||
                      selectedElement.type === 'button' ||
                      selectedElement.type === 'social' ||
                      selectedElement.type === 'footer') && (
                      <div className="space-y-2">
                        <Label className="text-xs">Content</Label>
                        {selectedElement.type === 'text' ? (
                          <Textarea
                            value={selectedElement.content || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              updateElement(selectedElement.id, { content: e.target.value })
                            }
                            rows={3}
                            className="text-xs"
                          />
                        ) : (
                          <Input
                            value={selectedElement.content || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElement(selectedElement.id, { content: e.target.value })
                            }
                            className="text-xs"
                          />
                        )}
                      </div>
                    )}

                    {selectedElement.type === 'image' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">Image URL</Label>
                          <Input
                            value={selectedElement.content || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElement(selectedElement.id, { content: e.target.value })
                            }
                            placeholder="https://example.com/image.jpg"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Alt Text</Label>
                          <Input
                            value={selectedElement.properties?.alt || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElementProperty('alt', e.target.value)
                            }
                            placeholder="Image description"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Link URL (optional)</Label>
                          <Input
                            value={selectedElement.properties?.href || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElementProperty('href', e.target.value)
                            }
                            placeholder="https://example.com"
                            className="text-xs"
                          />
                        </div>
                      </>
                    )}

                    {selectedElement.type === 'button' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">Button URL</Label>
                          <Input
                            value={selectedElement.properties?.href || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElementProperty('href', e.target.value)
                            }
                            placeholder="https://example.com"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Target</Label>
                          {/* <Select 
                            value={selectedElement.properties?.target || '_blank'} 
                            onValueChange={(value: string) => updateElementProperty('target', value)}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_blank">New Window</SelectItem>
                              <SelectItem value="_self">Same Window</SelectItem>
                            </SelectContent>
                          </Select> */}
                           <select
                              value={selectedElement.properties?.target || '_blank'}
                              onChange={(event) =>  updateElementProperty('target', event.target.value)}
                              className={inputClass}
                            >
                              <option value="_blank">New Window</option>
                              <option value="_self">Same Window</option>
                           </select>
                        </div>
                      </>
                    )}

                    {selectedElement.type === 'spacer' && (
                      <div className="space-y-2">
                        <Label className="text-xs">Height</Label>
                        <Input
                          value={selectedElement.styles?.height || '20px'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateElementStyle('height', e.target.value)
                          }
                          placeholder="20px"
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Styling */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Styling</h3>
                  <div className="space-y-3">
                    {selectedElement.type !== 'spacer' && selectedElement.type !== 'divider' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">Text Align</Label>
                          {/* <Select 
                            value={selectedElement.styles?.textAlign || 'left'} 
                            onValueChange={(value: string) => updateElementStyle('textAlign', value)}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select> */}

                           <select
                              value={selectedElement.styles?.textAlign || 'left'}
                              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => updateElementStyle('textAlign', event.target.value)}
                              className={inputClass}
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                           </select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Size</Label>
                          <Input
                            value={selectedElement.styles?.fontSize || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElementStyle('fontSize', e.target.value)
                            }
                            placeholder="16px"
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedElement.styles?.color || '#333333'}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateElementStyle('color', e.target.value)
                              }
                              className="w-12 h-8 p-1"
                            />
                            <Input
                              value={selectedElement.styles?.color || '#333333'}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateElementStyle('color', e.target.value)
                              }
                              placeholder="#333333"
                              className="text-xs flex-1"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedElement.type === 'button' && (
                      <div className="space-y-2">
                        <Label className="text-xs">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedElement.styles?.backgroundColor || '#007bff'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElementStyle('backgroundColor', e.target.value)
                            }
                            className="w-12 h-8 p-1"
                          />
                          <Input
                            value={selectedElement.styles?.backgroundColor || '#007bff'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateElementStyle('backgroundColor', e.target.value)
                            }
                            placeholder="#007bff"
                            className="text-xs flex-1"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs">Padding</Label>
                      <Input
                        value={selectedElement.styles?.padding || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateElementStyle('padding', e.target.value)
                        }
                        placeholder="10px 20px"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Margin</Label>
                      <Input
                        value={selectedElement.styles?.margin || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateElementStyle('margin', e.target.value)
                        }
                        placeholder="10px 0"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Select an element to edit its properties
                </p>
              </div>
            )}
          </div>
        )}

        {/* {activeTab === 'template' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Template Settings</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Template Name</Label>
                  <Input
                    value={templateSettings.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      updateTemplateSettings({ name: e.target.value })
                    }
                    placeholder="Enter template name"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Email Subject</Label>
                  <Input
                    value={templateSettings.subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      updateTemplateSettings({ subject: e.target.value })
                    }
                    placeholder="Email subject line"
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {templateSettings.subject.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Template Type</Label>
                  <Select 
                    value={templateSettings.type} 
                    onValueChange={(value: string) => updateTemplateSettings({ type: value })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="automated">Automated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Preheader Text</Label>
                  <Textarea
                    value={templateSettings.preheader}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      updateTemplateSettings({ preheader: e.target.value })
                    }
                    placeholder="Preview text that appears after subject line"
                    rows={2}
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {templateSettings.preheader.length}/90 characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Global Styles</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Font Family</Label>
                  <Select value="arial" onValueChange={() => {}}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arial">Arial, sans-serif</SelectItem>
                      <SelectItem value="helvetica">Helvetica, sans-serif</SelectItem>
                      <SelectItem value="georgia">Georgia, serif</SelectItem>
                      <SelectItem value="times">Times New Roman, serif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      defaultValue="#007bff"
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      defaultValue="#007bff"
                      placeholder="#007bff"
                      className="text-xs flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      defaultValue="#ffffff"
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      defaultValue="#ffffff"
                      placeholder="#ffffff"
                      className="text-xs flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Content Width</Label>
                  <Select value="600" onValueChange={() => {}}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500px</SelectItem>
                      <SelectItem value="600">600px</SelectItem>
                      <SelectItem value="700">700px</SelectItem>
                      <SelectItem value="100%">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}
