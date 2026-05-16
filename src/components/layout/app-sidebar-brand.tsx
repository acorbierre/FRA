import { Microscope } from 'lucide-react'

export default function AppSidebarBrand() {
  return (
    <div className="h-16 px-6 border-b border-border flex items-center gap-2.5 shrink-0">
      <div className="size-[30px] rounded-full bg-primary flex items-center justify-center shrink-0">
        <Microscope className="size-3.5 text-primary-foreground" />
      </div>
      <span className="font-heading font-semibold text-primary tracking-wider uppercase text-xs">FRA</span>
    </div>
  )
}
