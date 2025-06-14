import { Link, useLocation } from "wouter";
import {
  Home,
  ListOrdered,
  Package,
  DollarSign,
  BarChart3,
  Users
} from "lucide-react";
import type { AppRole } from "@/types";

interface BottomNavigationProps {
  userRole?: AppRole;
}

export default function BottomNavigation({ userRole }: BottomNavigationProps) {
  const [location] = useLocation();

  const items = [
    { href: "/dashboard", icon: Home, label: "Início", roles: ['admin_empresa', 'caixa', 'garcom'] as AppRole[] },
    { href: "/comandas", icon: ListOrdered, label: "Comandas", roles: ['admin_empresa', 'caixa', 'garcom'] as AppRole[] },
    { href: "/produtos", icon: Package, label: "Produtos", roles: ['admin_empresa'] as AppRole[] },
    { href: "/caixa", icon: DollarSign, label: "Caixa", roles: ['admin_empresa', 'caixa'] as AppRole[] },
    { href: "/relatorios", icon: BarChart3, label: "Relatórios", roles: ['admin_empresa'] as AppRole[] },
  ];
  
  // Adicionar item de usuários para admin_empresa
  const allItems = [
    ...items,
    {
      href: '/usuarios',
      label: 'Usuários',
      icon: Users,
      roles: ['admin_empresa' as const]
    }
  ];

  const accessibleItems = allItems.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-[calc(4rem+env(safe-area-inset-bottom))] bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="h-16 w-full">
        <div className="flex items-center justify-center h-full font-medium px-2">
          {accessibleItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <a className={`inline-flex flex-col items-center justify-center px-3 py-2 h-full transition-colors flex-shrink-0 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
                <item.icon className="w-5 h-5 mb-0.5" />
                <span className="text-xs leading-tight whitespace-nowrap">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}