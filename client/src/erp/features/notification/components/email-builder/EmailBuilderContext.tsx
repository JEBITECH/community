import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface EmailElement {
  id: string
  type: 'text' | 'heading' | 'image' | 'button' | 'divider' | 'spacer' | 'social' | 'footer'
  content?: string
  styles?: Record<string, string>
  properties?: Record<string, any>
  children?: EmailElement[]
}

export interface TemplateSettings {
  name: string
  subject: string
  type: string
  category: string
  preheader: string
}

interface HistoryEntry {
  elements: EmailElement[]
  timestamp: number
}

interface HistoryState {
  past: HistoryEntry[]
  present: EmailElement[]
  future: HistoryEntry[]
}

const MAX_HISTORY = 50

interface EmailBuilderContextType {
  elements: EmailElement[]
  selectedElement: EmailElement | null
  addElement: (element: EmailElement) => void
  updateElement: (id: string, updates: Partial<EmailElement>) => void
  deleteElement: (id: string) => void
  selectElement: (element: EmailElement | null) => void
  insertElementAt: (element: EmailElement, index: number) => void
  insertElementsAt: (elements: EmailElement[], index: number) => void
  moveElement: (fromIndex: number, toIndex: number) => void
  setAllElements: (elements: EmailElement[]) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  templateSettings: TemplateSettings
  updateTemplateSettings: (settings: Partial<TemplateSettings>) => void
  previewMode: 'desktop' | 'mobile'
  setPreviewMode: (mode: 'desktop' | 'mobile') => void
}

const EmailBuilderContext = createContext<EmailBuilderContextType | undefined>(undefined)

export function EmailBuilderProvider({ children }: { children: ReactNode }) {
  const [historyState, setHistoryState] = useState<HistoryState>({
    past: [],
    present: [],
    future: [],
  })
  const [selectedElement, setSelectedElement] = useState<EmailElement | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>({
    name: '',
    subject: '',
    type: 'newsletter',
    category: 'marketing',
    preheader: '',
  })

  const elements = historyState.present
  const canUndo = historyState.past.length > 0
  const canRedo = historyState.future.length > 0

  const addElement = useCallback((element: EmailElement) => {
    setHistoryState((prev) => {
      const newPast = [
        ...prev.past,
        { elements: structuredClone(prev.present), timestamp: Date.now() },
      ]
      if (newPast.length > MAX_HISTORY) {
        newPast.splice(0, newPast.length - MAX_HISTORY)
      }
      return {
        past: newPast,
        present: [...prev.present, element],
        future: [],
      }
    })
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<EmailElement>) => {
    setHistoryState((prev) => {
      const newPast = [
        ...prev.past,
        { elements: structuredClone(prev.present), timestamp: Date.now() },
      ]
      if (newPast.length > MAX_HISTORY) {
        newPast.splice(0, newPast.length - MAX_HISTORY)
      }
      return {
        past: newPast,
        present: prev.present.map((el) => (el.id === id ? { ...el, ...updates } : el)),
        future: [],
      }
    })
    setSelectedElement((prev) => (prev?.id === id ? { ...prev, ...updates } : prev))
  }, [])

  const deleteElement = useCallback((id: string) => {
    setHistoryState((prev) => {
      const newPast = [
        ...prev.past,
        { elements: structuredClone(prev.present), timestamp: Date.now() },
      ]
      if (newPast.length > MAX_HISTORY) {
        newPast.splice(0, newPast.length - MAX_HISTORY)
      }
      return {
        past: newPast,
        present: prev.present.filter((el) => el.id !== id),
        future: [],
      }
    })
    setSelectedElement((prev) => (prev?.id === id ? null : prev))
  }, [])

  const insertElementAt = useCallback((element: EmailElement, index: number) => {
    setHistoryState((prev) => {
      const clampedIndex = Math.max(0, Math.min(index, prev.present.length))
      const newPast = [
        ...prev.past,
        { elements: structuredClone(prev.present), timestamp: Date.now() },
      ]
      if (newPast.length > MAX_HISTORY) {
        newPast.splice(0, newPast.length - MAX_HISTORY)
      }
      const newPresent = [...prev.present]
      newPresent.splice(clampedIndex, 0, element)
      return {
        past: newPast,
        present: newPresent,
        future: [],
      }
    })
  }, [])

  const insertElementsAt = useCallback((newElements: EmailElement[], index: number) => {
    setHistoryState((prev) => {
      const clampedIndex = Math.max(0, Math.min(index, prev.present.length))
      const newPast = [
        ...prev.past,
        { elements: structuredClone(prev.present), timestamp: Date.now() },
      ]
      if (newPast.length > MAX_HISTORY) {
        newPast.splice(0, newPast.length - MAX_HISTORY)
      }
      const newPresent = [...prev.present]
      newPresent.splice(clampedIndex, 0, ...newElements)
      return {
        past: newPast,
        present: newPresent,
        future: [],
      }
    })
  }, [])

  const moveElement = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setHistoryState((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.present.length) return prev
      if (toIndex < 0 || toIndex >= prev.present.length) return prev

      const newPast = [
        ...prev.past,
        { elements: structuredClone(prev.present), timestamp: Date.now() },
      ]
      if (newPast.length > MAX_HISTORY) {
        newPast.splice(0, newPast.length - MAX_HISTORY)
      }
      const newPresent = [...prev.present]
      const [moved] = newPresent.splice(fromIndex, 1)
      newPresent.splice(toIndex, 0, moved)
      return {
        past: newPast,
        present: newPresent,
        future: [],
      }
    })
  }, [])

  const setAllElements = useCallback((newElements: EmailElement[]) => {
    setHistoryState((prev) => {
      const newPast = [
        ...prev.past,
        { elements: structuredClone(prev.present), timestamp: Date.now() },
      ]
      if (newPast.length > MAX_HISTORY) {
        newPast.splice(0, newPast.length - MAX_HISTORY)
      }
      return {
        past: newPast,
        present: newElements,
        future: [],
      }
    })
  }, [])

  const undo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.past.length === 0) return prev
      const newPast = [...prev.past]
      const previousEntry = newPast.pop()!
      return {
        past: newPast,
        present: previousEntry.elements,
        future: [
          { elements: structuredClone(prev.present), timestamp: Date.now() },
          ...prev.future,
        ],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.future.length === 0) return prev
      const newFuture = [...prev.future]
      const nextEntry = newFuture.shift()!
      return {
        past: [
          ...prev.past,
          { elements: structuredClone(prev.present), timestamp: Date.now() },
        ],
        present: nextEntry.elements,
        future: newFuture,
      }
    })
  }, [])

  const selectElement = useCallback((element: EmailElement | null) => {
    setSelectedElement(element)
  }, [])

  const updateTemplateSettings = useCallback((settings: Partial<TemplateSettings>) => {
    setTemplateSettings((prev) => ({ ...prev, ...settings }))
  }, [])

  return (
    <EmailBuilderContext.Provider
      value={{
        elements,
        selectedElement,
        addElement,
        updateElement,
        deleteElement,
        selectElement,
        insertElementAt,
        insertElementsAt,
        moveElement,
        setAllElements,
        undo,
        redo,
        canUndo,
        canRedo,
        templateSettings,
        updateTemplateSettings,
        previewMode,
        setPreviewMode,
      }}
    >
      {children}
    </EmailBuilderContext.Provider>
  )
}

export function useEmailBuilder() {
  const context = useContext(EmailBuilderContext)
  if (!context) {
    throw new Error('useEmailBuilder must be used within EmailBuilderProvider')
  }
  return context
}
