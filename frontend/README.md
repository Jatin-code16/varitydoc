# DocVault - Frontend Application

Enterprise-grade React frontend for the DocVault document verification system with real-time security features.

## 🏗️ Built With

- **React 19** - Latest React with concurrent features
- **Vite** - Next-generation frontend tooling
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client with interceptors

## 🎨 Key Features

### Enterprise UI Components

1. **AlertPanel** - Real-time security notification center
   - Filter by severity (all/unread/critical)
   - Mark as read/unread functionality
   - Auto-refresh every 30 seconds when open
   - Delete individual or all alerts

2. **RoleBadge** - Visual role indicator with permissions
   - Color-coded roles (admin, owner, auditor, guest)
   - Hover tooltip showing permissions
   - Icon-based role identification

3. **Enhanced Registration/Verification**
   - Digital signature display with metadata
   - Signature verification status indicators
   - Real-time alert creation on operations

### Design System

- **Glassmorphism**: Modern glass-effect UI elements
- **Responsive**: Mobile-first design with breakpoints
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: ARIA labels and keyboard navigation

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AlertPanel.jsx      # Real-time alerts UI (335 lines)
│   │   ├── RoleBadge.jsx        # Role display component (96 lines)
│   │   ├── Login.jsx            # Authentication form
│   │   ├── Register.jsx         # Document registration with signatures
│   │   ├── Verify.jsx           # Document verification with status
│   │   └── AuditLogs.jsx        # Activity history viewer
│   ├── api/
│   │   └── client.js            # Axios instance with auth interceptors
│   ├── App.jsx                  # Main application shell
│   ├── App.css                  # 600+ lines of custom styles
│   └── main.jsx                 # React entry point
├── public/                      # Static assets
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
└── tailwind.config.cjs         # Tailwind customization
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Backend API running on port 8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🔧 Development

### Key Scripts

- `npm run dev` - Start dev server with HMR (port 5173)
- `npm run build` - Production build with minification
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

### Code Style

- ESLint configured with React hooks rules
- Prettier for code formatting (recommended)
- Component naming: PascalCase
- File naming: PascalCase for components

## 🎯 Component Usage

### AlertPanel

```jsx
<AlertPanel 
  isOpen={alertPanelOpen}
  onClose={() => setAlertPanelOpen(false)}
  onNotify={(msg, type) => showToast(msg, type)}
/>
```

### RoleBadge

```jsx
<RoleBadge 
  role="admin"
  permissions={['manage_users', 'view_alerts', 'register_documents']}
/>
```

### API Client

```javascript
import api from './api/client';

// Automatically includes JWT token from localStorage
const response = await api.get('/alerts');
```

## 📦 Build Configuration

### Vite Optimization

- **Code Splitting**: Automatic chunk splitting
- **Tree Shaking**: Dead code elimination
- **Asset Optimization**: Image compression and lazy loading
- **CSS Purging**: TailwindCSS purges unused styles

### Docker Build

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

## 🧪 Testing

```bash
# Run linter
npm run lint

# Test build locally
npm run build && npm run preview
```

## 📚 API Integration

### Authenticated Endpoints

All requests automatically include JWT token when available:

```javascript
// Login - stores token
await api.post('/login', { username, password });

// Subsequent requests auto-include token
await api.get('/me');
await api.get('/alerts');
```

### Polling Strategy

- **User info**: Refresh every 60 seconds
- **Unread alerts**: Refresh every 60 seconds (background)
- **Alert panel**: Refresh every 30 seconds (when open)

## 🎨 Styling Guide

### Custom CSS Classes

Key classes in `App.css`:

- `.alertBellBtn` - Alert bell button with badge
- `.alertPanel` - Slide-in panel overlay
- `.alertItem-*` - Alert cards by severity
- `.roleBadge` - Role indicator with tooltip
- `.glassmorphism` - Glass effect backgrounds

### TailwindCSS Customization

Extended colors, fonts, and animations in `tailwind.config.cjs`.

## 🔍 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Change port in vite.config.js or use flag
npm run dev -- --port 3000
```

**API connection refused**
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS settings in backend
```

**Build errors**
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## 📄 License

MIT License - See main project README

## 🔗 Related Documentation

- Main Project: [../README.md](../README.md)
- Backend API: [../backend/](../backend/)
- Deployment Guide: See main README deployment section

---

Built with React 19 + Vite + TailwindCSS
