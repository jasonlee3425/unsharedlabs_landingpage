import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@backend/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionToken } = body

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token is required' },
        { status: 400 }
      )
    }

    const result = await signOut(sessionToken)

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: 400 }
      )
    }

    const response = NextResponse.json(result, { status: 200 })

    // Clear any auth cookies
    response.cookies.delete('sb-access-token')

    return response
  } catch (error: any) {
    console.error('Sign out API error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
