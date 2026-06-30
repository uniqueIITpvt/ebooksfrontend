import { redirect } from 'next/navigation';

export default function SignupRedirect() {
  redirect('/user/auth?mode=signup');
}
