# ReBin Pro Cloudflare Worker

A high-performance Cloudflare Worker for image processing and waste classification using AI.

## Features

- **Image Optimization**: Automatic image resizing and compression using OffscreenCanvas
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Caching**: Intelligent caching of policies using Cloudflare KV
- **Analytics**: Comprehensive analytics tracking
- **Security**: Input validation, file type restrictions, and error handling
- **CORS Support**: Full CORS support for web applications

## Technical Improvements

### TypeScript Support

- Added comprehensive type declarations for Web APIs (`OffscreenCanvas`, `createImageBitmap`)
- Updated `tsconfig.json` to include `WebWorker` library
- Created custom type definitions in `types/web-apis.d.ts`

### Security Enhancements

- **File Type Validation**: Strict validation of allowed image types (JPEG, PNG, WebP, GIF)
- **File Size Limits**: Maximum 10MB file size with automatic optimization
- **Zip Code Validation**: US zip code format validation (12345 or 12345-6789)
- **Input Sanitization**: Comprehensive input validation and sanitization
- **Error Handling**: Detailed error messages with proper HTTP status codes

### Performance Optimizations

- **Image Processing**: Efficient image resizing using OffscreenCanvas
- **Resource Management**: Proper cleanup of ImageBitmap resources
- **Caching Strategy**: KV-based caching for policies with TTL
- **Rate Limiting**: Configurable rate limiting per user/IP

### Error Handling

- **Graceful Degradation**: Falls back to original file if optimization fails
- **Detailed Logging**: Comprehensive error logging for debugging
- **User-Friendly Messages**: Clear error messages for different failure scenarios
- **Backend Error Handling**: Proper error propagation from backend services

## API Endpoints

### POST /

Process an image for waste classification.

**Query Parameters:**

- `zip` (optional): US zip code for location-specific policies
- `userId` (optional): User identifier for analytics and rate limiting

**Request Body:**

- `file`: Image file (multipart/form-data)

**Response:**

```json
{
  "items": [
    {
      "label": "plastic bottle",
      "confidence": 0.95
    }
  ],
  "decisions": [
    {
      "label": "plastic bottle",
      "bin": "recycling",
      "explanation": "Plastic bottles are recyclable",
      "eco_tip": "Remove caps before recycling"
    }
  ],
  "zip": "12345",
  "policies": { ... }
}
```

## Environment Variables

- `BACKEND_URL`: URL of the backend inference service
- `POLICIES`: Cloudflare KV namespace for policy caching
- `USER_SESSIONS`: Cloudflare KV namespace for user sessions
- `ANALYTICS`: Cloudflare KV namespace for analytics data
- `RATE_LIMIT`: Cloudflare KV namespace for rate limiting

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Start development server
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Best Practices Implemented

1. **Security**: Input validation, file type restrictions, rate limiting
2. **Performance**: Image optimization, caching, resource management
3. **Reliability**: Comprehensive error handling, graceful degradation
4. **Maintainability**: TypeScript types, clear code structure, documentation
5. **User Experience**: Fast processing, clear error messages, CORS support
