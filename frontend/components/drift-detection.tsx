'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface Dataset {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface DriftResult {
  feature_name: string;
  drift_score: number;
  drift_detected: boolean;
  ks_statistic: number;
  ks_p_value: number;
  psi_score: number;
  reference_stats: any;
  current_stats: any;
  mean_change_percent: number;
}

interface DriftHistory {
  [feature: string]: Array<{
    drift_score: number;
    timestamp: string;
  }>;
}

export function DriftDetection() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [referenceDataset, setReferenceDataset] = useState<string>('');
  const [currentDataset, setCurrentDataset] = useState<string>('');
  const [driftResults, setDriftResults] = useState<DriftResult[]>([]);
  const [driftHistory, setDriftHistory] = useState<DriftHistory>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const getToken = () => localStorage.getItem('access_token');

  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
    fetchDriftHistory();
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

  const fetchDriftHistory = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/drift/history?days=7', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDriftHistory(data.history || {});
      }
    } catch (err) {
      console.error('Failed to fetch drift history:', err);
    }
  };

  const analyzeDrift = async () => {
    if (!referenceDataset || !currentDataset) {
      setError('Please select both reference and current datasets');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisComplete(false);

    const token = getToken();

    try {
      const res = await fetch('/api/drift/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference_dataset_id: parseInt(referenceDataset),
          current_dataset_id: parseInt(currentDataset)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Drift analysis failed');
        return;
      }

      setDriftResults(data.drift_results || []);
      setAnalysisComplete(true);
      fetchDriftHistory(); // Refresh history

    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDriftStatus = (score: number) => {
    if (score > 0.2) return { text: 'High', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (score > 0.1) return { text: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { text: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Data Drift Detection</h1>
        <p className="text-muted-foreground mt-2">Analyze statistical drift between datasets</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dataset Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Datasets for Drift Analysis</CardTitle>
          <CardDescription>Choose a reference (baseline) dataset and a current dataset to compare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reference Dataset (Baseline)</label>
              <Select value={referenceDataset} onValueChange={setReferenceDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reference dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(dataset => (
                    <SelectItem key={dataset.id} value={dataset.id.toString()}>
                      {dataset.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Dataset</label>
              <Select value={currentDataset} onValueChange={setCurrentDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select current dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(dataset => (
                    <SelectItem key={dataset.id} value={dataset.id.toString()}>
                      {dataset.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={analyzeDrift} 
            disabled={loading || !referenceDataset || !currentDataset}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze Drift'}
          </Button>
        </CardContent>
      </Card>

      {/* Drift Results */}
      {analysisComplete && driftResults.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Features</p>
                <p className="text-3xl font-bold mt-2">{driftResults.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Features with Drift</p>
                <p className="text-3xl font-bold mt-2 text-red-500">
                  {driftResults.filter(r => r.drift_detected).length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Drift Score</p>
                <p className="text-3xl font-bold mt-2">
                  {(driftResults.reduce((sum, r) => sum + r.drift_score, 0) / driftResults.length).toFixed(3)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Drift Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Drift Scores by Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={driftResults}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="drift_score" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Drift Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driftResults.map((result, idx) => {
                  const status = getDriftStatus(result.drift_score);
                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${status.bg}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{result.feature_name}</h3>
                            {result.drift_detected ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Drift Score (PSI)</p>
                              <p className="font-semibold">{result.psi_score?.toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">KS Statistic</p>
                              <p className="font-semibold">{result.ks_statistic?.toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">P-Value</p>
                              <p className="font-semibold">{result.ks_p_value?.toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Mean Change</p>
                              <div className="flex items-center gap-1">
                                {result.mean_change_percent > 0 ? (
                                  <TrendingUp className="w-4 h-4 text-red-500" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-green-500" />
                                )}
                                <p className="font-semibold">{result.mean_change_percent.toFixed(2)}%</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Reference Stats</p>
                              <p>Mean: {result.reference_stats.mean.toFixed(2)}</p>
                              <p>Std: {result.reference_stats.std.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Current Stats</p>
                              <p>Mean: {result.current_stats.mean.toFixed(2)}</p>
                              <p>Std: {result.current_stats.std.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        <div className={`px-3 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Drift History */}
      {Object.keys(driftHistory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Drift History (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(driftHistory).slice(0, 5).map(([feature, history]) => (
              <div key={feature} className="mb-6">
                <h4 className="font-semibold mb-2">{feature}</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(val) => new Date(val).toLocaleString()} />
                    <Line type="monotone" dataKey="drift_score" stroke="#6366f1" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
