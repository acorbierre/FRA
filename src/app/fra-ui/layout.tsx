export default function FraUiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-10 py-10">
      {children}
    </div>
  )
}
