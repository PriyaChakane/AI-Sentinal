'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  type: 'login' | 'register';
  onSuccess?: () => void;
}

export function AuthForm({ type, onSuccess }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const isLogin = type === 'login';

  const handleSubmit = async () => {
    setLoading(true);
    setNeedsVerification(false);
    setShowResendButton(false);

    try {
      const res = await fetch(
        `/api/auth/${isLogin ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.needs_verification) {
          setNeedsVerification(true);
          setShowResendButton(true);
        }
        alert(data.error || 'Authentication failed');
        return;
      }

      if (isLogin && data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        onSuccess && onSuccess();
      } else if (!isLogin) {
        alert(data.message || 'Registration successful! Please check your email.');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      alert('Backend not reachable');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await fetch(
        '/api/auth/resend-verification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Verification email resent!');
        setShowResendButton(false);
      } else {
        alert(data.error || 'Failed to resend verification email');
      }
    } catch (err) {
      alert('Backend not reachable');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Login to ML Observe' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Monitor your ML models'
              : 'Start monitoring ML models'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {needsVerification && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800">
              <p className="font-medium">Email not verified!</p>
              <p className="text-sm">
                Please check your inbox for verification email.
              </p>

              {showResendButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleResendVerification}
                >
                  Resend Verification Email
                </Button>
              )}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded border bg-background"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 rounded border bg-background"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </Button>

          {isLogin ? (
            <p className="text-center text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-primary hover:underline"
              >
                Register
              </button>
            </p>
          ) : (
            <p className="text-center text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-primary hover:underline"
              >
                Login
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
