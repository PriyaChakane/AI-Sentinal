'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadedFile {
  id: number;
  filename: string;
  uploaded_at: string;
}

export function ModelManagement() {
  const router = useRouter();
  const [model, setModel] = useState<File | null>(null);
  const [dataset, setDataset] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [models, setModels] = useState<UploadedFile[]>([]);
  const [datasets, setDatasets] = useState<UploadedFile[]>([]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthenticated(false);
      setError('Please login first');
    } else {
      setIsAuthenticated(true);
      setError('');
      fetchUploads();
    }
  }, []);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  // Fetch uploaded models and datasets
  const fetchUploads = async () => {
    const token = getToken();
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      const [modelsRes, datasetsRes] = await Promise.all([
        fetch('/api/upload/models', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/upload/datasets', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (modelsRes.status === 401 || datasetsRes.status === 401) {
        setError('Session expired. Please login again.');
        setIsAuthenticated(false);
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.models || []);
      }

      if (datasetsRes.ok) {
        const datasetsData = await datasetsRes.json();
        setDatasets(datasetsData.datasets || []);
      }
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
      setError('Failed to fetch uploaded files');
    }
  };

  const uploadFile = async (file: File, type: 'model' | 'dataset') => {
    const token = getToken();
    
    if (!token) {
      setError('Please login first');
      setIsAuthenticated(false);
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch(`/api/upload/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });

      const data = await res.json();

      if (res.status === 401) {
        setError('Session expired. Please login again.');
        setIsAuthenticated(false);
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      setStatus(`${type} uploaded: ${data.filename}`);
      
      // Clear file input
      if (type === 'model') setModel(null);
      if (type === 'dataset') setDataset(null);
      
      // Refresh lists
      await fetchUploads();
      
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>
            Please login first to upload models and datasets.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 grid gap-6 max-w-4xl mx-auto">
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status && (
        <Alert>
          <AlertDescription className="text-green-600">{status}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Model */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input 
              type="file" 
              accept=".pkl,.h5,.pt,.pth,.joblib" 
              onChange={e => setModel(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <Button 
              onClick={() => model && uploadFile(model, 'model')}
              disabled={!model || loading}
              className="w-full"
            >
              {loading ? 'Uploading...' : 'Upload Model'}
            </Button>
            <p className="text-xs text-gray-500">
              Supported: .pkl, .h5, .pt, .pth, .joblib
            </p>
          </CardContent>
        </Card>

        {/* Upload Dataset */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input 
              type="file" 
              accept=".csv,.json,.parquet" 
              onChange={e => setDataset(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
            <Button 
              onClick={() => dataset && uploadFile(dataset, 'dataset')}
              disabled={!dataset || loading}
              className="w-full"
            >
              {loading ? 'Uploading...' : 'Upload Dataset'}
            </Button>
            <p className="text-xs text-gray-500">
              Supported: .csv, .json, .parquet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Models List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Models ({models.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-gray-500 text-sm">No models uploaded yet</p>
          ) : (
            <ul className="space-y-2">
              {models.map(m => (
                <li key={m.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{m.filename}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(m.uploaded_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Datasets List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Datasets ({datasets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <p className="text-gray-500 text-sm">No datasets uploaded yet</p>
          ) : (
            <ul className="space-y-2">
              {datasets.map(d => (
                <li key={d.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{d.filename}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(d.uploaded_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
