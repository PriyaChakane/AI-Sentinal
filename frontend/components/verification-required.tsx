'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VerificationRequiredProps {
  email: string;
  onResendVerification: () => void;
  onCancel?: () => void;
}

export function VerificationRequired({ 
  email, 
  onResendVerification, 
  onCancel 
}: VerificationRequiredProps) {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    
    try {
      const res = await fetch('http://localhost:8000/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message || 'Verification email sent!');
        onResendVerification();
      } else {
        setMessage(data.error || 'Failed to resend verification email');
      }
    } catch (err) {
      setMessage('Backend not reachable');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-yellow-600">
            Email Verification Required
          </CardTitle>
          <CardDescription>
            Please verify your email address to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-6 h-6 text-yellow-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-lg">{email}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please check your inbox and click the verification link.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleResend} 
              disabled={isResending}
              className="w-full"
              variant="outline"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            
            {onCancel && (
              <Button 
                onClick={onCancel} 
                variant="ghost" 
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            <p>Didn't receive the email?</p>
            <ul className="mt-1 space-y-1">
              <li>• Check your spam folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}