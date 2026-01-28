import { redirect } from 'next/navigation'

export default function SignIn() {
  redirect('/signup?mode=signin')
}
