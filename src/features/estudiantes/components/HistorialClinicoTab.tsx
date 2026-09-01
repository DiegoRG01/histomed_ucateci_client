import { AlergiasSection } from './AlergiasSection'
import { CondicionesSection } from './CondicionesSection'
import { EnfermedadesSection } from './EnfermedadesSection'
import { MedicamentosHabitualesSection } from './MedicamentosHabitualesSection'

type HistorialClinicoTabProps = { estudianteId: number }

export function HistorialClinicoTab({ estudianteId }: HistorialClinicoTabProps) {
  return (
    <div className="space-y-6">
      <AlergiasSection estudianteId={estudianteId} />
      <CondicionesSection estudianteId={estudianteId} />
      <EnfermedadesSection estudianteId={estudianteId} />
      <MedicamentosHabitualesSection estudianteId={estudianteId} />
    </div>
  )
}
