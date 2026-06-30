import { redirect } from 'next/navigation';

export default function LoginRedirect() {
  redirect('/user/auth?mode=signin');
}
