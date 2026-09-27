'use client';

import { BarChart3, Database, Zap, TrendingDown, Brain, AlertTriangle, PieChart, Eye, Settings, LogOut, User, Lightbulb, Sparkles, Rocket, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: null },
  { id: 'models', label: 'Models', icon: Database, badge: null },
  { id: 'upload', label: 'Upload', icon: Rocket, badge: null },
  
  { divider: true, label: 'MONITORING' },
  
  { id: 'data-quality', label: 'Data Quality', icon: Eye, badge: null },
  { id: 'drift-detection', label: 'Data Drift', icon: TrendingDown, badge: null },
  { id: 'concept-drift', label: 'Concept Drift', icon: Zap, badge: null },
  { id: 'explainability', label: 'Explainability', icon: Brain, badge: null },
  { id: 'bias', label: 'Bias & Fairness', icon: PieChart, badge: null },
  
  { divider: true, label: 'ADVANCED AI' },
  
  { id: 'auto-insights', label: 'Auto Insights', icon: Lightbulb, badge: 'AI' },
  { id: 'decision-engine', label: 'Decision Engine', icon: LineChart, badge: 'Auto' },
  { id: 'auto-dashboard', label: 'Auto Dashboard', icon: Sparkles, badge: 'Gen' },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: null },
  { id: 'business-impact', label: 'Business Impact', icon: BarChart3, badge: null },
];

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('access_token');
      router.push('/login');
    }, 300);
  };

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          ObserveAI
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">ML Observability Platform</p>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-sidebar-accent/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Welcome</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">ML Observe Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item, idx) => {
          if ('divider' in item) {
            return (
              <div key={idx} className="pt-4 pb-2">
                <p className="text-xs font-semibold text-sidebar-foreground/50 tracking-wider">
                  {item.label}
                </p>
              </div>
            );
          }
          
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              variant="ghost"
              className={`w-full justify-start px-4 py-2 h-10 transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:shadow-sm'
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  item.badge === 'AI' ? 'bg-yellow-500/20 text-yellow-400' :
                  item.badge === 'Auto' ? 'bg-indigo-500/20 text-indigo-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer with Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start px-4 py-2 h-10 text-sidebar-foreground hover:bg-sidebar-accent/10"
        >
          <Settings className="w-4 h-4 mr-3" />
          <span className="text-sm">Settings</span>
        </Button>
        
        <Button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="ghost"
          className="w-full justify-start px-4 py-2 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {isLoggingOut ? (
            <>
              <div className="w-4 h-4 mr-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4 mr-3" />
              <span className="text-sm">Logout</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}