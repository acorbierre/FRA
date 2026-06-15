import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

function ColorSwatch({ name, variable, hex }: { name: string; variable: string; hex: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-md border border-border shrink-0" style={{ background: hex }} />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{variable} · {hex}</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FraUiPage() {
  return (
    <PageContainer className="max-w-3xl space-y-10 pb-16">
      <PageHeader
        title="Composants UI"
        subtitle="Catalogue des éléments de base du design system FRA."
      />

      {/* Couleurs brand */}
      <Section title="Couleurs brand">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorSwatch name="Brand primaire"    variable="--fra-primary"       hex="#8231a8" />
          <ColorSwatch name="Brand hover"       variable="--fra-primary-hover" hex="#6e2990" />
          <ColorSwatch name="Primaire (shadcn)" variable="--color-primary"     hex="oklch(0.42 0.19 303)" />
        </div>
      </Section>

      {/* Typographie */}
      <Section title="Typographie">
        <div className="space-y-3">
          <div>
            <h1 className="page-title">Titre de page</h1>
            <code className="text-xs text-muted-foreground">.page-title</code>
          </div>
          <div>
            <p className="page-subtitle">Sous-titre ou compteur de résultats</p>
            <code className="text-xs text-muted-foreground">.page-subtitle</code>
          </div>
          <div>
            <a href="#" className="btn-primary inline-flex">Lien stylisé en bouton</a>
            <p className="text-xs text-muted-foreground mt-1">.btn-primary — pour les &lt;a&gt; qui imitent un bouton primaire</p>
          </div>
        </div>
      </Section>

      {/* PageHeader */}
      <Section title="PageHeader">
        <Card>
          <CardContent className="pt-5 space-y-2">
            <PageHeader title="Exemple de titre" subtitle="Avec un sous-titre optionnel" />
            <PageHeader title="Sans sous-titre" />
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          <code className="font-mono">{'<PageHeader title="..." subtitle="..." />'}</code> — props : <code className="font-mono">title</code> (required), <code className="font-mono">subtitle</code> (optional).
        </p>
      </Section>

      {/* PageContainer */}
      <Section title="PageContainer">
        <p className="text-sm text-muted-foreground">
          Wrapper de mise en page. Défaut : <code className="font-mono text-xs">max-w-5xl space-y-6</code>.
          Surcharger via <code className="font-mono text-xs">className</code> (ex : <code className="font-mono text-xs">max-w-2xl space-y-6</code> pour les pages détail,{' '}
          <code className="font-mono text-xs">max-w-5xl space-y-8</code> pour les dashboards).
        </p>
      </Section>

      {/* Buttons */}
      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button size="xs">XS</Button>
          <Button size="sm">SM</Button>
          <Button size="default">Default</Button>
          <Button size="lg">LG</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      {/* Badge */}
      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          {/* Statuts métier */}
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700">Soumise</span>
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700">En évaluation</span>
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-700">Retenue</span>
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground">Brouillon</span>
        </div>
      </Section>

      {/* Card */}
      <Section title="Card">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Titre de carte</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Contenu de la carte avec du texte secondaire.
            </CardContent>
          </Card>
          <Card className="shadow-none border border-border">
            <CardContent className="pt-4 space-y-2">
              <p className="text-2xl font-semibold">42</p>
              <p className="text-sm font-medium">KPI card</p>
              <p className="text-xs text-muted-foreground">Variante sans shadow</p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </PageContainer>
  )
}
