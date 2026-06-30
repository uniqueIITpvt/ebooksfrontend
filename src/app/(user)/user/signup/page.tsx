'use client';

import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/user/auth?mode=signup');
}
