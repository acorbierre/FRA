import { sql } from '@/lib/db'

export type DbColumn = {
  name: string
  type: string
  nullable: boolean
  isPk: boolean
  isFk: boolean
}

export type DbTable = {
  name: string
  columns: DbColumn[]
}

export type DbRelation = {
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
}

export type DbSchema = {
  tables: DbTable[]
  relations: DbRelation[]
}

export async function getDbSchema(): Promise<DbSchema> {
  const [columnsRows, fkRows, pkRows] = await Promise.all([
    sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `,
    sql`
      SELECT
        kcu.table_name  AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name  AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    `,
    sql`
      SELECT kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    `,
  ])

  const pkSet = new Set(pkRows.map((r: Record<string, string>) => `${r.table_name}.${r.column_name}`))
  const fkSet = new Set(fkRows.map((r: Record<string, string>) => `${r.source_table}.${r.source_column}`))

  const tableMap = new Map<string, DbColumn[]>()
  for (const row of columnsRows as Record<string, string>[]) {
    if (!tableMap.has(row.table_name)) tableMap.set(row.table_name, [])
    tableMap.get(row.table_name)!.push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      isPk: pkSet.has(`${row.table_name}.${row.column_name}`),
      isFk: fkSet.has(`${row.table_name}.${row.column_name}`),
    })
  }

  const tables: DbTable[] = Array.from(tableMap.entries()).map(([name, columns]) => ({ name, columns }))
  const relations: DbRelation[] = (fkRows as Record<string, string>[]).map(r => ({
    sourceTable: r.source_table,
    sourceColumn: r.source_column,
    targetTable: r.target_table,
    targetColumn: r.target_column,
  }))

  return { tables, relations }
}
