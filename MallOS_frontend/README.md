# Mall OS Frontend

A complete Angular 18+ MVP for Mall OS, a B2B mall management platform targeting MENA.

## Features

- **Authentication**: Login with role-based access (Super Admin, Mall Manager)
- **Admin Dashboard**: Manage malls, users, and view platform statistics
- **Manager Dashboard**: Manage stores, assistants, permissions, and profile
- **Design System**: Modern dark theme with animated gradients, SCSS tokens, and responsive design
- **UI Components**: PrimeNG 17+ with custom styling, shared components, and skeleton loaders
- **State Management**: RxJS BehaviorSubject for reactive state
- **Routing**: Lazy-loaded routes with guards (auth, admin, manager)
- **Demo Data**: Hardcoded demo data for development and testing

## Tech Stack

- **Framework**: Angular 18+ (standalone components)
- **UI Library**: PrimeNG 17+, PrimeIcons, PrimeFlex
- **Styling**: SCSS with CSS custom properties
- **Icons**: Phosphor Icons
- **Fonts**: Space Grotesk, Inter, JetBrains Mono (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/`.

### Build

```bash
ng build
```

## Demo Credentials

### Super Admin
- Email: `admin@mallas.com`
- Password: `Admin@123`

### Mall Manager
- Email: `manager@mallas.com`
- Password: `Manager@123`

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # Data models
│   │   ├── services/        # Core services with demo data
│   │   ├── guards/          # Route guards
│   │   └── interceptors/    # HTTP interceptors
│   ├── features/
│   │   ├── auth/            # Login page
│   │   ├── admin/           # Admin features
│   │   └── manager/         # Manager features
│   ├── shared/
│   │   ├── components/      # Reusable components
│   │   └── pipes/           # Custom pipes
│   ├── layout/              # Layout components
│   ├── app.config.ts
│   ├── app.component.ts
│   └── app.routes.ts
├── styles/
│   ├── _tokens.scss
│   ├── _typography.scss
│   ├── _components.scss
│   ├── _animations.scss
│   └── styles.scss
└── index.html
```

## Design System

The application uses a modern dark theme with:
- CSS custom properties for colors, spacing, and typography
- Animated gradient borders on cards
- Smooth transitions and animations
- Responsive design for all screen sizes

## License

MIT
