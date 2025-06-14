import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { ProtectedRoute } from "./ProtectedRoute";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppRole } from "@/types";

import LoginPage from "@/domains/auth/pages/LoginPage";
import DashboardPage from "@/domains/dashboard/pages/DashboardPage";
import AdminDashboardPage from "@/domains/admin/pages/AdminDashboardPage";
import ProdutosPage from "@/domains/produtos/pages/ProdutosPage";
import UsuariosPage from "@/domains/usuarios/pages/UsuariosPage";
import CaixaPage from "@/domains/caixa/pages/CaixaPage";
import ComandasPage from "@/domains/comandas/pages/ComandasPage";
import CashFlowPage from "@/domains/cash-flow/pages/CashFlowPage";
import RelatoriosPage from "@/domains/relatorios/pages/RelatoriosPage";
import { AdminLayout } from "@/components/layouts/AdminLayout";

const ROLES_ADMIN_GLOBAL: AppRole[] = ['admin_global'];
const ROLES_ADMIN_EMPRESA: AppRole[] = ['admin_empresa'];
const ROLES_CAIXA_E_ADMIN: AppRole[] = ['admin_empresa', 'caixa'];
const ROLES_TODOS_DA_EMPRESA: AppRole[] = ['admin_empresa', 'caixa', 'garcom'];

function Routes() {
  return (
    <Switch>
      <Route path="/login">
        <LoginPage />
      </Route>

      {/* --- Rotas Protegidas --- */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={ROLES_TODOS_DA_EMPRESA}>
          <MainLayout>
            <ErrorBoundary><DashboardPage /></ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={ROLES_ADMIN_GLOBAL}>
          <AdminLayout>
            <ErrorBoundary><AdminDashboardPage /></ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/comandas">
        <ProtectedRoute allowedRoles={ROLES_TODOS_DA_EMPRESA}>
          <MainLayout>
            <ErrorBoundary><ComandasPage /></ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/comandas/:comandaId">
        <ProtectedRoute allowedRoles={ROLES_TODOS_DA_EMPRESA}>
          <MainLayout>
            <ErrorBoundary>
              <React.Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('@/domains/comandas/pages/comanda-details-page')))}
              </React.Suspense>
            </ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/produtos">
        <ProtectedRoute allowedRoles={ROLES_ADMIN_EMPRESA}>
          <MainLayout>
            <ErrorBoundary><ProdutosPage /></ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/usuarios">
        <ProtectedRoute allowedRoles={ROLES_ADMIN_EMPRESA}>
          <MainLayout>
            <ErrorBoundary><UsuariosPage /></ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/empresa/:empresaId/usuarios">
        <ProtectedRoute allowedRoles={ROLES_ADMIN_GLOBAL}>
          <AdminLayout>
            <ErrorBoundary><UsuariosPage /></ErrorBoundary>
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/caixa">
        <ProtectedRoute allowedRoles={ROLES_CAIXA_E_ADMIN}>
          <MainLayout>
            <ErrorBoundary><CaixaPage /></ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/fluxo-caixa">
        <ProtectedRoute allowedRoles={ROLES_ADMIN_EMPRESA}>
          <MainLayout>
            <ErrorBoundary><CashFlowPage /></ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/relatorios">
        <ProtectedRoute allowedRoles={ROLES_ADMIN_EMPRESA}>
          <MainLayout>
            <ErrorBoundary><RelatoriosPage /></ErrorBoundary>
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route>
        <Redirect to="/dashboard" />
      </Route>
    </Switch>
  );
}

export default Routes;
