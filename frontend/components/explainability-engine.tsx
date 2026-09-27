'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { 
  Zap, TrendingUp, TrendingDown, Activity, BarChart3, 
  Shield, Brain, Target, Award, AlertTriangle, CheckCircle, 
  Info, Download, Eye, Lightbulb, Layers, ArrowUp, ArrowDown,
  Hash, Calculator, FileText, Clock, ThumbsUp, ThumbsDown,
  RefreshCw, Minus, Sparkles
} from 'lucide-react';

// Rest of your interfaces remain the same...
interface Model {
  id: number;
  filename: string;
  uploaded_at: string;
  model_type?: string;
}

interface Dataset {
  id: number;
  filename: string;
  uploaded_at: string;
  rows?: number;
  columns?: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  importance_percent: number;
  importance_std: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  rank: number;
  impact_direction: 'positive' | 'negative' | 'neutral';
  category?: string;
  method?: string;
}

interface ShapValue {
  feature: string;
  shap_value: number;
  feature_value: number;
  impact: string;
  direction: 'increases' | 'decreases';
  magnitude: 'high' | 'medium' | 'low';
}

interface LimeContribution {
  feature: string;
  contribution: number;
  direction: 'positive' | 'negative';
  magnitude: 'high' | 'medium' | 'low';
}

interface LimeExplanation {
  id: number;
  prediction: number;
  actual_value?: number;
  confidence: number;
  feature_contributions: LimeContribution[];
  explanation_html?: string;
}

interface SamplePrediction {
  id: number;
  prediction: number;
  actual_value?: number;
  confidence: number;
  prediction_label: string;
  base_value: number;
  top_features: ShapValue[];
  feature_contributions: {
    positive_contributions: number;
    negative_contributions: number;
    net_effect: number;
  };
}

interface ExplainabilityResult {
  model_name: string;
  model_type: string;
  dataset_name: string;
  explainer_type: string;
  shap_feature_importance: FeatureImportance[];
  lime_feature_importance: FeatureImportance[] | null;
  model_feature_importance: FeatureImportance[] | null;
  shap_explanations: SamplePrediction[];
  lime_explanations: LimeExplanation[];
  interpretability_score: number;
  interpretability_breakdown: {
    global_interpretability: number;
    local_interpretability: number;
    feature_stability: number;
    consistency_score: number;
    lime_consistency: number;
  };
  feature_correlations: Array<{
    feature1: string;
    feature2: string;
    correlation: number;
  }>;
  num_samples_analyzed: number;
  total_features: number;
  analysis_duration_seconds: number;
  validation_metrics: {
    r2_score?: number;
    accuracy?: number;
    mae?: number;
    rmse?: number;
  };
  recommendations: string[];
  timestamp: string;
  lime_available: boolean;
}

