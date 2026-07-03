export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(108,92,231,0.3)', borderTopColor: 'var(--purple)' }} />
    </div>
  )
}
