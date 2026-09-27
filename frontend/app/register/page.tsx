'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthForm
      type="register"
      onSuccess={() => router.push('/login')}
    />
  );
}
