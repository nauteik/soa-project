
## frontend project structure
> ENSURE USING SYNTAX, COMPONENT OF MUI version 7.x.x
├── src/
│   ├── assets/            # Static assets processed by Vite (images, fonts)
│   │   └── images/
│   │   └── logo.png
│   ├── components/        # Reusable UI components (.tsx)
│   │   ├── common/        # Very general components (Button, Modal, Loader)
│   │   │   ├── Button.tsx
│   │   │   └── ...
│   │   ├── layout/        # Layout structure (Header, Footer, MainLayout)
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   └── product/       # Product-specific reusable components (ProductCard, PriceDisplay)
│   │       ├── ProductCard.tsx
│   │       └── ...
│   ├── config/            # Project configuration files (.ts)
│   │   └── api.ts         # Base API URLs, constants (typed)
│   ├── context/           # (Optional) Simple State Management via React Context (.tsx)
│   │   ├── CartContext.tsx
│   │   └── AuthContext.tsx # If you have user accounts
│   ├── hooks/             # Custom React Hooks (.ts)
│   │   └── useApi.ts      # Example hook for data fetching logic (typed)
│   ├── pages/             # Page-level components (.tsx)
│   │   ├── HomePage.tsx
│   │   ├── ProductListPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/          # API interaction layer (.ts)
│   │   ├── productsApi.ts # Functions to fetch/manage product data (typed returns/params)
│   │   ├── authApi.ts     # Functions for login/register (if needed)
│   │   └── ordersApi.ts   # Functions for placing orders (if needed)
│   ├── styles/            # Global styles & MUI theme configuration
│   │   ├── theme.ts       # MUI theme definition/customization (typed)
│   │   └── index.css      # Main CSS entry (includes Tailwind directives)
│   ├── types/             # (Optional but Recommended) Centralized TypeScript types/interfaces
│   │   ├── product.ts     # Interface/Type for Product data
│   │   ├── user.ts        # Interface/Type for User data
│   │   └── api.ts         # Common API response types, etc.
│   ├── utils/             # Utility functions (.ts)
│   │   ├── formatters.ts  # Typed utility functions
│   │   └── helpers.ts
│   ├── App.tsx            # Main application component (routing setup, providers)
│   └── main.tsx           # Application entry point (renders App)Add prompt contents...

## backend project structure
├── alembic/              # Alembic migration scripts
│   ├── versions/
│   └── env.py
│   └── script.py.mako
├── app/                  # Main application code
│   ├── api/              # API Routers / Endpoints
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   └── products.py # Product related endpoints
│   │       └── api.py      # Combine v1 routers
│   ├── core/             # Configuration, settings
│   │   └── config.py
│   ├── crud/             # Database interaction functions (Create, Read, Update, Delete)
│   │   └── crud_product.py
│   ├── db/               # Database session management, base models
│   │   ├── base.py       # Base model and metadata
│   │   └── session.py    # Engine and session setup
│   ├── models/           # Database table models (SQLModel)
│   │   └── product.py
│   ├── schemas/          # Pydantic schemas for API request/response (often derived from models)
│   │   └── product.py
│   └── main.py           # FastAPI app instance creation, middleware
├── .env                  # Environment variables (DATABASE_URL, etc.) - IMPORTANT: Add to .gitignore
├── .gitignore
├── alembic.ini           # Alembic configuration
├── requirements.txt      # Project dependencies
└── README.md             # Project instructions