# Mobile API Documentation

## Base URL
```
http://localhost:8080/api/mobile
```

## Authentication Endpoints

### 1. User Registration
**POST** `/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "authMethod": "local",
      "role": "user",
      "isSeller": false
    },
    "token": "jwt_token_here"
  }
}
```

### 2. User Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "authMethod": "local",
      "role": "user",
      "isSeller": false,
      "phone": "1234567890",
      "googleProfile": null
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Google OAuth Login
**POST** `/auth/google`

**Request Body:**
```json
{
  "idToken": "google_id_token",
  "googleId": "google_user_id",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "picture": "profile_picture_url"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "authMethod": "google",
      "role": "user",
      "isSeller": false,
      "phone": null,
      "googleProfile": {
        "picture": "profile_picture_url",
        "locale": "en",
        "verified_email": true
      }
    },
    "token": "jwt_token_here",
    "isNewUser": false
  }
}
```

### 4. Get User Profile
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "1234567890",
      "authMethod": "local",
      "role": "user",
      "isSeller": false,
      "googleProfile": null,
      "addresses": []
    }
  }
}
```

### 5. Update User Profile
**PUT** `/auth/profile`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "gender": "Male"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "1234567890",
      "gender": "Male",
      "authMethod": "local",
      "role": "user",
      "isSeller": false,
      "googleProfile": null
    }
  }
}
```

### 6. Logout
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 7. Refresh Token
**POST** `/auth/refresh`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

## Authentication

For protected endpoints, include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

## Notes

1. JWT tokens expire after 7 days by default
2. All timestamps are in ISO 8601 format
3. Phone numbers should be 10 digits
4. Gender can be: "Male", "Female", or "Prefer not to say"
5. Google OAuth requires proper ID token verification in production 