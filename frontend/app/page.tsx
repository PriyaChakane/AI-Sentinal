'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Dashboard } from '@/components/dashboard';
import { ModelManagement } from '@/components/model-management';
import { DataQuality } from '@/components/data-quality';
import { DriftDetection } from '@/components/drift-detection';
import { ConceptDrift } from '@/components/concept-drift';
import { ExplainabilityEngine } from '@/components/explainability-engine';
import { BiasMonitoring } from '@/components/bias-monitoring';
import { AlertSystem } from '@/components/alert-system';
import { BusinessImpact } from '@/components/business-impact';
import { useRouter } from 'next/navigation';
import { AutoInsights } from '@/components/auto-insights';
import { DecisionEngine } from '@/components/decision-engine';
import { AutoDashboard } from '@/components/auto-dashboard';

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const renderSection = () => {
    switch (activeSection) {
      // Core Features
      case 'dashboard': return <Dashboard />;
      case 'models': return <ModelManagement />;
      case 'data-quality': return <DataQuality />;
      case 'drift-detection': return <DriftDetection />;
      case 'concept-drift': return <ConceptDrift />;
      case 'explainability': return <ExplainabilityEngine />;
      case 'bias': return <BiasMonitoring />;
      case 'alerts': return <AlertSystem />;
      case 'business-impact': return <BusinessImpact />;
      
      // Advanced AI Features
      case 'auto-insights': return <AutoInsights />;
      case 'decision-engine': return <DecisionEngine />;
      case 'auto-dashboard': return <AutoDashboard />;
      
      // Upload Section
      case 'upload': return <ModelManagement />; // Or create a separate Upload component
      
      // Settings
      case 'settings': return <div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground mt-2">Settings page coming soon...</p></div>;
      case 'performance': return <div className="p-8"><h1 className="text-2xl font-bold">Performance Analytics</h1><p className="text-muted-foreground mt-2">Performance metrics coming soon...</p></div>;
      
      default: return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-1 overflow-auto">
        {renderSection()}
      </main>
    </div>
  );
}