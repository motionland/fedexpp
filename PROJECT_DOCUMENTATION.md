# FedEx Package Tracking System Documentation

## Project Overview

The FedEx Package Tracking System is a comprehensive web application built with Next.js 14 that enables organizations to track, manage, and monitor FedEx packages with role-based access control, real-time updates, and detailed reporting capabilities.

### Key Features
- **Real-time FedEx package tracking** via official FedEx API integration
- **Role-based access control** (Admin, Manager, User)
- **Image capture and upload** for package documentation
- **Historical reporting** and analytics
- **Team management** with invitation system
- **Progressive Web App (PWA)** capabilities
- **Dashboard analytics** with charts and statistics

## Technology Stack

### Frontend
- **Next.js 14.2.16** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library (Radix UI based)
- **Recharts** - Data visualization
- **Uppy** - File upload handling

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma ORM** - Database management
- **SQLite** - Development database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Infrastructure & Storage
- **MinIO** - Object storage for images
- **Redis** - Caching and session management
- **FedEx API** - Official tracking data source
- **Mailgun** - Email service for notifications

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **ts-node** - TypeScript execution

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │   Dashboard     │  │   Tracking      │  │   Reports     │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │   Middleware    │  │   API Routes    │  │   Pages       │
│  │   (Auth/RBAC)   │  │                │  │              │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │   Prisma ORM    │  │     Redis       │  │    MinIO      │
│  │   (SQLite)      │  │   (Caching)     │  │  (Storage)    │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                  External Services                         │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   FedEx API     │  │    Mailgun      │                  │
│  │   (Tracking)    │  │   (Email)       │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Models

#### Team (Users)
```prisma
model Team {
  id         Int     @id @default(autoincrement())
  name       String
  email      String  @unique
  password   String
  pin        String?
  role       String
  department String
  status     String
  roleId     Int?
  roles      Role?   @relation(fields: [roleId], references: [id], onDelete: Cascade)
}
```

#### Tracking (Main tracking data)
```prisma
model Tracking {
  id                  Int       @id @default(autoincrement())
  kasId               String    // Generated tracking ID
  courier             String?
  trackingNumber      String
  capturedImages      String?
  statusId            Int?
  deliveryDate        DateTime?
  shippingDate        DateTime?
  transitTime         String?
  destination         String?
  origin              String?
  fedexDeliveryStatus String?
  route               String?
  weight              Float?
  lastUpdate          DateTime?
  timestamp           DateTime  @default(now())
  
  status  Status?           @relation(fields: [statusId], references: [id])
  history TrackingHistory[]
  images  Image[]           @relation("TrackingImages")
}
```

#### Role-Based Access Control
```prisma
model Role {
  id          Int          @id @default(autoincrement())
  name        String
  permissions Permission[] @relation("RolePermissions")
  team        Team[]
}

model Permission {
  id          Int    @id @default(autoincrement())
  name        String
  description String
  roles       Role[] @relation("RolePermissions")
}
```

## Authentication & Authorization

### Authentication Flow
1. **Login Process**:
   - User provides email/username and PIN or password
   - Server validates credentials against database
   - JWT token generated with user payload (id, email, role, department)
   - Token stored in HTTP-only cookie (1-hour expiry)
   - User redirected to dashboard

2. **Middleware Protection**:
   - All routes except `/login` and `/register` protected
   - Token validation on each request
   - Role-based route access control
   - Automatic redirect to login if unauthorized

3. **Role Hierarchy**:
   - **Admin**: Full system access, user management, all reports
   - **Manager**: Package tracking, team reports, limited admin functions
   - **User**: Basic package tracking and viewing

