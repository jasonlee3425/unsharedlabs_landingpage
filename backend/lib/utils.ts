/**
 * Shared utility functions for backend operations
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function formatResponse<T>(data: T, success: boolean = true, message?: string) {
  return {
    success,
    data,
    message,
  }
}
