import { ReactNode } from 'react';
import BottomNavigation from '@/components/bottom-navigation';
import { Header } from '@/components/layouts/Header';
import { useAuth } from '@/hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pb-16">
        {children}
      </main>
      <BottomNavigation userRole={user?.role} />
    </div>
  );
}