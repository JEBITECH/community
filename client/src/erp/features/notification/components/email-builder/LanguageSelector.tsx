import { useState } from 'react'
import { Globe, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' },
  { code: 'ru', label: 'Русский' },
] as const

export interface LanguageSelectorProps {
  activeLocale: string | null
  availableLocales: string[]
  onLocaleSelect: (locale: string | null) => void
  onAddTranslation: (locale: string) => void
  onDeleteTranslation?: (locale: string) => void
  disabled?: boolean
}

export function LanguageSelector({
  activeLocale,
  availableLocales,
  onLocaleSelect,
  onAddTranslation,
  onDeleteTranslation,
  disabled,
}: LanguageSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedNewLocale, setSelectedNewLocale] = useState('')

  const unusedLocales = SUPPORTED_LOCALES.filter(
    (l) => !availableLocales.includes(l.code)
  )

  const handleAddTranslation = () => {
    if (selectedNewLocale) {
      onAddTranslation(selectedNewLocale)
      setShowAddDialog(false)
      setSelectedNewLocale('')
    }
  }

  const getLocaleLabel = (code: string) => {
    return SUPPORTED_LOCALES.find((l) => l.code === code)?.label || code
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-1">
          {/* Base template tab */}
          <Badge
            variant={activeLocale === null ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() => !disabled && onLocaleSelect(null)}
          >
            Base
          </Badge>

          {/* Translation locale tabs */}
          {availableLocales.map((locale) => (
            <div key={locale} className="flex items-center group">
              <Badge
                variant={activeLocale === locale ? 'default' : 'outline'}
                className="cursor-pointer select-none uppercase"
                onClick={() => !disabled && onLocaleSelect(locale)}
              >
                {locale}
                {onDeleteTranslation && activeLocale === locale && (
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteTranslation(locale)
                    }}
                    title={`Remove ${getLocaleLabel(locale)} translation`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            </div>
          ))}

          {/* Add translation button */}
          {unusedLocales.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowAddDialog(true)}
              disabled={disabled}
              title="Add translation"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Add Translation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Translation</DialogTitle>
            <DialogDescription>
              Select a language to add a new translation for this template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedNewLocale} onValueChange={setSelectedNewLocale}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language..." />
              </SelectTrigger>
              <SelectContent>
                {unusedLocales.map((locale) => (
                  <SelectItem key={locale.code} value={locale.code}>
                    {locale.label} ({locale.code.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTranslation} disabled={!selectedNewLocale}>
              Add Translation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
