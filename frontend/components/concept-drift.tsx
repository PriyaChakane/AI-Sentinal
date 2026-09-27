'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { 
  AlertTriangle, TrendingDown, TrendingUp, Activity, Shield, 
  Brain, Target, Clock, BarChart3, Zap, CheckCircle, XCircle,
  TrendingUp as TrendUp, TrendingDown as TrendDown, Minus
} from 'lucide-react';

interface Model {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface Dataset {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  auc?: number;
  mse?: number;
  rmse?: number;
  r2_score?: number;
  mae?: number;
  mape?: number;
}

interface EvaluationResult {
  success: boolean;
  model_name: string;
  dataset_name: string;
  task_type: string;
  metrics: ModelMetrics;
  drift_detected: boolean;
  drift_type: string;
  drift_severity: string;
  drift_score: number;
  affected_metrics: string[];
  performance_history: Array<{
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    timestamp: string;
  }>;
  baseline_metrics: any;
  recommendations: string[];
  total_samples: number;
  timestamp: string;
}

export function ConceptDrift() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [taskType, setTaskType] = useState<string>('classification');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  const getToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    fetchModels();
    fetchDatasets();
  }, []);

  const fetchModels = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

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

  const fetchDatasets = async () => {
    const token = getToken();
    if (!token) return;

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

  const evaluateModel = async () => {
    if (!selectedModel || !selectedDataset || !targetColumn) {
      setError('Please select model, dataset, and target column');
      return;
    }

    setLoading(true);
    setError('');
    setEvaluationResult(null);

    const token = getToken();

    try {
      const res = await fetch('/api/model-drift/evaluate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: parseInt(selectedModel),
          dataset_id: parseInt(selectedDataset),
          target_column: targetColumn,
          task_type: taskType
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.available_columns) {
          setAvailableColumns(data.available_columns);
          setError(`${data.error}. Available columns: ${data.available_columns.join(', ')}`);
        } else {
          setError(data.error || 'Model evaluation failed');
        }
        return;
      }

      setEvaluationResult(data);

    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDriftSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
  };

  const getMetricTrend = (current: number, baseline: number) => {
    if (!baseline) return 'neutral';
    const diff = current - baseline;
    if (diff > 0.02) return 'up';
    if (diff < -0.02) return 'down';
    return 'neutral';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Concept Drift Detection</h1>
        <p className="text-muted-foreground mt-2">
          Monitor model performance degradation over time to detect concept drift
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Model Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluate Model Performance</CardTitle>
          <CardDescription>Test your model on a dataset to detect performance drift</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
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
              <label className="block text-sm font-medium mb-2">Select Dataset</label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(dataset => (
                    <SelectItem key={dataset.id} value={dataset.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {dataset.filename}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target Column</label>
              <Input
                type="text"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                placeholder="e.g., target, label, price"
              />
              {availableColumns.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {availableColumns.slice(0, 5).join(', ')}
                  {availableColumns.length > 5 && ` + ${availableColumns.length - 5} more`}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Task Type</label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classification">Classification</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={evaluateModel} 
            disabled={loading || !selectedModel || !selectedDataset || !targetColumn}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Evaluating Model Performance...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Detect Concept Drift
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Evaluation Results */}
      {evaluationResult && (
        <>
          {/* Drift Alert */}
          <div className={`p-6 rounded-lg border ${getDriftSeverityColor(evaluationResult.drift_severity)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {evaluationResult.drift_detected ? (
                  <AlertTriangle className="w-10 h-10 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {evaluationResult.drift_detected ? '⚠️ Concept Drift Detected!' : '✅ No Concept Drift Detected'}
                  </h3>
                  <p className="text-sm mt-1">
                    {evaluationResult.drift_type}
                  </p>
                  {evaluationResult.drift_detected && (
                    <div className="mt-2">
                      <Badge variant="outline" className="mr-2">
                        Drift Score: {(evaluationResult.drift_score * 100).toFixed(1)}%
                      </Badge>
                      <Badge variant="outline">
                        Severity: {evaluationResult.drift_severity.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-mono text-sm">{evaluationResult.model_name}</p>
                <p className="text-sm text-muted-foreground mt-1">Samples</p>
                <p className="font-mono text-sm">{evaluationResult.total_samples.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Current Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {taskType === 'classification' ? (
              <>
                <MetricCard 
                  title="Accuracy" 
                  value={evaluationResult.metrics.accuracy} 
                  baseline={evaluationResult.baseline_metrics?.accuracy}
                  format="percentage"
                />
                <MetricCard 
                  title="Precision" 
                  value={evaluationResult.metrics.precision} 
                  baseline={evaluationResult.baseline_metrics?.precision}
                  format="percentage"
                />
                <MetricCard 
                  title="Recall" 
                  value={evaluationResult.metrics.recall} 
                  baseline={evaluationResult.baseline_metrics?.recall}
                  format="percentage"
                />
                <MetricCard 
                  title="F1 Score" 
                  value={evaluationResult.metrics.f1_score} 
                  baseline={evaluationResult.baseline_metrics?.f1_score}
                  format="percentage"
                />
              </>
            ) : (
              <>
                <MetricCard 
                  title="RMSE" 
                  value={evaluationResult.metrics.rmse} 
                  baseline={evaluationResult.baseline_metrics?.rmse}
                  format="number"
                  lowerIsBetter={true}
                />
                <MetricCard 
                  title="R² Score" 
                  value={evaluationResult.metrics.r2_score} 
                  baseline={evaluationResult.baseline_metrics?.r2_score}
                  format="percentage"
                />
                <MetricCard 
                  title="MAE" 
                  value={evaluationResult.metrics.mae} 
                  baseline={evaluationResult.baseline_metrics?.mae}
                  format="number"
                  lowerIsBetter={true}
                />
                <MetricCard 
                  title="MAPE" 
                  value={evaluationResult.metrics.mape} 
                  baseline={evaluationResult.baseline_metrics?.mape}
                  format="percentage"
                  lowerIsBetter={true}
                />
              </>
            )}
          </div>

          {/* Affected Metrics */}
          {evaluationResult.affected_metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Affected Metrics</CardTitle>
                <CardDescription>Metrics showing significant degradation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {evaluationResult.affected_metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-red-500/10 rounded">
                      <TrendDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{metric}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance History Chart */}
          {evaluationResult.performance_history && evaluationResult.performance_history.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Model performance trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={evaluationResult.performance_history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString()}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis domain={[0, 1]} stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      labelFormatter={(val) => new Date(val).toLocaleString()}
                      formatter={(value: number) => (value * 100).toFixed(2) + '%'}
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#3b82f6" 
                      name="Accuracy" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="precision" 
                      stroke="#10b981" 
                      name="Precision" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recall" 
                      stroke="#f59e0b" 
                      name="Recall" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="f1_score" 
                      stroke="#ec4899" 
                      name="F1 Score" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Based on concept drift analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {evaluationResult.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-background/50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!evaluationResult && !loading && models.length > 0 && datasets.length > 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Ready to Detect Concept Drift</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a trained model and a test dataset to evaluate performance and detect concept drift
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-3 bg-muted/30 rounded-lg">
                <TrendUp className="w-4 h-4 text-green-500 mb-2" />
                <p className="text-sm font-medium">Performance Tracking</p>
                <p className="text-xs text-muted-foreground">Monitor metrics over time</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mb-2" />
                <p className="text-sm font-medium">Drift Detection</p>
                <p className="text-xs text-muted-foreground">Identify performance degradation</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <Brain className="w-4 h-4 text-purple-500 mb-2" />
                <p className="text-sm font-medium">Retraining Alerts</p>
                <p className="text-xs text-muted-foreground">Know when to retrain</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for metric cards
function MetricCard({ title, value, baseline, format, lowerIsBetter = false }: any) {
  if (value === undefined || value === null) return null;
  
  const trend = baseline ? (value - baseline) : 0;
  const isBetter = lowerIsBetter ? trend < 0 : trend > 0;
  
  const formattedValue = format === 'percentage' 
    ? `${(value * 100).toFixed(2)}%`
    : value.toFixed(4);
  
  const formattedBaseline = baseline && format === 'percentage'
    ? `${(baseline * 100).toFixed(2)}%`
    : baseline?.toFixed(4);

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold mt-2">{formattedValue}</p>
        {baseline && (
          <div className="flex items-center gap-1 mt-1">
            {trend !== 0 && (
              isBetter ? 
                <TrendUp className="w-3 h-3 text-green-500" /> : 
                <TrendDown className="w-3 h-3 text-red-500" />
            )}
            <p className="text-xs text-muted-foreground">
              Baseline: {formattedBaseline}
            </p>
            {trend !== 0 && (
              <span className={`text-xs ${isBetter ? 'text-green-500' : 'text-red-500'}`}>
                ({trend > 0 ? '+' : ''}{(trend * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
