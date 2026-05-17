'use client'

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { DbSchema, DbColumn } from '@/services/neon/db-schema'

// ─── Couleurs par domaine ────────────────────────────────────────────────────

const TABLE_COLORS: Record<string, { bg: string; header: string; text: string }> = {
  utilisateurs:     { bg: '#eff6ff', header: '#2563eb', text: '#1e40af' },
  laboratoires:     { bg: '#eff6ff', header: '#3b82f6', text: '#1e40af' },
  appels_a_projets: { bg: '#f8fafc', header: '#64748b', text: '#334155' },
  candidatures:     { bg: '#fefce8', header: '#ca8a04', text: '#854d0e' },
  evaluations:      { bg: '#fff7ed', header: '#ea580c', text: '#9a3412' },
  projets:          { bg: '#f0fdf4', header: '#16a34a', text: '#166534' },
  conventions:      { bg: '#f0fdf4', header: '#15803d', text: '#166534' },
  versements:       { bg: '#f0fdf4', header: '#059669', text: '#065f46' },
  rapports:         { bg: '#faf5ff', header: '#9333ea', text: '#6b21a8' },
  jalons:           { bg: '#f8fafc', header: '#475569', text: '#334155' },
  settings:         { bg: '#f8fafc', header: '#94a3b8', text: '#64748b' },
}

const DEFAULT_COLOR = { bg: '#f8fafc', header: '#64748b', text: '#334155' }

// ─── Layout initial par table ────────────────────────────────────────────────

// Layout left-to-right suivant le séquencement temporel du parcours
// Col 0 : acteurs (laboratoires, utilisateurs)
// Col 1 : appels_a_projets
// Col 2 : candidatures
// Col 3 : evaluations
// Col 4 : projets
// Col 5 : conventions + jalons
// Col 6 : versements + rapports
// Col 7 : settings (isolé, pas de relations)
const TABLE_POSITIONS: Record<string, { x: number; y: number }> = {
  laboratoires:     { x: 0,    y: 0   },
  utilisateurs:     { x: 0,    y: 380 },
  appels_a_projets: { x: 360,  y: 180 },
  candidatures:     { x: 720,  y: 0   },
  evaluations:      { x: 1080, y: 0   },
  projets:          { x: 1440, y: 0   },
  conventions:      { x: 1800, y: 0   },
  jalons:           { x: 1800, y: 380 },
  versements:       { x: 2160, y: 0   },
  rapports:         { x: 2160, y: 380 },
  settings:         { x: 2520, y: 0   },
}

// ─── Nœud custom ─────────────────────────────────────────────────────────────

function TableNode({ data }: { data: { name: string; columns: DbColumn[] } }) {
  const color = TABLE_COLORS[data.name] ?? DEFAULT_COLOR

  return (
    <div
      style={{
        background: color.bg,
        border: `1.5px solid ${color.header}`,
        borderRadius: 10,
        minWidth: 220,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        fontSize: 12,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {/* Header */}
      <div
        style={{
          background: color.header,
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '8px 8px 0 0',
          fontWeight: 700,
          letterSpacing: '0.02em',
          fontSize: 13,
        }}
      >
        {data.name}
      </div>

      {/* Colonnes */}
      <div style={{ padding: '4px 0' }}>
        {data.columns.map(col => (
          <div
            key={col.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 12px',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              color: color.text,
            }}
          >
            {col.isPk && (
              <span style={{ fontSize: 10, background: color.header, color: '#fff', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>PK</span>
            )}
            {col.isFk && !col.isPk && (
              <span style={{ fontSize: 10, background: color.bg, color: color.header, borderRadius: 3, padding: '1px 4px', fontWeight: 700, border: `1px solid ${color.header}` }}>FK</span>
            )}
            {!col.isPk && !col.isFk && (
              <span style={{ width: 24 }} />
            )}
            <span style={{ flex: 1, fontWeight: col.isPk ? 700 : 400 }}>{col.name}</span>
            <span style={{ opacity: 0.5, fontSize: 10 }}>{col.type.replace('character varying', 'varchar').replace('timestamp with time zone', 'timestamptz')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = { table: TableNode }

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function SchemaPanel({ schema, fullHeight }: { schema: DbSchema; fullHeight?: boolean }) {
  const nodes: Node[] = schema.tables.map(table => ({
    id: table.name,
    type: 'table',
    position: TABLE_POSITIONS[table.name] ?? { x: 900, y: 400 },
    data: { name: table.name, columns: table.columns },
  }))

  const edges: Edge[] = schema.relations.map((rel, i) => ({
    id: `edge-${i}`,
    source: rel.sourceTable,
    target: rel.targetTable,
    label: rel.sourceColumn,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: '#64748b' },
    labelBgStyle: { fill: '#f8fafc' },
  }))

  return (
    <div style={{ height: fullHeight ? '100%' : 680, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={node => TABLE_COLORS[node.id]?.header ?? '#94a3b8'}
          maskColor="rgba(248,250,252,0.7)"
        />
      </ReactFlow>
    </div>
  )
}
