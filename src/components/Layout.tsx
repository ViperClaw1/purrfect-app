import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Heart, User, Cat, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Search, path: '/explore', label: 'Explore' },
  { icon: PlusSquare, path: '/create', label: 'Create' },
  { icon: Heart, path: '/activity', label: 'Activity' },
  { icon: User, path: '/profile', label: 'Profile' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full gradient-coral flex items-center justify-center shadow-sm">
              <Cat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-gradient">Purrfect</span>
          </Link>

          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200',
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className={cn(
                    'w-6 h-6 transition-transform',
                    isActive && 'scale-110'
                  )} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
