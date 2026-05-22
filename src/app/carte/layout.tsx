export default function CarteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <div className="fixed inset-0 bg-white z-[100] pointer-events-none" style={{ animation: 'sweepup 1s cubic-bezier(0.76, 0, 0.24, 1) 0.4s forwards' }} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
