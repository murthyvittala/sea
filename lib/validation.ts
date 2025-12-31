// Form validation utilities

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

export const validators = {
  required: (message: string = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    },
    message,
  }),

  email: (message: string = 'Invalid email address'): ValidationRule => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message,
  }),

  url: (message: string = 'Invalid URL'): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  pattern: (regex: RegExp, message: string = 'Invalid format'): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  minValue: (min: number, message?: string): ValidationRule => ({
    validate: (value: number) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  maxValue: (max: number, message?: string): ValidationRule => ({
    validate: (value: number) => value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  match: (compareValue: any, message: string = 'Values do not match'): ValidationRule => ({
    validate: (value: any) => value === compareValue,
    message,
  }),
}

export function validateField(value: any, rules: ValidationRule[]): string[] {
  const errors: string[] = []

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message)
    }
  }

  return errors
}

export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: Record<keyof T, ValidationRule[]>
): Record<keyof T, string[]> {
  const errors: Record<keyof T, string[]> = {} as any

  for (const key in rules) {
    errors[key] = validateField(values[key], rules[key])
  }

  return errors
}

export function hasErrors(errors: Record<string, any>): boolean {
  return Object.values(errors).some((error) => {
    if (Array.isArray(error)) return error.length > 0
    if (typeof error === 'object') return hasErrors(error)
    return !!error
  })
}