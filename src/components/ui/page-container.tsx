interface PageContainerProps {
  children: React.ReactNode
  /** Override complet du className. Défaut : "max-w-5xl space-y-6" */
  className?: string
}

export function PageContainer({ children, className = 'max-w-5xl space-y-6' }: PageContainerProps) {
  return <div className={className}>{children}</div>
}
