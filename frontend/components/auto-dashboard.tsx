'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export function AutoDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const getToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    generateDashboard();
  }, []);

  const generateDashboard = async () => {
    setGenerating(true);
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/auto-dashboard/auto-generate', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDashboardData(data.dashboard_data);
      }
    } catch (err) {
      console.error('Failed to generate dashboard:', err);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const exportReport = () => {
    // Create downloadable report
    const report = {
      generated_at: new Date().toISOString(),
      summary: dashboardData?.summary,
      insights: dashboardData?.insights,
      predictions: dashboardData?.predictions
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auto_dashboard_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || generating) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Auto-generating intelligent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold">Auto-Generated Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered dashboard with intelligent insights and predictions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateDashboard} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
          <Button onClick={exportReport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Models</p>
            <p className="text-3xl font-bold mt-2">{dashboardData?.summary?.total_models || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Accuracy</p>
            <p className="text-3xl font-bold mt-2 text-green-500">{dashboardData?.summary?.avg_accuracy || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Data Quality</p>
            <p className="text-3xl font-bold mt-2 text-blue-500">{dashboardData?.summary?.avg_quality || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Fairness Score</p>
            <p className="text-3xl font-bold mt-2 text-purple-500">{dashboardData?.summary?.avg_fairness || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Predictions */}
      {dashboardData?.predictions && (
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
          <CardHeader>
            <CardTitle>AI Predictions</CardTitle>
            <CardDescription>Forecasted metrics for next month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Predicted Accuracy</p>
                <p className="text-2xl font-bold">
                  {dashboardData.predictions.next_month_accuracy || 0}%
                </p>
                <Badge className={dashboardData.predictions.trend === 'improving' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {dashboardData.predictions.trend === 'improving' ? '↑ Improving' : '↓ Declining'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {dashboardData?.insights && dashboardData.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Intelligent Insights</CardTitle>
            <CardDescription>Key takeaways from your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.insights.map((insight: string, idx: number) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
