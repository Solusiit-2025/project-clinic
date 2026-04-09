# Clinic Pro Frontend

Frontend aplikasi Clinic Management System yang dibangun dengan Next.js 14, TypeScript, Tailwind CSS, dan Framer Motion.

## Features

- ✅ Landing Page yang responsif dan profesional
- ✅ Login page dengan form validation
- ✅ Design system dengan Tailwind CSS
- ✅ Animasi smooth dengan Framer Motion
- ✅ Mobile-first responsive design
- ✅ Modern UI/UX patterns
- ✅ Dark mode ready (dapat ditambahkan)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Animations**: Framer Motion
- **Icons**: React Icons
- **State Management**: Zustand (ready to implement)
- **HTTP Client**: Axios (ready to implement)

## Project Structure

```
frontend/
├── app/                      # App router pages
│   ├── page.tsx             # Home page
│   ├── login/               # Login page
│   └── layout.tsx           # Root layout
├── components/
│   ├── shared/              # Shared components
│   │   ├── Header.tsx       # Navigation header
│   │   └── Footer.tsx       # Footer
│   └── home/                # Home page components
│       ├── HeroSection.tsx
│       ├── FeaturesSection.tsx
│       ├── ServicesSection.tsx
│       └── CTASection.tsx
├── lib/                     # Utility functions
├── styles/                  # Global styles
│   └── globals.css
├── public/                  # Static assets
└── tailwind.config.js       # Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm atau yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables (buat `.env.local`):
```bash
cp .env.example .env.local
```

3. Edit `.env.local` dengan konfigurasi Anda:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Clinic Management System
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

Jalankan development server:
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Production Build

```bash
npm run build
npm start
```

## Pages

### 1. Home Page (Landing Page)
- **Path**: `/`
- **Description**: Landing page dengan hero section, features, services, dan CTA
- **Responsive**: ✅ Mobile optimized

### 2. Login Page
- **Path**: `/login`
- **Description**: Professional login form dengan email/password
- **Features**:
  - Password visibility toggle
  - Remember me checkbox
  - Forgot password link
  - Social login buttons (Google, Microsoft)
  - Form validation
  - Loading state

## Components

### Shared Components

#### Header
- Responsive navigation
- Mobile menu (hamburger)
- Logo + branding
- Navigation links
- Login/Register buttons

#### Footer
- Quick links
- Support links
- Contact information
- Social media links
- Copyright

### Home Components

#### HeroSection
- Hero headline dengan gradient
- CTA buttons
- Statistics cards
- Mock dashboard preview
- Smooth animations

#### FeaturesSection
- 6 fitur utama dalam grid
- Icons untuk setiap fitur
- Hover effects
- Responsive grid layout

#### ServicesSection
- 4 layanan utama
- Gradient backgrounds
- Number badges
- Hover animations

#### CTASection
- Call-to-action section
- Trial button
- Contact sales button
- Trust badges

## Styling & Design

### Tailwind Configuration
- Custom colors: primary (blue), secondary (cyan), danger, success, warning
- Extended theme dengan custom utilities
- Responsive breakpoints: sm, md, lg, xl

### Custom CSS Classes

```css
.btn-primary     /* Primary blue button */
.btn-secondary   /* Secondary cyan button */
.btn-outline     /* Outline button */
.container-custom /* Max-width container */
.section-padding /* Standard section padding */
```

### Animations

- `fadeInUp` - Fade in dengan slide up
- `fadeInDown` - Fade in dengan slide down
- Framer Motion components untuk animasi interaktif

## Form Validation

Login form includes:
- Email validation
- Password required
- Show/hide password toggle
- Loading state
- Error messages
- Disabled state during submission

## Responsive Design

- Mobile-first approach
- Breakpoints: 480px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Touch-friendly buttons dan inputs
- Optimized for all screen sizes

## Color Palette

```
Primary: #0ea5e9 (Blue Sky)
Secondary: #06b6d4 (Cyan)
Danger: #ef4444 (Red)
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
```

## Next Steps

1. **Setup Backend Integration**
   - Configure API endpoints in `.env.local`
   - Implement Axios interceptors
   - Setup authentication context

2. **Add More Pages**
   - Dashboard page
   - Patient management pages
   - Appointment pages
   - Settings pages

3. **Additional Features**
   - Dark mode toggle
   - Multi-language support
   - Progressive enhancement
   - Accessibility improvements (a11y)

4. **Performance Optimization**
   - Image optimization
   - Code splitting
   - Route prefetching

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Contributing

Ikuti styling standards:
- Use TypeScript for type safety
- Use Tailwind classes (avoid custom CSS)
- Follow component naming conventions
- Use Framer Motion untuk animasi

## License

MIT
