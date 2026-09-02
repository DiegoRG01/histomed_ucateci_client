import { Navigate, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { RoleGuard } from "@/app/routes/RoleGuard";
import { AppLayout } from "@/app/layout/AppLayout";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { TipoMedicamentoListPage } from "@/features/catalogos/components/TipoMedicamentoListPage";
import { UnidadMedidaListPage } from "@/features/catalogos/components/UnidadMedidaListPage";
import { UsuarioListPage } from "@/features/usuarios/components/UsuarioListPage";
import { MedicamentoListPage } from "@/features/inventario/components/MedicamentoListPage";
import { LoteInventarioListPage } from "@/features/inventario/components/LoteInventarioListPage";
import { MovimientoInventarioListPage } from "@/features/inventario/components/MovimientoInventarioListPage";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { EstudianteFichaPage } from "@/features/estudiantes/components/EstudianteFichaPage";
import { EstudianteFormPage } from "@/features/estudiantes/components/EstudianteFormPage";
import { EstudianteListPage } from "@/features/estudiantes/components/EstudianteListPage";

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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA", "ALMACEN", "CONSULTA"]}>
              <DashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/estudiantes"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA", "CONSULTA"]}>
              <EstudianteListPage />
            </RoleGuard>
          }
        />
        <Route
          path="/estudiantes/nuevo"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA"]}>
              <EstudianteFormPage />
            </RoleGuard>
          }
        />
        <Route
          path="/estudiantes/:id"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA", "CONSULTA"]}>
              <EstudianteFichaPage />
            </RoleGuard>
          }
        />
        <Route
          path="/estudiantes/:id/editar"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA"]}>
              <EstudianteFormPage />
            </RoleGuard>
          }
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
          path="/catalogos/unidades-medida"
          element={
            <RoleGuard allow={["ADMIN", "ALMACEN"]}>
              <UnidadMedidaListPage />
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
