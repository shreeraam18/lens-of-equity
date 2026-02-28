import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, GitBranch, Shield,
  Lightbulb, FileText, Clock, Upload, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatAssistant } from '@/components/ChatAssistant';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/distribution', label: 'Distribution', icon: BarChart3 },
  { to: '/correlation', label: 'Correlation & Proxy', icon: GitBranch },
  { to: '/fairness', label: 'Fairness Metrics', icon: Shield },
  { to: '/mitigation', label: 'Mitigation', icon: Lightbulb },
  { to: '/report', label: 'Audit Report', icon: FileText },
  { to: '/history', label: 'History', icon: Clock },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div
          className="h-16 flex items-center gap-2 px-6 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Eye className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-foreground">BiasLens</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            New Dataset
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      <ChatAssistant />
    </div>
  );
}
