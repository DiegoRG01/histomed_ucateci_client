import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { RoleGuard } from "@/app/routes/RoleGuard";
import { AppLayout } from "@/app/layout/AppLayout";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { TipoMedicamentoListPage } from "@/features/catalogos/components/TipoMedicamentoListPage";
import { UsuarioListPage } from "@/features/usuarios/components/UsuarioListPage";
import { MedicamentoListPage } from "@/features/inventario/components/MedicamentoListPage";
import { LoteInventarioListPage } from "@/features/inventario/components/LoteInventarioListPage";
import { MovimientoInventarioListPage } from "@/features/inventario/components/MovimientoInventarioListPage";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<PlaceholderPage title="Dashboard" />} />
        <Route
          path="/estudiantes"
          element={<PlaceholderPage title="Estudiantes" />}
        />
        <Route
          path="/visitas"
          element={<PlaceholderPage title="Visitas" />}
        />
        <Route
          path="/donaciones"
          element={<PlaceholderPage title="Donaciones" />}
        />
        <Route
          path="/requisiciones"
          element={<PlaceholderPage title="Requisiciones" />}
        />
        <Route
          path="/reportes"
          element={<PlaceholderPage title="Reportes" />}
        />
        <Route
          path="/auditoria"
          element={<PlaceholderPage title="Auditoría" />}
        />
        <Route
          path="/catalogos/tipos-medicamento"
          element={
            <RoleGuard allow={["ADMIN", "ALMACEN"]}>
              <TipoMedicamentoListPage />
            </RoleGuard>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RoleGuard allow={["ADMIN"]}>
              <UsuarioListPage />
            </RoleGuard>
          }
        />
        <Route
          path="/inventario/medicamentos"
          element={
            <RoleGuard allow={["ADMIN", "ALMACEN"]}>
              <MedicamentoListPage />
            </RoleGuard>
          }
        />
        <Route
          path="/inventario/lotes"
          element={
            <RoleGuard allow={["ADMIN", "ALMACEN"]}>
              <LoteInventarioListPage />
            </RoleGuard>
          }
        />
        <Route
          path="/inventario/movimientos"
          element={
            <RoleGuard allow={["ADMIN", "ALMACEN"]}>
              <MovimientoInventarioListPage />
            </RoleGuard>
          }
        />
      </Route>
    </Routes>
  );
}
