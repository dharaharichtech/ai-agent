const { body, param, query } = require('express-validator')

const authValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('companyName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    body('phone')
      .optional()
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits')
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],

  verifyOTP: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be a 6-digit number')
  ],

  resetPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be a 6-digit number'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .optional()
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits'),
    body('companyName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters')
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
  ],

  updateVapiApiKey: [
    body('vapiApiKey')
      .trim()
      .notEmpty()
      .withMessage('Vapi API key is required')
      .isLength({ min: 10 })
      .withMessage('Vapi API key must be at least 10 characters')
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('Invalid Vapi API key format')
  ]
}

const leadValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    body('status')
      .optional()
      .isIn(['new', 'contacted', 'qualified', 'closed'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid lead ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .optional()
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    body('status')
      .optional()
      .isIn(['new', 'contacted', 'qualified', 'closed'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  
  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid lead ID')
  ],
  
  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid lead ID')
  ]
}

const aiValidation = {
  makeCall: [
    body('leadId')
      .isMongoId()
      .withMessage('Invalid lead ID'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters')
  ],
  
  getCallById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid call ID')
  ]
}

const pdfValidation = {
  getPDFById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid PDF ID')
  ],
  
  deletePDF: [
    param('id')
      .isMongoId()
      .withMessage('Invalid PDF ID')
  ]
}

module.exports = {
  authValidation,
  leadValidation,
  aiValidation,
  pdfValidation
}