import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@backend/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, companyName } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Call the auth service
    const result = await signUp({ email, password, companyName })

    if (!result.success) {
      // Log the error for debugging
      console.error('Signup failed:', {
        email,
        error: result.error,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json(
        result,
        { status: 400 }
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Sign up API error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
