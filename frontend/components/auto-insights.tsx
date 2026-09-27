'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Zap, Shield, Activity, Loader2, 
  RefreshCw
} from 'lucide-react';

interface Insight {
  type: string;
  severity: string;
  message: string;
  recommendation: string;
  auto_action: string;
}

export function AutoInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchInsights = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/auto-learning/insights', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
        setHealthScore(data.health_score || 85);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getInsightIcon = (type: string) => {
    if (type.includes('performance')) return <TrendingDown className="w-5 h-5" />;
    if (type.includes('drift')) return <Zap className="w-5 h-5" />;
    if (type.includes('bias') || type.includes('fairness')) return <Shield className="w-5 h-5" />;
    if (type.includes('quality')) return <Activity className="w-5 h-5" />;
    return <Lightbulb className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Auto Insights</h1>
          <p className="text-muted-foreground mt-2">AI-powered system insights from your monitoring data</p>
        </div>
        <Button onClick={fetchInsights} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Insights
        </Button>
      </div>

      {/* Health Score Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary">{healthScore}%</div>
            <p className="text-muted-foreground mt-2">System Health Score</p>
            <Progress value={healthScore} className="mt-3" />
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle>Intelligent Insights</CardTitle>
          <CardDescription>Automatically detected patterns and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-muted-foreground">No insights available. Upload data to generate insights.</p>
            </div>
          ) : (
            insights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className="capitalize">
                        {insight.type.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={
                        insight.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 
                        insight.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-blue-500/20 text-blue-400'
                      }>
                        {insight.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="font-medium">{insight.message}</p>
                    <div className="mt-3 p-3 bg-background/50 rounded-lg">
                      <p className="text-sm">
                        <strong>💡 Recommendation:</strong> {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
