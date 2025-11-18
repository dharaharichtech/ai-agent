// Validation utilities for form inputs

export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters long'
  }
}

export const validateField = (fieldName, value, rules = validationRules) => {
  const rule = rules[fieldName]
  if (!rule) return ''

  if (rule.required && (!value || value.trim() === '')) {
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
  }

  if (rule.minLength && value && value.length < rule.minLength) {
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.minLength} characters long`
  }

  if (rule.pattern && value && !rule.pattern.test(value)) {
    return rule.message || `Invalid ${fieldName} format`
  }

  return ''
}

export const validateForm = (formData, rules = validationRules) => {
  const errors = {}
  
  Object.keys(formData).forEach(field => {
    if (rules[field]) {
      const error = validateField(field, formData[field], rules)
      if (error) {
        errors[field] = error
      }
    }
  })
  
  return errors
}

// Common validation functions
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return strongPasswordRegex.test(password)
}

export const getPasswordStrength = (password) => {
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[@$!%*?&]/.test(password)) strength++
  
  return strength
}

export const getPasswordStrengthText = (strength) => {
  const strengthTexts = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair', 
    3: 'Good',
    4: 'Strong',
    5: 'Very Strong'
  }
  
  return strengthTexts[strength] || 'Very Weak'
}

export const getPasswordStrengthColor = (strength) => {
  const colors = {
    0: 'text-red-500',
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-green-500',
    5: 'text-green-600'
  }
  
  return colors[strength] || 'text-red-500'
}