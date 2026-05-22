export default function CarteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
