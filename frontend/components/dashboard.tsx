'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Database, Brain, Shield, Activity, Zap, Bell, Loader2 } from 'lucide-react';


interface DashboardStats {
  active_models: number;
  total_datasets: number;
  avg_accuracy: number;
  avg_quality_score: number;
  avg_fairness_score: number;
  avg_interpretability: number;
  high_drift_alerts: number;
  active_alerts: number;
}

interface RecentItem {
  id: number;
  name: string;
  uploaded_at: string;
}

interface PerformanceData {
  date: string;
  accuracy: number;
}

interface DriftChartData {
  metric: string;
  value: number;
  threshold: number;
}

interface TopDriftFeature {
  feature: string;
  avg_drift: number;
}

interface TopBiasIssue {
  dataset: string;
  fairness: number;
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  feature: string;
}

interface DashboardData {
  stats: DashboardStats;
  recent_models: RecentItem[];
  recent_datasets: RecentItem[];
  performance_data: PerformanceData[];
  drift_chart_data: DriftChartData[];
  top_drift_features: TopDriftFeature[];
  top_bias_issues: TopBiasIssue[];
  alerts: Alert[];
}

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }: any) => (
  <Card className="bg-card border-border hover:border-primary/50 transition-all">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color || 'text-foreground'}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-8 h-8 text-primary opacity-60" />
      </div>
      {trend && <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {trend}</p>}
    </CardContent>
  </Card>
);

export function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/dashboard/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">ML Observability Dashboard</h1>
          <p className="text-muted-foreground mt-2">Real-time monitoring of model performance and data quality</p>
        </div>
        <Button onClick={() => window.location.href = '/alerts'} variant="outline" className="gap-2 bg-red-500/10 border-red-500/30">
          <Bell className="w-4 h-4 text-red-400" />
          <span className="text-red-400">{dashboardData?.stats.active_alerts || 0} Active Alerts</span>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Models" 
          value={dashboardData?.stats.active_models || 0} 
          icon={CheckCircle} 
          color="text-blue-400"
          subtitle="Uploaded models"
        />
        <StatCard 
          title="Avg Accuracy" 
          value={`${dashboardData?.stats.avg_accuracy || 0}%`} 
          icon={TrendingUp} 
          color="text-green-400"
          subtitle="Across all models"
        />
        <StatCard 
          title="Data Quality" 
          value={`${dashboardData?.stats.avg_quality_score || 0}%`} 
          icon={Database}
          color={(dashboardData?.stats.avg_quality_score || 0) > 90 ? 'text-green-400' : 'text-yellow-400'}
          subtitle="Overall score"
        />
        <StatCard 
          title="Fairness Score" 
          value={`${dashboardData?.stats.avg_fairness_score || 0}%`} 
          icon={Shield}
          color={(dashboardData?.stats.avg_fairness_score || 0) > 80 ? 'text-green-400' : 'text-yellow-400'}
          subtitle="Bias monitoring"
        />
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Interpretability" 
          value={`${dashboardData?.stats.avg_interpretability || 0}/10`} 
          icon={Brain}
          color="text-purple-400"
          subtitle="SHAP + LIME"
        />
        <StatCard 
          title="Total Datasets" 
          value={dashboardData?.stats.total_datasets || 0} 
          icon={Database}
          subtitle="Uploaded datasets"
        />
        <StatCard 
          title="High Drift Alerts" 
          value={dashboardData?.stats.high_drift_alerts || 0} 
          icon={Activity}
          color={(dashboardData?.stats.high_drift_alerts || 0) > 0 ? 'text-red-400' : 'text-green-400'}
          subtitle="Features with drift"
        />
        <StatCard 
          title="Critical Alerts" 
          value={dashboardData?.stats.active_alerts || 0} 
          icon={AlertCircle}
          color={(dashboardData?.stats.active_alerts || 0) > 0 ? 'text-red-400' : 'text-green-400'}
          subtitle="Needs attention"
        />
      </div>

      {/* Active Alerts Bar */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="flex-1">
              <p className="font-medium text-red-400">Active Alerts ({dashboardData.alerts.length})</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {dashboardData.alerts.slice(0, 3).map((alert, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">
                    {alert.type}
                  </span>
                ))}
                {dashboardData.alerts.length > 3 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    +{dashboardData.alerts.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/alerts'}>
              View All
            </Button>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Model Performance Trend</CardTitle>
            <CardDescription>Accuracy over time across models</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData?.performance_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={[70, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Accuracy" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Drift Analysis */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Drift & Quality Analysis</CardTitle>
            <CardDescription>Current metrics vs thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData?.drift_chart_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => value.toFixed(3)}
                />
                <Legend />
                <Bar dataKey="value" fill="#6366f1" name="Current Value" />
                <Bar dataKey="threshold" fill="#ec4899" name="Threshold" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid - Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drift Features */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Top Drift Features</CardTitle>
            <CardDescription>Features with highest drift scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.top_drift_features && dashboardData.top_drift_features.length > 0 ? (
                dashboardData.top_drift_features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">{feature.feature}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${feature.avg_drift > 0.2 ? 'bg-red-500' : feature.avg_drift > 0.1 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (feature.avg_drift / 0.3) * 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${feature.avg_drift > 0.2 ? 'text-red-400' : feature.avg_drift > 0.1 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {feature.avg_drift.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No drift data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Bias Issues */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Fairness Issues</CardTitle>
            <CardDescription>Datasets with lowest fairness scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.top_bias_issues && dashboardData.top_bias_issues.length > 0 ? (
                dashboardData.top_bias_issues.map((issue, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium truncate flex-1">{issue.dataset}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${issue.fairness < 70 ? 'bg-red-500' : issue.fairness < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${issue.fairness}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${issue.fairness < 70 ? 'text-red-400' : issue.fairness < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {issue.fairness.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No fairness data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recently Uploaded Models</CardTitle>
            <CardDescription>Latest models added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData?.recent_models && dashboardData.recent_models.length > 0 ? (
                dashboardData.recent_models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm">{model.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(model.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No models uploaded yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recently Uploaded Datasets</CardTitle>
            <CardDescription>Latest datasets added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData?.recent_datasets && dashboardData.recent_datasets.length > 0 ? (
                dashboardData.recent_datasets.map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary" />
                      <span className="text-sm">{dataset.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(dataset.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No datasets uploaded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => window.location.href = '/data-quality'} variant="outline" size="sm">
          <Database className="w-4 h-4 mr-2" />
          Data Quality
        </Button>
        <Button onClick={() => window.location.href = '/drift-detection'} variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Data Drift
        </Button>
        <Button onClick={() => window.location.href = '/concept-drift'} variant="outline" size="sm">
          <TrendingUp className="w-4 h-4 mr-2" />
          Concept Drift
        </Button>
        <Button onClick={() => window.location.href = '/explainability'} variant="outline" size="sm">
          <Brain className="w-4 h-4 mr-2" />
          Explainability
        </Button>
        <Button onClick={() => window.location.href = '/bias'} variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Bias & Fairness
        </Button>
        <Button onClick={() => window.location.href = '/alerts'} variant="outline" size="sm" className="bg-red-500/10 border-red-500/30">
          <Bell className="w-4 h-4 mr-2 text-red-400" />
          View Alerts
        </Button>
      </div>
    </div>
  );
}
