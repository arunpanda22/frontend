# PacePivot Frontend

A modern Next.js application for AI-powered Amazon ecommerce optimization and analytics.

## 🌟 Features

### Content Generation
- **Listing Generator**: Create optimized product listings for better visibility and conversion

### Catalog Analysis
- **SQP Analysis**: Analyze search query performance data
- **Cerebro Analysis**: Advanced keyword research and analysis tool

### Bulk File Management
- **Bulk File Optimizer**: Optimize your Sponsored Products campaigns efficiently
- **N-gram Analysis**: Analyze keyword performance using n-gram techniques
- **Topical Analysis**: Advanced topic and trend analysis for your campaigns

### Amazon Integration
- **Advertising Management**: Connect and manage Amazon Advertising accounts
- **Seller Central Integration**: Seamless integration with Amazon Seller Central
- **Multi-Region Support**: Support for multiple Amazon marketplaces

## 🚀 Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state
- **Authentication**: Firebase Authentication
- **API Integration**: Axios with retry capability
- **UI Components**: 
  - Radix UI primitives
  - Heroicons
  - Lucide React icons
- **Development Tools**:
  - ESLint
  - TypeScript
  - Prettier

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20.x or later
- npm or yarn package manager
- Git

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_BACKEND_URL=your_backend_url
```

## 🚀 Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   │   ├── amazon/         # Amazon-specific components
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout components
│   │   ├── shared/         # Shared utility components
│   │   └── ui/             # UI component library
│   ├── lib/                # Utility functions and configurations
│   │   ├── api/           # API service layer
│   │   ├── context/       # React context providers
│   │   └── hooks/         # Custom React hooks
│   └── styles/            # Global styles and Tailwind config
├── public/                # Static assets
└── package.json          # Project dependencies and scripts
```

### Detailed Directory Structure

