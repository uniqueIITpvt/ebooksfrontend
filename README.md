# TechUniqueIIT Ebook Store - Architecture Documentation

## Project Overview

A full-stack **Ebook & Audiobook Store** application with:
- **Frontend**: Next.js 16 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **File Storage**: Cloudinary
- **Payment**: Razorpay

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│                    (Next.js 16 + React 19 + TypeScript)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     APP      │  │  COMPONENTS  │  │   SERVICES   │  │    CONFIG    │   │
│  │   (Pages)    │  │    (UI)      │  │    (APIs)    │  │ (Tailwind)   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │                 │          │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐   │
│  │  App Router  │  │   Admin UI   │  │  API Client  │  │    Utils     │   │
│  │    (app/)    │  │  (admin/)    │  │ (services/)  │  │   (lib/)     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                 │
│                         (Express.js Server)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Middleware  │  │     CORS     │  │ Rate Limit   │  │ Compression  │     │
│  │   (Helmet)   │  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE LAYER (Backend)                              │
│                      (Domain-Driven Architecture)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Books    │  │  Audios    │  │   Blogs    │  │    Auth    │             │
│  │  (CRUD)    │  │  (CRUD)    │  │  (CRUD)    │  │ (JWT/Bcrypt│             │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │
│        │               │               │               │                   │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐             │
│  │ Controller │  │ Controller │  │ Controller │  │ Controller │             │
│  ├────────────┤  ├────────────┤  ├────────────┤  ├────────────┤             │
│  │   Routes   │  │   Routes   │  │   Routes   │  │   Routes   │             │
│  ├────────────┤  ├────────────┤  ├────────────┤  ├────────────┤             │
│  │   Model    │  │   Model    │  │   Model    │  │   Model    │             │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘             │
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Orders   │  │  Payments  │  │  Settings  │  │   Upload   │             │
│  │ (Razorpay) │  │ (Razorpay) │  │ (Config)   │  │(Cloudinary)│             │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Mongoose ODM
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                      │
│                          (MongoDB Atlas)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                    MongoDB Collections                           │     │
│   ├──────────────────────────────────────────────────────────────────┤     │
│   │  • books          • users          • orders      • blogs        │     │
│   │  • audiobooks     • categories     • payments     • banners      │     │
│   │  • settings       • subscriptions  • addresses    • freeSummaries│     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### 1. Request Flow (GET Books Example)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  USER    │────▶│  NEXT.JS     │────▶│  API SERVICE │────▶│   EXPRESS    │
│ BROWSER  │     │   PAGE       │     │ (booksApi.ts)│     │   SERVER     │
└──────────┘     └──────────────┘     └──────────────┘     └───────┬──────┘
                                                                  │
                              ┌─────────────────────────────────────┘
                              │
                              ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  USER    │◀────│   REACT      │◀────│   JSON       │◀────│  CONTROLLER  │
│  SEES    │     │  COMPONENT   │     │  RESPONSE    │     │ (bookController│
│  DATA    │     │  (Display)   │     │              │     │ .getAllBooks)│
└──────────┘     └──────────────┘     └──────────────┘     └───────┬──────┘
                                                                    │
                              ┌─────────────────────────────────────┘
                              │
                              ▼
                        ┌──────────────┐     ┌──────────────┐
                        │    MODEL     │────▶│   MongoDB    │
                        │  (Book.js)   │     │  (Database)  │
                        └──────────────┘     └──────────────┘
```

### 2. POST/PUT Flow (Create/Update Book)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  ADMIN   │────▶│  FORM DATA   │────▶│  API SERVICE │────▶│   EXPRESS    │
│ SUBMITS  │     │  + FILES     │     │(createBookWith│     │   SERVER     │
│   FORM   │     │              │     │    Files)    │     │              │
└──────────┘     └──────────────┘     └──────────────┘     └───────┬──────┘
                                                                   │
                              ┌────────────────────────────────────┘
                              │
                              ▼
                        ┌──────────────┐     ┌──────────────┐
                        │   Multer     │────▶│  Cloudinary  │
                        │ (File Upload)│     │  (Storage)   │
                        └──────────────┘     └──────────────┘
                                   │
                                   ▼
                        ┌──────────────┐     ┌──────────────┐
                        │  CONTROLLER  │────▶│    MODEL     │
                        │(createBook)  │     │  .create()   │
                        └──────────────┘     └──────────────┘
```

---

## Module Structure (Backend)

Each module follows this structure:

```
modules/
└── [feature]/
    ├── controllers/          # Request handlers
    │   └── [feature]Controller.js
    ├── models/               # Mongoose schemas
    │   └── [Feature].js
    ├── routes/               # Express routes
    │   └── [feature]Routes.js
    ├── middleware/           # Feature-specific middleware
    ├── services/             # Business logic
    └── scripts/              # Utility scripts
```

### Example: Books Module

```
modules/books/
├── controllers/
│   ├── bookController.js       # Main CRUD operations
│   ├── bookTypeController.js   # Book type management
│   ├── bookHubController.js   # Component type management
│   ├── bookStatusController.js # Status management
│   ├── categoryController.js   # Category CRUD
│   ├── gstController.js        # GST settings
│   └── languageController.js  # Language settings
├── models/
│   ├── Book.js                # Main book schema
│   ├── BookType.js            # Book type schema
│   ├── BookHub.js             # Component type schema
│   ├── BookStatus.js          # Status schema
│   ├── Category.js            # Category schema
│   ├── Gst.js                 # GST schema
│   └── Language.js            # Language schema
├── routes/
│   ├── bookRoutes.js          # Book API routes
│   └── categoryRoutes.js      # Category API routes
└── middleware/
    └── validation.js          # Input validation
```

---

## API Layer (Frontend)

```
services/api/
├── booksApi.ts              # Books CRUD operations
├── audiobooksApi.ts         # Audiobook operations
├── blogsApi.ts              # Blog operations
├── authApi.ts               # Authentication
├── categoriesApi.ts         # Category operations
├── freeSummariesApi.ts      # Free summaries
├── premiumSummariesApi.ts   # Premium summaries
├── trendingBooksApi.ts      # Trending books
├── bookHubsApi.ts           # Book hubs/types
├── bookStatusesApi.ts       # Book statuses
├── bookTypesApi.ts          # Book types
├── languageApi.ts           # Languages
└── gstApi.ts                # GST settings
```

## Component Architecture (Frontend)

```
components/
├── admin/                    # Admin dashboard components
│   ├── AdminLayout.tsx
│   ├── AdminSidebar.tsx
│   └── AdminHeader.tsx
├── auth/                     # Authentication components
│   └── AuthModal.tsx
├── ui/                       # Reusable UI components
│   ├── layout/              # Layout components
│   │   ├── ConditionalLayout.tsx
│   │   ├── MainLayout.tsx
│   │   └── AdminLayout.tsx
│   ├── books/               # Book-related components
│   │   ├── BookCard.tsx
│   │   ├── BookGrid.tsx
│   │   └── BookDetail.tsx
│   ├── sections/            # Page sections
│   │   ├── Hero.tsx
│   │   ├── FeaturedBooks.tsx
│   │   └── Footer.tsx
│   ├── primitives/          # Basic UI elements
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── media/               # Media handling
│       ├── ImageUpload.tsx
│       └── AudioPlayer.tsx
```

## Database Schema (MongoDB)

## Routing Structure

### Frontend Routes (Next.js App Router)

```
app/
├── (admin)/                 # Admin routes (grouped)
│   ├── admin/
│   │   ├── books/
│   │   ├── audiobooks/
│   │   ├── blogs/
│   │   ├── orders/
│   │   ├── users/
│   │   └── settings/
├── (user)/                  # User routes
│   ├── profile/
│   └── orders/
├── books/                   # Public book routes
├── audiobooks/              # Audiobook routes
├── blog/                    # Blog routes
├── checkout/                # Checkout flow
├── login/                   # Authentication
├── signup/
├── subscription/
└── page.tsx                 # Homepage
```

### Backend Routes (Express)

```
/api/v1/
├── /books                   # Book CRUD
│   ├── GET /                # List all books
│   ├── GET /:id             # Get single book
│   ├── POST /               # Create book
│   ├── PUT /:id             # Update book
│   ├── DELETE /:id          # Delete book
│   ├── GET /featured        # Featured books
│   ├── GET /bestsellers     # Bestseller books
│   ├── GET /trending        # Trending books
│   ├── GET /search          # Search books
│   └── POST /:id/rate       # Rate book
├── /audiobooks              # Audiobook operations
├── /blogs                   # Blog CRUD
├── /auth                    # Authentication
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   └── GET /me
├── /categories              # Category operations
├── /orders                  # Order management
├── /payments                # Razorpay integration
├── /subscriptions           # Subscription plans
├── /settings                # Site settings
├── /upload                  # File uploads
└── /addresses               # User addresses
```

## File Upload Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CLIENT  │────▶│   FormData   │────▶│   Multer     │────▶│  Cloudinary  │
│  SELECT  │     │  (multipart) │     │ (middleware) │     │   Upload     │
│   FILE   │     │              │     │              │     │              │
└──────────┘     └──────────────┘     └──────────────┘     └───────┬──────┘
                                                                   │
                              ┌────────────────────────────────────┘
                              │
                              ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  CLIENT  │◀────│   SAVE TO    │◀────│   RETURN     │
│  GETS    │     │   MongoDB    │     │   URL + ID   │
│   URL    │     │              │     │              │
└──────────┘     └──────────────┘     └──────────────┘
```

---

## Environment Configuration

### Client (.env.local)

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

### Server (.env)

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
REDIS_URL=
```

---

## Build & Deployment

### Client Build

```bash
cd client
npm run build        # Next.js production build
# Output: .next/ folder
```

### Server Build

```bash
cd backend
npm start            # Node.js server
# No build step (ES modules)
```

### Vercel Configuration

```json
// vercel.json (client)
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}

// vercel.json (backend)
{
  "version": 2,
  "builds": [
    { "src": "src/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "src/index.js" }
  ]
}
```

---

## Key Technologies Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 | React framework with App Router |
| **Frontend** | TypeScript | Type safety |
| **Frontend** | TailwindCSS | Utility-first styling |
| **Frontend** | Material-UI | Component library |
| **Frontend** | Framer Motion | Animations |
| **Backend** | Express.js | Web server |
| **Backend** | Mongoose | MongoDB ODM |
| **Backend** | JWT | Authentication |
| **Backend** | Cloudinary | File storage |
| **Database** | MongoDB Atlas | NoSQL database |
| **Payment** | Razorpay | Payment gateway |
| **Cache** | Redis | Session & data caching |

---

## Performance Optimizations

1. **Image Optimization**: Next.js Image component with Cloudinary
2. **Code Splitting**: Automatic route-based splitting
3. **Lazy Loading**: Dynamic imports for heavy components
4. **Caching**: Redis for API responses, browser caching for static assets
5. **Compression**: Gzip/Brotli for API responses
6. **Pagination**: All list endpoints paginated
7. **Rate Limiting**: Prevent API abuse

---

## Monitoring & Health Checks

```javascript
// Health check endpoint
GET /health
Response: {
  status: 'healthy',
  services: {
    database: 'connected',
    cloudinary: 'configured'
  },
  timestamp: '2024-01-01T00:00:00Z'
}
```
