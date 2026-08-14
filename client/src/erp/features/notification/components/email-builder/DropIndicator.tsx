interface DropIndicatorProps {
  isVisible: boolean
}

export function DropIndicator({ isVisible }: DropIndicatorProps) {
  if (!isVisible) {
    return null
  }

  return (
    <div
      className="w-full h-0.5 bg-primary rounded-full transition-opacity duration-150 ease-in-out"
      aria-hidden="true"
    />
  )
}