### Security Features
- HTTP-only cookies for token storage
- CSRF protection via SameSite cookie policy
- Password hashing with bcryptjs
- JWT token expiration and refresh
- Route-level authorization guards

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/send-verification-code` - Send email verification

### Package Tracking
- `GET /api/fedex-tracking` - Retrieve tracked packages
- `POST /api/fedex-tracking` - Track new package via FedEx API
- `DELETE /api/fedex-tracking` - Remove tracking entry
- `POST /api/fedex-tracking/submit` - Submit tracking with duplicate check
- `POST /api/fedex-tracking/upload` - Upload package images

### Package Management
- `POST /api/fedex-packages` - Save FedEx tracking data to database

### Team Management
- `GET /api/team-members` - List team members
- `POST /api/send-invitation` - Send team invitation email

### System Configuration
- `GET /api/status` - Get available status types
- `GET /api/permissions` - Get user permissions
- `GET /api/role` - Get user roles
- `GET /api/historical-reports` - Get historical data

## FedEx API Integration

### Authentication
```javascript
// OAuth 2.0 flow with client credentials
const authResponse = await fetch(`${FEDEX_API_URL}/oauth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: API_KEY,
    client_secret: SECRET_KEY
  })
});
```

### Tracking Request
```javascript
const trackingResponse = await fetch(`${FEDEX_API_URL}/track/v1/trackingnumbers`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-locale": "en_US",
  },
  body: JSON.stringify({
    trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
    includeDetailedScans: true,
  }),
});
```

### Carrier Detection
Automatic carrier detection based on tracking number patterns:
- **FedEx**: `/(\b96\d{20}\b)|(\b\d{15}\b)|(\b\d{12}\b)/`
- **UPS**: `/(\b1Z[a-zA-Z0-9]{16}\b)/`
- **USPS**: `/(\b(94|93|92|91|94|95|70|14|23|03)\d{20}\b)/`
- **DHL**: `/(\b\d{10}\b)|(\b\d{9}\b)/`

## User Interface Components

### Dashboard Pages
1. **Main Dashboard** (`/dashboard`)
   - Package count statistics
   - Quick tracking form
   - Recent packages list
   - Search functionality

2. **Tracking Management** (`/dashboard/tracking`)
   - Comprehensive tracking list
   - Advanced search and filtering
   - Bulk operations

3. **Reports & Analytics** (`/dashboard/reports`)
   - Delivery performance charts
   - Transit time analysis
   - Status distribution
   - Export capabilities

4. **Historical Reports** (`/dashboard/historical-reports`)
   - Long-term trend analysis
   - Admin/Manager only access

5. **Team Management** (`/dashboard/team`)
   - User management
   - Role assignments
   - Team invitations

6. **Settings** (`/dashboard/settings`)
   - Status type configuration
   - Email settings
   - System preferences

### Key Components

#### TrackingForm
- Package tracking number input
- Status selection dropdown
- Image capture integration
- Duplicate detection
- Real-time validation

#### TrackingList
- Paginated package display
- Status filtering
- Search functionality
- Image gallery
- Action buttons

#### ImageCapture
- Uppy.js integration
- Webcam support
- File upload
- Image editing
- MinIO storage

## File Upload & Storage

### MinIO Configuration
```javascript
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "false",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
```

### Upload Process
1. User captures/selects images via Uppy interface
2. Images converted to blobs and temporarily stored
3. On form submission, images uploaded to MinIO
4. MinIO returns object URLs
5. URLs stored in database with tracking record
6. Presigned URLs generated for secure access

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="file:./prisma/database/develop.sqlite"

# FedEx API
FEDEX_API_URL="https://apis.fedex.com"
NEXT_PUBLIC_FEDEX_API_KEY="your_api_key"
FEDEX_SECRET_KEY="your_secret_key"

# MinIO Storage
MINIO_ENDPOINT="your_minio_endpoint"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="your_access_key"
MINIO_SECRET_KEY="your_secret_key"
MINIO_BUCKET_NAME="fedex-tracking"

# Redis
REDIS_URL="redis://localhost:6379"

# Email (Mailgun)
MAILGUN_API_KEY="your_mailgun_key"
MAILGUN_DOMAIN="your_domain"

# JWT
JWT_SECRET="your_jwt_secret"

# Application
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/bun
- SQLite
- Redis server
- MinIO server

### Installation Steps
```bash
# Clone repository
git clone <repository-url>
cd fedexpp

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

### Database Seeding
```bash
npm run seed
```
This creates default users, roles, and status types.

## Deployment Considerations

### Production Setup
1. **Database**: Migrate from SQLite to PostgreSQL/MySQL
2. **Environment**: Configure production environment variables
3. **Security**: Enable HTTPS, secure cookies, CORS
4. **Monitoring**: Add logging, error tracking, performance monitoring
5. **Backup**: Implement database and file backup strategies

### Performance Optimizations
- Redis caching for FedEx API tokens
- Image optimization and compression
- Database query optimization
- CDN for static assets
- Progressive Web App caching

## Progressive Web App Features

### Capabilities
- **Offline Support**: Service worker for offline functionality
- **App-like Experience**: Installable on mobile devices
- **Push Notifications**: Real-time updates
- **Background Sync**: Sync data when connection restored

### Configuration
```javascript
// next.config.mjs includes PWA setup
// Service worker registered in components/ServiceWorkerRegistration.tsx
```

## Security Best Practices

### Implemented Security Measures
1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Role-based access control
3. **Data Validation**: Zod schema validation
4. **CSRF Protection**: SameSite cookie policy
5. **XSS Prevention**: Input sanitization
6. **API Security**: Rate limiting, request validation

### Security Recommendations
- Regular security audits
- Dependency vulnerability scanning
- API rate limiting
- Input validation and sanitization
- Secure headers configuration
- SSL/TLS enforcement

## Troubleshooting Guide

### Common Issues

#### FedEx API Connection
- Verify API credentials
- Check Redis connection for token caching
- Validate tracking number format
- Monitor API rate limits

#### Database Issues
- Run Prisma migrations: `npx prisma db push`
- Reset database: `npx prisma db reset`
- Check database file permissions

#### Image Upload Problems
- Verify MinIO server connection
- Check bucket permissions
- Validate file size limits
- Monitor storage quota

#### Authentication Issues
- Clear browser cookies
- Check JWT secret configuration
- Verify user roles and permissions
- Reset user passwords

## Future Enhancements

### Planned Features
1. **Multi-carrier Support**: UPS, USPS, DHL integration
2. **Advanced Analytics**: ML-powered insights
3. **Mobile App**: Native iOS/Android applications
4. **API Integration**: Webhook support for external systems
5. **Automation**: Auto-status updates, smart notifications
6. **Reporting**: Custom report builder, scheduled reports

### Technical Improvements
- Microservices architecture migration
- Real-time WebSocket updates
- Advanced caching strategies
- Performance monitoring dashboard
- Automated testing suite
- CI/CD pipeline enhancement

## Support & Maintenance

### Monitoring
- Application logs
- Database performance
- API response times
- User activity tracking
- Error reporting

### Maintenance Tasks
- Regular database backups
- Security updates
- Performance optimization
- Feature updates
- Bug fixes

---

## Contact Information

For technical support or questions about this documentation, please contact the development team.

**Last Updated**: January 2025
**Version**: 1.0
**Author**: Development Team 