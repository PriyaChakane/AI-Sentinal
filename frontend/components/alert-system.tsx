'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Bell, CheckCircle2, Clock, TrendingDown, Zap, RefreshCw, Shield, Database, Brain, Activity, Loader2 } from 'lucide-react';

// API base URL for deployment
const API_BASE_URL = '/api';

interface Alert {
  id: number;
  type: string;
  description: string;
  severity: string;
  timestamp: string;
  status: string;
  feature: string;
  actions: string[];
}

interface AlertStats {
  active_alerts: number;
  critical: number;
  warnings: number;
  info: number;
}

export function AlertSystem() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const getToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Uses the deployment-safe API base URL
      const res = await fetch(`${API_BASE_URL}/alerts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setStats(data.stats);
      } else if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'concept_drift': return <TrendingDown className="w-4 h-4" />;
      case 'data_drift': return <Activity className="w-4 h-4" />;
      case 'fairness': return <Shield className="w-4 h-4" />;
      case 'quality': return <Database className="w-4 h-4" />;
      case 'explainability': return <Brain className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getFeatureBadgeColor = (feature: string) => {
    switch (feature) {
      case 'concept_drift': return 'bg-purple-500/20 text-purple-400';
      case 'data_drift': return 'bg-cyan-500/20 text-cyan-400';
      case 'fairness': return 'bg-pink-500/20 text-pink-400';
      case 'quality': return 'bg-green-500/20 text-green-400';
      case 'explainability': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Alert System</h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring alerts from all ML observability features
          </p>
        </div>
        <Button onClick={fetchAlerts} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Alerts</p>
            <p className="text-3xl font-bold mt-2 text-red-400">{stats?.active_alerts || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Critical</p>
            <p className="text-3xl font-bold mt-2 text-red-400">{stats?.critical || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="text-3xl font-bold mt-2 text-yellow-400">{stats?.warnings || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Info</p>
            <p className="text-3xl font-bold mt-2 text-blue-400">{stats?.info || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          All Alerts ({alerts.length})
        </Button>
        <Button variant={filter === 'critical' ? 'destructive' : 'outline'} size="sm" onClick={() => setFilter('critical')}>
          Critical ({alerts.filter(a => a.severity === 'critical').length})
        </Button>
        <Button variant={filter === 'warning' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('warning')}>
          Warnings ({alerts.filter(a => a.severity === 'warning').length})
        </Button>
        <Button variant={filter === 'info' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('info')}>
          Info ({alerts.filter(a => a.severity === 'info').length})
        </Button>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground">All systems are operating normally</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border flex items-start justify-between transition-all hover:shadow-lg ${getSeverityColor(alert.severity)}`}>
              <div className="flex gap-4 flex-1">
                <div className="flex-shrink-0 mt-1">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground">{alert.type}</h3>
                        <Badge className={getFeatureBadgeColor(alert.feature)}>
                          {getFeatureIcon(alert.feature)}
                          <span className="ml-1">{alert.feature.replace('_', ' ').toUpperCase()}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" /> {alert.timestamp}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getSeverityBadgeColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {alert.actions.map((action) => (
                      <Button key={action} variant="outline" size="sm" className="text-xs h-7">{action}</Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
            <CardDescription>System-suggested interventions based on active alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-background/50 border border-primary/20 flex gap-3">
                <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{alert.type}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                <Button size="sm" variant="outline">Take Action</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
