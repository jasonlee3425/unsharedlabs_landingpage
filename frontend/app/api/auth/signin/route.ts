import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@backend/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Call the auth service
    const result = await signIn({ email, password })

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: 401 }
      )
    }

    // Set HTTP-only cookie with session token (optional, for better security)
    // For now, we'll return the session token in the response
    // The client will handle storing it
    const response = NextResponse.json(result, { status: 200 })

    // Optionally set a cookie (uncomment if you want to use cookies)
    // if (result.session) {
    //   response.cookies.set('sb-access-token', result.session.access_token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     sameSite: 'lax',
    //     maxAge: 60 * 60 * 24 * 7, // 7 days
    //   })
    // }

    return response
  } catch (error: any) {
    console.error('Sign in API error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
