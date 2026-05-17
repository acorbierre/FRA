import { getDbSchema } from '@/services/neon/db-schema'
import SchemaPanel from '../admin/schema-panel'
import Link from 'next/link'
import { ExternalLink, ArrowLeft } from 'lucide-react'

export default async function SchemaPage() {
  const schema = await getDbSchema()

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 104px)' }}>
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/gestion/admin"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Admin
          </Link>
          <div>
            <h1 className="page-title">Schéma de données</h1>
            <p className="page-subtitle">{schema.tables.length} tables · {schema.relations.length} relations</p>
          </div>
        </div>
        <a
          href="https://console.neon.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
        >
          <ExternalLink className="size-3.5" />
          Ouvrir dans Neon
        </a>
      </div>

      <div className="flex-1 min-h-0">
        <SchemaPanel schema={schema} fullHeight />
      </div>
    </div>
  )
}
