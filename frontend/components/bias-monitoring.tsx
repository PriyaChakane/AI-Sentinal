'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, TrendingUp, RefreshCw, Database, Brain, Info } from 'lucide-react';

interface Dataset {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface Model {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface FairnessMetric {
  metric: string;
  value: number;
  threshold: number;
}

interface DisparityGroup {
  id: number;
  group: string;
  approvalRate: number;
  overall: number;
  disparity: number;
  severity: string;
  trend: string;
}

interface BiasResult {
  success: boolean;
  dataset_name: string;
  model_name?: string;
  fairness_metrics: FairnessMetric[];
  demographic_parity_data: Array<{
    group: string;
    approved: number;
    denied: number;
  }>;
  bias_time_series: Array<{
    week: string;
    female_rate: number;
    male_rate: number;
  }>;
  disparity_groups: DisparityGroup[];
  overall_fairness_score: number;
  critical_alerts: string[];
  recommendations: string[];
  analysis_duration_seconds: number;
  timestamp: string;
  total_samples: number;
  protected_attributes_analyzed: string[];
}

export function BiasMonitoring() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('none');
  const [targetColumn, setTargetColumn] = useState<string>('target');
  const [result, setResult] = useState<BiasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  const getToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    fetchDatasets();
    fetchModels();
  }, []);

  const fetchDatasets = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/upload/datasets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets || []);
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };

  const fetchModels = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/upload/models', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const analyzeBias = async () => {
    if (!selectedDataset) {
      setError('Please select a dataset');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setAvailableColumns([]);

    const token = getToken();

    try {
      const startTime = Date.now();
      
      const requestBody: any = {
        dataset_id: parseInt(selectedDataset),
        target_column: targetColumn,
        protected_attributes: ['gender', 'age_group', 'ethnicity', 'location']
      };
      
      if (selectedModel && selectedModel !== 'none') {
        requestBody.model_id = parseInt(selectedModel);
      }
      
      const res = await fetch('/api/bias/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.available_columns) {
          setAvailableColumns(data.available_columns);
          setError(`${data.error}. Available columns: ${data.available_columns.join(', ')}`);
        } else {
          setError(data.error || 'Bias analysis failed');
        }
        return;
      }

      setResult(data);

    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'high': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return 'text-green-500';
    if (score >= threshold * 0.8) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Bias & Fairness Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor demographic parity, equal opportunity, and disparate impact across protected groups
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            {availableColumns.length > 0 && (
              <div className="mt-2 p-2 bg-red-950/50 rounded">
                <p className="text-xs font-semibold">Available columns in your dataset:</p>
                <p className="text-xs mt-1 font-mono">{availableColumns.join(', ')}</p>
                <p className="text-xs mt-2 text-yellow-300">💡 Tip: Try using one of these as target column</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Fairness Analysis Configuration</CardTitle>
          <CardDescription>Select dataset and model to analyze bias metrics across demographic groups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dataset *</label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(dataset => (
                    <SelectItem key={dataset.id} value={dataset.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        {dataset.filename}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model (Optional)</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a model (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No model (use existing predictions)</SelectItem>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        {model.filename}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Column</label>
              <Input
                type="text"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                placeholder="e.g., target, label, approved"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Column containing ground truth labels (0/1 or True/False)
              </p>
            </div>
          </div>

          <Button 
            onClick={analyzeBias} 
            disabled={loading || !selectedDataset}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Fairness Metrics...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Analyze Bias & Fairness
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Overall Fairness Score</p>
                <p className={`text-3xl font-bold mt-2 ${
                  result.overall_fairness_score >= 0.8 ? 'text-green-500' :
                  result.overall_fairness_score >= 0.6 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {(result.overall_fairness_score * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {result.protected_attributes_analyzed.length} protected attributes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Samples</p>
                <p className="text-3xl font-bold mt-2">{result.total_samples.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Protected Attributes</p>
                <p className="text-3xl font-bold mt-2">{result.protected_attributes_analyzed.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.protected_attributes_analyzed.join(', ')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Analysis Time</p>
                <p className="text-3xl font-bold mt-2">{result.analysis_duration_seconds.toFixed(1)}s</p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alert */}
          {result.critical_alerts.length > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-400">Critical Bias Alert</p>
                {result.critical_alerts.slice(0, 3).map((alert, idx) => (
                  <p key={idx} className="text-sm text-red-300/80 mt-1">{alert}</p>
                ))}
              </div>
            </div>
          )}

          {/* Fairness Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.fairness_metrics.slice(0, 8).map((metric, idx) => (
              <Card key={idx} className="bg-card border-border">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground truncate" title={metric.metric}>
                    {metric.metric.length > 35 ? metric.metric.substring(0, 32) + '...' : metric.metric}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${getScoreColor(metric.value, metric.threshold)}`}>
                    {(metric.value * 100).toFixed(1)}%
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        metric.value >= metric.threshold ? 'bg-green-500' : 
                        metric.value >= metric.threshold * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(metric.value / metric.threshold) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: {(metric.threshold * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Approval Rate by Group - Bar Chart */}
            {result.demographic_parity_data.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Approval Rate by Demographic Group</CardTitle>
                  <CardDescription>Comparing approval rates across protected attributes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={result.demographic_parity_data.slice(0, 12)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="group" 
                        stroke="rgba(255,255,255,0.5)" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100} 
                        fontSize={11}
                        interval={0}
                      />
                      <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="approved" fill="#6366f1" name="Approved %" />
                      <Bar dataKey="denied" fill="#ec4899" name="Denied %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Disparity Over Time - Line Chart */}
            {result.bias_time_series.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Approval Rate Trend Over Time</CardTitle>
                  <CardDescription>Gender-based approval rate disparity trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={result.bias_time_series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" domain={[60, 95]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="female_rate" 
                        stroke="#ec4899" 
                        strokeWidth={2} 
                        name="Female" 
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="male_rate" 
                        stroke="#6366f1" 
                        strokeWidth={2} 
                        name="Male" 
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <Alert className="mt-4 bg-yellow-500/10 border-yellow-500/30">
                    <Info className="w-4 h-4 text-yellow-500" />
                    <AlertDescription className="text-xs">
                      {result.bias_time_series[result.bias_time_series.length - 1]?.female_rate < 
                       result.bias_time_series[result.bias_time_series.length - 1]?.male_rate
                        ? "⚠️ Gender disparity is widening. Consider reviewing model decisions for female applicants."
                        : "✅ Gender disparity is within acceptable range. Continue monitoring."}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fairness Radar Chart */}
          {result.fairness_metrics.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Fairness Metrics Radar</CardTitle>
                <CardDescription>Multi-dimensional fairness assessment across all metrics</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width={500} height={450}>
                  <RadarChart data={result.fairness_metrics.slice(0, 8)}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      stroke="rgba(255,255,255,0.5)" 
                      tick={{ fontSize: 10, fill: '#888' }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 1]} stroke="rgba(255,255,255,0.5)" />
                    <Radar 
                      name="Current Score" 
                      dataKey="value" 
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.6} 
                    />
                    <Radar 
                      name="Threshold" 
                      dataKey="threshold" 
                      stroke="#a78bfa" 
                      fillOpacity={0} 
                      strokeDasharray="3 3" 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Disparity Analysis Table */}
          {result.disparity_groups.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Disparate Impact Analysis</CardTitle>
                <CardDescription>Approval rate disparity from overall population rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.disparity_groups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-4 rounded-lg border flex items-start justify-between ${getSeverityColor(group.severity)}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{group.group}</p>
                        <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Group Rate</p>
                            <p className="font-mono font-bold">{group.approvalRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Overall Rate</p>
                            <p className="font-mono font-bold">{group.overall.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Disparity</p>
                            <p className={`font-mono font-bold ${group.disparity < 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {group.disparity > 0 ? '+' : ''}{group.disparity.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Impact Ratio</p>
                            <p className="font-mono font-bold">
                              {(group.approvalRate / group.overall * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              group.disparity >= -5 ? 'bg-green-500' : 
                              group.disparity >= -10 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, 100 + group.disparity))}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-2 flex items-center gap-1 ${
                          group.trend === 'worsening' ? 'text-red-400' : 
                          group.trend === 'improving' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          <TrendingUp className="w-3 h-3" /> 
                          Trend: {group.trend} {group.trend === 'worsening' && '⚠️ Needs attention'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getSeverityTextColor(group.severity)}`}>
                        {group.severity.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle>Bias Mitigation Strategies</CardTitle>
              <CardDescription>Actionable recommendations based on analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-background/50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{rec}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Protected Attributes Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Protected Attributes Summary</CardTitle>
              <CardDescription>Demographic groups analyzed in this session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.protected_attributes_analyzed.map((attr, idx) => (
                  <div key={idx} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                    {attr}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                📊 Analysis based on {result.total_samples.toLocaleString()} records | 
                Generated {new Date(result.timestamp).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!result && !loading && datasets.length > 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Ready to Analyze Fairness</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a dataset and optionally a model to analyze bias metrics including
              demographic parity, equal opportunity, and disparate impact.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium mb-1">📊 Demographic Parity</div>
                <p className="text-xs text-muted-foreground">Equal approval rates across groups</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium mb-1">🎯 Equal Opportunity</div>
                <p className="text-xs text-muted-foreground">Equal true positive rates</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium mb-1">⚖️ Disparate Impact</div>
                <p className="text-xs text-muted-foreground">Fairness ratio between groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
