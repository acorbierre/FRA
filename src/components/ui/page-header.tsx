interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  )
}
