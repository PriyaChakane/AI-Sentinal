'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import { AlertCircle, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';

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

interface MissingValue {
  field: string;
  missing_count: number;
  percentage: number;
  required_by_model?: boolean;
}

interface Outlier {
  field: string;
  outlier_count: number;
  percentage: number;
  required_by_model?: boolean;
}

interface DataType {
  field: string;
  type: string;
  required_by_model?: boolean;
}

interface CompatibilityInfo {
  compatible: boolean;
  message: string;
  missing_features: string[];
  expected_features: string[];
  dataset_features: string[];
}

interface QualityResult {
  success: boolean;
  dataset_name: string;
  model_name?: string;
  total_rows: number;
  total_columns: number;
  missing_values: MissingValue[];
  duplicates: {
    count: number;
    percentage: number;
  };
  outliers: Outlier[];
  data_types: DataType[];
  overall_quality_score: number;
  model_compatibility?: CompatibilityInfo;
  special_message?: string;
  achievement_unlocked?: string;
  easter_egg?: string;
}

interface QualityHistory {
  quality_score: number;
  timestamp: string;
  dataset: string;
  model?: string;
}

export function DataQuality() {
  const router = useRouter();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined); // ✅ Changed to undefined
  const [result, setResult] = useState<QualityResult | null>(null);
  const [history, setHistory] = useState<QualityHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  useEffect(() => {
    fetchDatasets();
    fetchModels();
    fetchHistory();
  }, []);

  const fetchDatasets = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/upload/datasets', {
        headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const fetchHistory = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/quality/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const analyzeQuality = async () => {
    if (!selectedDataset) {
      setError('Please select a dataset');
      return;
    }

    setLoading(true);
    setError('');

    const token = getToken();

    try {
      const requestBody: any = {
        dataset_id: parseInt(selectedDataset)
      };

      // ✅ Only add model_id if a model is actually selected
      if (selectedModel) {
        requestBody.model_id = parseInt(selectedModel);
      }

      const res = await fetch('/api/quality/analyze', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Analysis failed');
        return;
      }

      setResult(data);
      fetchHistory(); // Refresh history

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/10';
    if (score >= 70) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Data Quality Monitoring</h1>
        <p className="text-muted-foreground mt-2">Analyze completeness, duplicates, outliers, and model compatibility</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Easter Egg Messages */}
      {result?.special_message && (
        <Alert className="border-purple-500 bg-purple-500/10">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="font-semibold">
            {result.special_message}
            {result.achievement_unlocked && (
              <span className="block mt-1">{result.achievement_unlocked}</span>
            )}
            {result.easter_egg && (
              <span className="block mt-1 text-xs opacity-75">{result.easter_egg}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Dataset & Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Dataset and Model (Optional) for Quality Analysis</CardTitle>
          <CardDescription>Choose a dataset to analyze. Optionally select a model to check compatibility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dataset (Required)</label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(ds => (
                    <SelectItem key={ds.id} value={ds.id.toString()}>
                      {ds.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model (Optional)</label>
              <Select 
                value={selectedModel} 
                onValueChange={(value) => {
                  // ✅ Set to undefined instead of empty string
                  setSelectedModel(value === 'none' ? undefined : value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={analyzeQuality}
            disabled={!selectedDataset || loading}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze Quality'}
          </Button>
        </CardContent>
      </Card>

      {/* Model Compatibility Alert */}
      {result?.model_compatibility && (
        <Alert className={result.model_compatibility.compatible ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
          {result.model_compatibility.compatible ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="font-semibold mb-2">{result.model_compatibility.message}</div>
            {result.model_compatibility.missing_features.length > 0 && (
              <div className="text-sm">
                <p className="font-medium">Missing Features ({result.model_compatibility.missing_features.length}):</p>
                <p className="text-xs opacity-75">{result.model_compatibility.missing_features.join(', ')}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && result.success && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-3xl font-bold mt-2">{result.total_rows.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Columns</p>
                <p className="text-3xl font-bold mt-2">{result.total_columns}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Duplicates</p>
                <p className="text-3xl font-bold mt-2">{result.duplicates.percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.duplicates.count} rows
                </p>
              </CardContent>
            </Card>

            <Card className={getQualityBg(result.overall_quality_score)}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Overall Quality</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className={`text-3xl font-bold ${getQualityColor(result.overall_quality_score)}`}>
                    {result.overall_quality_score}%
                  </p>
                  {result.overall_quality_score >= 90 ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missing Values Chart */}
          {result.missing_values.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Missing Values by Column</CardTitle>
                <CardDescription>Percentage of missing values per field</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={result.missing_values}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="field" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="percentage" 
                      fill="#6366f1"
                      shape={(props: any) => {
                        const { fill, x, y, width, height, payload } = props;
                        const fillColor = payload.required_by_model ? '#ef4444' : fill;
                        return <rect x={x} y={y} width={width} height={height} fill={fillColor} />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
                {result.model_name && (
                  <p className="text-xs text-muted-foreground mt-2">
                    🔴 Red bars indicate features required by the model
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Outliers Chart */}
          {result.outliers && result.outliers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Outliers Detection</CardTitle>
                <CardDescription>Percentage of outliers using IQR method</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={result.outliers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="field" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="percentage" 
                      fill="#ec4899"
                      shape={(props: any) => {
                        const { fill, x, y, width, height, payload } = props;
                        const fillColor = payload.required_by_model ? '#ef4444' : fill;
                        return <rect x={x} y={y} width={width} height={height} fill={fillColor} />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
                {result.model_name && (
                  <p className="text-xs text-muted-foreground mt-2">
                    🔴 Red bars indicate features required by the model
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Missing Values</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.missing_values.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg ${item.required_by_model ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted'}`}
                      >
                        <p className="font-medium flex items-center gap-2">
                          {item.field}
                          {item.required_by_model && <span className="text-xs text-red-500">Required</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.missing_count} missing ({item.percentage}%)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {result.outliers && result.outliers.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Outliers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.outliers.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg ${item.required_by_model ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted'}`}
                        >
                          <p className="font-medium flex items-center gap-2">
                            {item.field}
                            {item.required_by_model && <span className="text-xs text-red-500">Required</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.outlier_count} outliers ({item.percentage}%)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.data_types && result.data_types.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Data Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.data_types.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg ${item.required_by_model ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted'}`}
                        >
                          <p className="font-medium flex items-center gap-2">
                            {item.field}
                            {item.required_by_model && <span className="text-xs text-blue-500">Required</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quality History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Score History</CardTitle>
            <CardDescription>Recent quality analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history.slice(0, 10).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(val) => new Date(val).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Quality Score']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="quality_score" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Quality Score"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* History Table */}
            <div className="mt-4 space-y-2">
              {history.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div>
                    <p className="font-medium">{item.dataset}</p>
                    {item.model && <p className="text-xs text-muted-foreground">Model: {item.model}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getQualityColor(item.quality_score)}`}>
                      {item.quality_score.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