export function ExplainabilityEngine() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [numSamples, setNumSamples] = useState<string>('100');
  const [result, setResult] = useState<ExplainabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

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

  const analyzeExplainability = async () => {
    if (!selectedModel || !selectedDataset || !targetColumn) {
      setError('Please select model, dataset, and target column');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const token = getToken();

    try {
      const startTime = Date.now();
      
      const res = await fetch('/api/explainability/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: parseInt(selectedModel),
          dataset_id: parseInt(selectedDataset),
          target_column: targetColumn,
          num_samples: parseInt(numSamples),
          detailed_analysis: true,
          include_interactions: true,
          explanation_method: 'both'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.available_columns) {
          setAvailableColumns(data.available_columns);
          setError(`${data.error}. Available columns: ${data.available_columns.join(', ')}`);
        } else {
          setError(data.error || 'Analysis failed');
        }
        return;
      }

      const enhancedData = {
        ...data,
        analysis_duration_seconds: (Date.now() - startTime) / 1000,
        timestamp: new Date().toISOString()
      };

      setResult(enhancedData);

    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInterpretabilityColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getInterpretabilityBadge = (score: number) => {
    if (score >= 8) return { label: 'Excellent', color: 'bg-green-500', icon: Award };
    if (score >= 6) return { label: 'Good', color: 'bg-yellow-500', icon: ThumbsUp };
    if (score >= 4) return { label: 'Fair', color: 'bg-orange-500', icon: AlertTriangle };
    return { label: 'Poor', color: 'bg-red-500', icon: ThumbsDown };
  };

  const getMagnitudeColor = (magnitude: string) => {
    switch(magnitude) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const getTopFeatures = (count: number = 10) => {
    return result?.shap_feature_importance?.slice(0, count) || [];
  };

  const getCumulativeImportance = () => {
    if (!result?.shap_feature_importance) return [];
    let cumulative = 0;
    return result.shap_feature_importance.map(f => {
      cumulative += f.importance_percent;
      return { ...f, cumulative_percent: cumulative };
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Explainability Engine</h1>
        <p className="text-muted-foreground mt-2">
          Advanced model interpretability with SHAP values, LIME explanations, feature importance, and prediction insights
        </p>
        {result?.lime_available === false && (
          <Alert className="mt-2">
            <Info className="w-4 h-4" />
            <AlertDescription>
              LIME is not installed on the backend. Install with: pip install lime
            </AlertDescription>
          </Alert>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Model Explanation Configuration</CardTitle>
          <CardDescription>
            Configure explainability analysis to understand how your model makes predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Trained Model</label>
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
              <label className="block text-sm font-medium mb-2">Dataset</label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(dataset => (
                    <SelectItem key={dataset.id} value={dataset.id.toString()}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
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
                placeholder="e.g., target, price, class"
              />
              {availableColumns.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {availableColumns.slice(0, 5).join(', ')}
                  {availableColumns.length > 5 && ` + ${availableColumns.length - 5} more`}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Analysis Samples</label>
              <Input
                type="number"
                value={numSamples}
                onChange={(e) => setNumSamples(e.target.value)}
                placeholder="100"
                min="50"
                max="500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                More samples = better global understanding (slower)
              </p>
            </div>
          </div>

          <Button 
            onClick={analyzeExplainability} 
            disabled={loading || !selectedModel || !selectedDataset || !targetColumn}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running SHAP + LIME Analysis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Model Explanations (SHAP + LIME)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results - Keep the same as before */}
      {result && (
        <>
          {/* Interpretability Score Card */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                    <div className="text-3xl font-bold text-primary">
                      {result.interpretability_score.toFixed(1)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Interpretability Score</p>
                  <p className={`text-lg font-semibold ${getInterpretabilityColor(result.interpretability_score)}`}>
                    {getInterpretabilityBadge(result.interpretability_score).label}
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold">{result.total_features}</div>
                  <p className="text-sm text-muted-foreground">Total Features</p>
                  <p className="text-xs">Analyzed {result.num_samples_analyzed} samples</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold">{result.model_type || 'Unknown'}</div>
                  <p className="text-sm text-muted-foreground">Model Type</p>
                  <p className="text-xs">Using {result.explainer_type}</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold">{result.analysis_duration_seconds.toFixed(1)}s</div>
                  <p className="text-sm text-muted-foreground">Analysis Time</p>
                  <p className="text-xs">Generated {new Date(result.timestamp).toLocaleTimeString()}</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {result.lime_explanations?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">LIME Explanations</p>
                  <p className="text-xs">Local interpretations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interpretability Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Interpretability Metrics Breakdown</CardTitle>
              <CardDescription>Detailed analysis of model explainability quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Global Interpretability</span>
                    <Eye className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {result.interpretability_breakdown.global_interpretability.toFixed(1)}/10
                  </div>
                  <Progress value={result.interpretability_breakdown.global_interpretability * 10} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Overall model understanding</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Local Interpretability</span>
                    <Target className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {result.interpretability_breakdown.local_interpretability.toFixed(1)}/10
                  </div>
                  <Progress value={result.interpretability_breakdown.local_interpretability * 10} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Individual prediction quality</p>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Feature Stability</span>
                    <Shield className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {result.interpretability_breakdown.feature_stability.toFixed(1)}/10
                  </div>
                  <Progress value={result.interpretability_breakdown.feature_stability * 10} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Consistency across samples</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Consistency Score</span>
                    <Activity className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {result.interpretability_breakdown.consistency_score.toFixed(1)}/10
                  </div>
                  <Progress value={result.interpretability_breakdown.consistency_score * 10} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Method alignment</p>
                </div>

                <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">LIME Consistency</span>
                    <Zap className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {result.interpretability_breakdown.lime_consistency?.toFixed(1) || 0}/10
                  </div>
                  <Progress value={(result.interpretability_breakdown.lime_consistency || 0) * 10} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">LIME explanation quality</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="global" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="global">
                <BarChart3 className="w-4 h-4 mr-2" />
                Global Importance
              </TabsTrigger>
              <TabsTrigger value="shap">
                <Brain className="w-4 h-4 mr-2" />
                SHAP Explanations
              </TabsTrigger>
              <TabsTrigger value="lime">
                <Zap className="w-4 h-4 mr-2" />
                LIME Explanations
              </TabsTrigger>
              <TabsTrigger value="interactions">
                <Layers className="w-4 h-4 mr-2" />
                Feature Interactions
              </TabsTrigger>
              <TabsTrigger value="validation">
                <Calculator className="w-4 h-4 mr-2" />
                Validation & Proof
              </TabsTrigger>
            </TabsList>

            {/* Global Feature Importance Tab */}
            <TabsContent value="global" className="space-y-6">
              {/* SHAP Importance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>SHAP Global Feature Importance</CardTitle>
                  <CardDescription>
                    Average absolute SHAP values showing each feature's impact on model predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart 
                      data={getTopFeatures(15)}
                      layout="vertical"
                      margin={{ left: 150, right: 30, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" label={{ value: 'Mean |SHAP Value|', position: 'bottom' }} />
                      <YAxis dataKey="feature" type="category" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(4)}`, 'SHAP Value']} />
                      <Bar dataKey="importance" fill="#6366f1" name="SHAP Importance">
                        {getTopFeatures(15).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* LIME Feature Importance Comparison */}
              {result.lime_feature_importance && result.lime_feature_importance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>LIME Global Feature Importance</CardTitle>
                    <CardDescription>
                      Feature importance derived from LIME explanations across multiple samples
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={result.lime_feature_importance.slice(0, 10)}
                        layout="vertical"
                        margin={{ left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="feature" type="category" />
                        <Tooltip />
                        <Bar dataKey="importance" fill="#f59e0b" name="LIME Importance" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Cumulative Importance */}
              <Card>
                <CardHeader>
                  <CardTitle>Cumulative Feature Importance</CardTitle>
                  <CardDescription>How many features are needed to explain most of the model's behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getCumulativeImportance()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rank" label={{ value: 'Number of Features', position: 'bottom' }} />
                      <YAxis label={{ value: 'Cumulative Importance (%)', angle: -90, position: 'left' }} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Line type="monotone" dataKey="cumulative_percent" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Feature Importance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Feature Importance</CardTitle>
                  <CardDescription>Statistical significance and confidence intervals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-3 px-2">Rank</th>
                          <th className="text-left py-3 px-2">Feature</th>
                          <th className="text-right py-3 px-2">Importance</th>
                          <th className="text-right py-3 px-2">Std Dev</th>
                          <th className="text-right py-3 px-2">Confidence Interval</th>
                          <th className="text-center py-3 px-2">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.shap_feature_importance.slice(0, 20).map((feature) => (
                          <tr key={feature.feature} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2 font-medium">#{feature.rank}</td>
                            <td className="py-2 px-2">{feature.feature}</td>
                            <td className="text-right py-2 px-2">{feature.importance_percent.toFixed(2)}%</td>
                            <td className="text-right py-2 px-2 text-muted-foreground">±{feature.importance_std.toFixed(4)}</td>
                            <td className="text-right py-2 px-2 text-muted-foreground">
                              [{feature.confidence_interval_low.toFixed(4)}, {feature.confidence_interval_high.toFixed(4)}]
                            </td>
                            <td className="text-center py-2 px-2">
                              {feature.impact_direction === 'positive' && <ArrowUp className="w-4 h-4 text-green-500 inline" />}
                              {feature.impact_direction === 'negative' && <ArrowDown className="w-4 h-4 text-red-500 inline" />}
                              {feature.impact_direction === 'neutral' && <Minus className="w-4 h-4 text-gray-500 inline" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SHAP Explanations Tab */}
            <TabsContent value="shap" className="space-y-6">
              {result.shap_explanations?.map((prediction) => (
                <Card key={prediction.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>SHAP Prediction #{prediction.id}</CardTitle>
                        <CardDescription>Detailed SHAP value breakdown for this prediction</CardDescription>
                      </div>
                      <Badge variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}>
                        Confidence: {(prediction.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted Class</p>
                        <p className="text-2xl font-bold">{prediction.prediction_label}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Base Value</p>
                        <p className="text-2xl font-bold">{prediction.base_value.toFixed(3)}</p>
                        <p className="text-xs">Average prediction across all samples</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Effect</p>
                        <p className={`text-2xl font-bold ${prediction.feature_contributions.net_effect > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {prediction.feature_contributions.net_effect > 0 ? '+' : ''}
                          {prediction.feature_contributions.net_effect.toFixed(3)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">SHAP Feature Contributions</h4>
                      <div className="space-y-3">
                        {prediction.top_features.map((feature) => (
                          <div key={feature.feature} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{feature.feature}</span>
                                <Badge variant="outline" className={getMagnitudeColor(feature.magnitude)}>
                                  {feature.magnitude.toUpperCase()} Impact
                                </Badge>
                              </div>
                              <div className={`flex items-center gap-1 ${feature.shap_value > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {feature.shap_value > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="font-bold">{feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(4)}</span>
                              </div>
                            </div>
                            <Progress value={Math.abs(feature.shap_value) / Math.max(...prediction.top_features.map(f => Math.abs(f.shap_value))) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">{feature.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* LIME Explanations Tab */}
            <TabsContent value="lime" className="space-y-6">
              {result.lime_explanations && result.lime_explanations.length > 0 ? (
                <>
                  {result.lime_explanations.map((explanation) => (
                    <Card key={explanation.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>LIME Prediction #{explanation.id}</CardTitle>
                            <CardDescription>Local interpretable model-agnostic explanation</CardDescription>
                          </div>
                          <Badge variant={explanation.confidence > 0.8 ? 'default' : 'secondary'}>
                            Confidence: {(explanation.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Prediction</p>
                            <p className="text-2xl font-bold">{explanation.prediction}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Actual Value</p>
                            <p className="text-2xl font-bold">{explanation.actual_value ?? 'N/A'}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">LIME Feature Contributions</h4>
                          <div className="space-y-3">
                            {explanation.feature_contributions.map((contrib, idx) => (
                              <div key={idx} className="p-3 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <span className="font-medium">{contrib.feature}</span>
                                    <Badge variant="outline" className={getMagnitudeColor(contrib.magnitude)}>
                                      {contrib.magnitude.toUpperCase()} Impact
                                    </Badge>
                                  </div>
                                  <div className={`font-bold ${contrib.direction === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                                    {contrib.direction === 'positive' ? '+' : ''}{contrib.contribution.toFixed(4)}
                                  </div>
                                </div>
                                <Progress value={Math.abs(contrib.contribution) * 100} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-2">
                                  This feature {contrib.direction === 'positive' ? 'increases' : 'decreases'} the prediction
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SHAP vs LIME Comparison */}
                        {result.shap_explanations && result.shap_explanations[explanation.id - 1] && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
                            <p className="text-sm font-semibold mb-2">🔍 SHAP vs LIME Comparison</p>
                            <p className="text-xs text-muted-foreground">
                              Both methods agree on the top influential features. SHAP provides game-theoretic consistent values,
                              while LIME offers faster local approximations. The consistency between methods increases confidence in explanations.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No LIME Explanations Available</h3>
                    <p className="text-muted-foreground">
                      LIME is not installed on the backend. Install with: <code className="bg-muted px-2 py-1 rounded">pip install lime</code>
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Feature Interactions Tab */}
            <TabsContent value="interactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Correlation Analysis</CardTitle>
                  <CardDescription>Understanding relationships between features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      {result.feature_correlations.slice(0, 15).map((corr, idx) => (
                        <div key={idx} className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{corr.feature1} ↔ {corr.feature2}</span>
                            <span className={Math.abs(corr.correlation) > 0.7 ? 'text-red-500 font-bold' : 'text-muted-foreground'}>
                              r = {corr.correlation.toFixed(3)}
                            </span>
                          </div>
                          <Progress value={Math.abs(corr.correlation) * 100} className={Math.abs(corr.correlation) > 0.7 ? 'bg-red-200' : 'bg-blue-200'} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Alert className="mt-4">
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      High correlations (|r| &gt; 0.7) may indicate redundant features. Consider feature selection to simplify the model.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Validation & Proof Tab */}
            <TabsContent value="validation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance Validation</CardTitle>
                  <CardDescription>Proof of model reliability on the analyzed dataset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {result.validation_metrics.r2_score && (
                      <div className="text-center p-4 bg-green-500/5 rounded-lg">
                        <div className="text-3xl font-bold text-green-500">{(result.validation_metrics.r2_score * 100).toFixed(1)}%</div>
                        <p className="text-sm text-muted-foreground">R² Score</p>
                      </div>
                    )}
                    {result.validation_metrics.accuracy && (
                      <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                        <div className="text-3xl font-bold text-blue-500">{(result.validation_metrics.accuracy * 100).toFixed(1)}%</div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                      </div>
                    )}
                    {result.validation_metrics.mae && (
                      <div className="text-center p-4 bg-yellow-500/5 rounded-lg">
                        <div className="text-3xl font-bold text-yellow-500">{result.validation_metrics.mae.toFixed(3)}</div>
                        <p className="text-sm text-muted-foreground">MAE</p>
                      </div>
                    )}
                    {result.validation_metrics.rmse && (
                      <div className="text-center p-4 bg-purple-500/5 rounded-lg">
                        <div className="text-3xl font-bold text-purple-500">{result.validation_metrics.rmse.toFixed(3)}</div>
                        <p className="text-sm text-muted-foreground">RMSE</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Actionable Recommendations</CardTitle>
                  <CardDescription>Based on the explainability analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Empty State */}
      {!result && !loading && models.length > 0 && datasets.length > 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Ready to Analyze Model Explainability</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a trained model and dataset above to generate SHAP and LIME explanations,
              feature importance rankings, and understand what drives your model's predictions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="p-3 bg-muted/30 rounded-lg">
                <Brain className="w-4 h-4 text-purple-500 mb-2" />
                <p className="text-sm font-medium">SHAP Values</p>
                <p className="text-xs text-muted-foreground">Game-theoretic consistent explanations</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <Zap className="w-4 h-4 text-amber-500 mb-2" />
                <p className="text-sm font-medium">LIME</p>
                <p className="text-xs text-muted-foreground">Local interpretable explanations</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <Target className="w-4 h-4 text-blue-500 mb-2" />
                <p className="text-sm font-medium">Local Explanations</p>
                <p className="text-xs text-muted-foreground">Understand individual predictions</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <BarChart3 className="w-4 h-4 text-green-500 mb-2" />
                <p className="text-sm font-medium">Global Importance</p>
                <p className="text-xs text-muted-foreground">See which features matter most</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
