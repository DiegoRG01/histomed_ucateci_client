import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"

type PlaceholderPageProps = {
  title: string
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} />
      <Card>
        <CardContent className="flex items-center justify-center bg-muted/50 py-16 text-sm text-muted-foreground">
          Módulo en construcción
        </CardContent>
      </Card>
    </div>
  )
}

export { PlaceholderPage }
export type { PlaceholderPageProps }
