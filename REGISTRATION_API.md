# Registration & Password Reset API Documentation

## New User Registration

### Endpoint: `POST /api/auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@example.com",
  "mobileNumber": "+1234567890",
  "password": "SecurePass123!",
  "company": "Tech Company Inc." // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "userId",
      "firstName": "John",
      "lastName": "Doe",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "mobileNumber": "+1234567890", 
      "company": "Tech Company Inc.",
      "role": "user",
      "isEmailVerified": false
    },
    "token": "jwt_token_here",
    "message": "Registration successful. Please check your email to verify your account."
  },
  "message": "User registered successfully"
}
```

**Validation Rules:**
- First Name: 2-30 characters, letters and spaces only
- Last Name: 2-30 characters, letters and spaces only
- Email: Valid email format, unique in database
- Mobile Number: Valid international format, unique in database
- Password: Min 8 characters with uppercase, lowercase, number, and special character
- Company: Optional, max 100 characters

## Forgot Password

### Endpoint: `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, a password reset email has been sent.",
    "resetToken": "reset_token_here" // Only in development mode
  },
  "message": "Password reset request processed"
}
```

## Reset Password

### Endpoint: `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful"
  },
  "message": "Password reset successful"
}
```

## Email Verification

### Endpoint: `GET /api/auth/verify-email/:token`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  },
  "message": "Email verified successfully"
}
```

## Updated User Model Fields

The User model now includes:
- `firstName` (required)
- `lastName` (required)
- `name` (auto-generated from firstName + lastName)
- `email` (required, unique)
- `mobileNumber` (required, unique)
- `password` (required, hashed)
- `company` (optional)
- `role` (default: "user")
- `isActive` (default: true)
- `isEmailVerified` (default: false)
- `resetPasswordToken`
- `resetPasswordExpires`
- `emailVerificationToken`
- `emailVerificationExpires`
- `loginAttempts` (security feature)
- `lockUntil` (security feature)
- `lastLogin`
- `createdAt`
- `updatedAt`

## Frontend Pages Created

1. **Register Page** (`/register`)
   - Complete registration form with validation
   - Real-time form validation
   - Password strength indicator
   - Auto-redirect to dashboard on success

2. **Forgot Password Page** (`/forgot-password`)
   - Email input with validation
   - Success confirmation screen
   - Link back to login

3. **Reset Password Page** (`/reset-password/:token`)
   - Token validation
   - New password form with confirmation
   - Password strength requirements
   - Success confirmation with auto-redirect

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT authentication
- Account lockout after 5 failed login attempts (2-hour lockout)
- Password reset tokens expire in 10 minutes
- Email verification tokens expire in 24 hours
- Proper error handling without revealing sensitive information
- Input validation and sanitization
- Rate limiting ready (can be added with middleware)

## Database Validation

- Email format validation
- Mobile number format validation
- Password complexity requirements
- Unique constraints on email and mobile number
- Proper indexing for performance

## Testing the API

You can test the registration endpoint with curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com", 
    "mobileNumber": "+1234567890",
    "password": "SecurePass123!",
    "company": "Test Company"
  }'
```