#### 📂 src/app/
Next.js 14 App Router directory containing all pages and routing logic.
- **(auth)/** - Authentication-related pages
  - `forgot-password/` - Password recovery flow
  - `login/` - User login page
  - `signup/` - New user registration
- **amazon/**
  - `advertising/` - Amazon Advertising API integration
  - `seller/` - Seller Central integration
- **api/** - API route handlers
  - `amazon/` - Amazon-specific endpoints
  - `auth/` - Authentication endpoints
  - `connectivity-test/` - API health checks
  - `v1/` - Version 1 API endpoints
- **dashboard/** - Main user dashboard
- **lister/** - Product listing generator
- **cerebro/** - Cerebro analysis tool
- **ngram/** - N-gram analysis tool
- **sp/** - Sponsored Products optimization
- **sqp/** - Search Query Performance analysis
- **topical/** - Topical analysis tool
- **support/** - Help and support pages
- `layout.tsx` - Root layout component
- `page.tsx` - Homepage component
- `error.tsx` - Global error handling
- `loading.tsx` - Loading states
- `globals.css` - Global styles

#### 📂 src/components/
Reusable React components organized by feature and functionality.
- **amazon/**
  - `AdvertisingAccounts.tsx` - Account management
  - `AmazonConnector.tsx` - Amazon API connection
  - `ProfileSelector.tsx` - Profile selection
  - `RegionDialog.tsx` - Region selection
- **auth/**
  - `protected-route.tsx` - Route protection HOC
  - `ProtectedRoute.tsx` - Route protection component
- **cerebro/** - Cerebro analysis components
- **layout/**
  - `footer.tsx` - Global footer
  - `navbar.tsx` - Navigation bar
- **ngram/** - N-gram analysis components
- **pricing/** - Pricing-related components
- **shared/** - Shared utility components
- **sp/** - Sponsored Products components
  - `AdOptimizerCard.tsx` - Ad optimization interface
  - `BulkFileUploader.tsx` - File upload handling
  - `ProcessingIndicator.tsx` - Progress indicators
- **topical/** - Topical analysis components
- **ui/** - Core UI components library
  - `button.tsx` - Button components
  - `card.tsx` - Card components
  - `dialog.tsx` - Dialog/Modal components
  - `input.tsx` - Form inputs
  - `table.tsx` - Table components
  - And more reusable UI components

#### 📂 src/lib/
Core utilities, services, and business logic.
- **api/**
  - `config.ts` - API configuration
  - `services/` - Service layer implementations
  - `types.ts` - TypeScript interfaces
  - `utils.ts` - API utilities
- **context/**
  - `AuthContext.tsx` - Authentication context
- **hooks/**
  - `queries/` - React Query hooks
    - `use-amazon-advertising.ts`
    - `use-amazon-seller.ts`
    - `use-cerebro.ts`
    - And other feature-specific hooks
- **providers/**
  - `providers.tsx` - Global providers
  - `query-provider.tsx` - React Query provider
- **services/**
  - `api.ts` - Core API service
  - `auth.ts` - Authentication service
- **utils/**
  - `error-handler.ts` - Error handling utilities
- `firebase.ts` - Firebase configuration
- `utils.ts` - General utilities

#### 📂 public/
Static assets and resources.
- `logo.jpg` - Application logo
- `globe.svg` - Global icons
- `file.svg` - File-related icons
- And other static assets

### Key Files
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - UI components configuration
- `package.json` - Project dependencies and scripts
- `.env.local` - Environment variables (not in repo)

## 🔄 Application Flow

### Authentication Flow
1. **Initial Load**
   - Application starts with `RootLayout` (`src/app/layout.tsx`)
   - `Providers` wrap the application with necessary contexts:
     - `ErrorBoundary` for error handling
     - `QueryProvider` for React Query
     - `AuthProvider` for authentication state
     - `ToastProvider` for notifications

2. **Authentication State**
   - `AuthContext` (`src/lib/context/AuthContext.tsx`) manages authentication state
   - Uses Firebase Authentication
   - Provides:
     - Current user state
     - Loading state
     - Error handling
     - Sign-out functionality

3. **Protected Routes**
   - Protected by `ProtectedRoute` component
   - Automatically redirects to login if not authenticated
   - Shows loading state during authentication check

### Navigation Flow
1. **Main Navigation**
   - Managed by `Navbar` component
   - Responsive design with mobile support
   - Dynamic navigation based on authentication state
   - Tool categories:
     - Content Generation
     - Catalog Analysis
     - Bulk File Management
     - Advertising Tools

2. **User Journey**
   ```
   Login/Signup → Dashboard → Tool Selection → Tool Usage
   ```

### Feature Flows

1. **Amazon Integration Flow**
   ```
   Connect Amazon Account → Select Region → Choose Profile → Access Tools
   ```
   - Supports both Advertising and Seller Central
   - Region-specific configurations
   - Profile management

2. **Analysis Tools Flow**
   ```
   Upload File → Configure Parameters → Process → View Results → Download
   ```
   - Common pattern across:
     - N-gram Analysis
     - Topical Analysis
     - SQP Analysis
     - Cerebro Analysis

3. **Bulk File Optimization Flow**
   ```
   Upload Bulk File → Set Target ACOS → Process → Review Changes → Download
   ```
   - Supports multiple campaign types
   - Real-time processing status
   - Preview capabilities

### Data Flow
1. **API Integration**
   - Centralized API client configuration
   - Request/response interceptors
   - Error handling middleware
   - Retry mechanisms for failed requests

2. **State Management**
   - React Query for server state
   - Context API for global state
   - Local state for component-specific data

3. **File Processing**
   ```
   Client → File Upload → Backend Processing → Results → Client Display
   ```
   - Progress tracking
   - Chunked uploads for large files
   - Error recovery

### Error Handling Flow
1. **Global Error Boundary**
   - Catches unhandled errors
   - Provides fallback UI
   - Error reporting capabilities

2. **API Error Handling**
   - HTTP error interceptors
   - Custom error messages
   - Retry mechanisms

3. **Form Validation**
   - Client-side validation
   - Server-side validation



## 🔒 Authentication

The application uses Firebase Authentication for user management. Users can:
- Sign up with email/password
- Log in with existing credentials
- Reset password
- Manage their profile

## 🔌 API Integration

The application integrates with:
- Amazon Advertising API
- Amazon Seller Central API
- Custom backend services

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Dark mode support
- Error handling with user-friendly messages

## 🚀 Deployment

The application is configured for deployment on various platforms:

### Vercel (Recommended)
```bash
npm run build
# or
yarn build
```

### Azure Web App
The repository includes GitHub Actions workflow for automated deployment to Azure Web App.

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support, please contact our support team or raise an issue in the repository.
