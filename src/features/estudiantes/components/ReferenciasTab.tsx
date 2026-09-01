import { ContactosSection } from './ContactosSection'
import { MedicoReferenciaSection } from './MedicoReferenciaSection'

type ReferenciasTabProps = { estudianteId: number }

export function ReferenciasTab({ estudianteId }: ReferenciasTabProps) {
  return (
    <div className="space-y-6">
      <MedicoReferenciaSection estudianteId={estudianteId} />
      <ContactosSection estudianteId={estudianteId} />
    </div>
  )
}
