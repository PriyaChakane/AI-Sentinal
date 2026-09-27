'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Brain, TrendingUp, Shield, Database, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface Recommendation {
  id: number;
  type: string;
  title: string;
  description: string;
  suggested_action: string;
  priority: string;
  expected_improvement: string;
}

export function DecisionEngine() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<number | null>(null);

  const getToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('http://localhost:8000/decision/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeRecommendation = async (id: number) => {
    setExecuting(id);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:8000/decision/execute/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert(`Recommendation ${id} executed successfully!`);
        fetchRecommendations();
      }
    } catch (err) {
      console.error('Failed to execute:', err);
    } finally {
      setExecuting(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'model_improvement': return <Brain className="w-5 h-5" />;
      case 'fairness_improvement': return <Shield className="w-5 h-5" />;
      case 'data_quality': return <Database className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing for recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold">Decision Intelligence Engine</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered recommendations to optimize your ML models
          </p>
        </div>
        <Button onClick={fetchRecommendations} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className={getPriorityColor(rec.priority)}>
                  {rec.priority.toUpperCase()} PRIORITY
                </Badge>
                {getTypeIcon(rec.type)}
              </div>
              <CardTitle className="mt-3">{rec.title}</CardTitle>
              <CardDescription>{rec.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Suggested Action:</p>
                <p className="text-sm text-muted-foreground">{rec.suggested_action}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <p className="text-sm font-medium mb-1">Expected Improvement:</p>
                <p className="text-sm text-green-400">{rec.expected_improvement}</p>
              </div>
              <Button 
                onClick={() => executeRecommendation(rec.id)} 
                disabled={executing === rec.id}
                className="w-full"
              >
                {executing === rec.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Execute Recommendation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}