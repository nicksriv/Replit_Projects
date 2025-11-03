# YouTube AI LMS Platform

A modern Learning Management System (LMS) built with React, TypeScript, Express, and AI-powered features for course creation and management.

🌐 **Live Demo**: [https://lms.codescribed.com](https://lms.codescribed.com)

## 🚀 Features

### Core Functionality
- **AI-Powered Course Creation**: Generate courses from YouTube videos using OpenAI
- **Interactive Dashboard**: Real-time analytics and performance metrics
- **Course Management**: Create, edit, and manage courses with rich content
- **Student Analytics**: Track learner progress and engagement
- **Revenue Tracking**: Monitor sales, payouts, and financial metrics
- **Live Classes**: Schedule and manage live sessions
- **Feedback & Reviews**: Collect and analyze student feedback

### Technical Features
- **Modern UI**: Built with React 18 and shadcn/ui components
- **Type-Safe**: Full TypeScript implementation
- **Real-time Updates**: WebSocket support for live data
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **API Integration**: RESTful API with Express backend
- **AI Integration**: OpenAI GPT-4 for content generation
- **Cloud Deployment**: Optimized for VPS and Cloudflare

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **OpenAI API** - AI content generation
- **Drizzle ORM** - Database toolkit

### Infrastructure
- **Nginx** - Reverse proxy and web server
- **PM2** - Process manager
- **Let's Encrypt** - SSL certificates
- **Cloudflare** - CDN and DNS
- **VPS (Contabo)** - Hosting

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nicksriv/Replit_Projects.git
cd Replit_Projects
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=5001
HOST=0.0.0.0

# VPS Deployment (Optional)
VPS_HOST=your.server.ip
VPS_PASSWORD=your_password
VPS_DEPLOY_PATH=/apps/youtube-ai
```

### 4. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5001`

### 5. Build for Production

```bash
npm run build
```

This creates optimized production builds in:
- `dist/public/` - Frontend assets
- `dist/` - Backend server

## 🚀 Deployment

### Quick Deployment to VPS

We provide automated deployment scripts for various scenarios:

#### Option 1: Cloudflare Subdomain (Recommended)

```bash
./deploy-cloudflare.sh
```

This script will:
- Build the application
- Upload files to your VPS
- Configure Nginx with SSL
- Restart the application
- Provide Cloudflare DNS setup instructions

**Requirements**:
- VPS credentials in `.env`
- Domain configured in Cloudflare
- Follow the post-deployment DNS instructions

#### Option 2: General Subdomain

```bash
./deploy-subdomain.sh
```

#### Option 3: Direct VPS Deployment

```bash
./deploy-to-vps.sh
```

### Manual Deployment

See detailed guides:
- [CLOUDFLARE_SETUP_GUIDE.md](./CLOUDFLARE_SETUP_GUIDE.md) - Complete Cloudflare setup
- [CLOUDFLARE_QUICK_SETUP.md](./CLOUDFLARE_QUICK_SETUP.md) - Quick reference
- [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) - Deployment checklist

## 📁 Project Structure

```
Replit_Projects/
├── client/                      # Frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── Layout.tsx     # Main layout
│   │   ├── pages/             # Page components
│   │   │   ├── sections/      # Dashboard sections
│   │   │   ├── ChloeMvpDash.tsx
│   │   │   ├── CreateCoursePage.tsx
│   │   │   ├── MyCourses.tsx
│   │   │   └── ...
│   │   ├── lib/               # Utilities
│   │   │   ├── assets.ts      # Asset path helper
│   │   │   ├── queryClient.ts # React Query config
│   │   │   └── utils.ts       # Helper functions
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── public/
│   │   └── figmaAssets/       # Static images and icons
│   └── index.html
│
├── server/                      # Backend application
│   ├── index.ts               # Express server
│   ├── routes.ts              # API routes
│   ├── vite.ts                # Vite middleware
│   ├── openai.ts              # OpenAI integration
│   ├── youtube.ts             # YouTube processing
│   └── storage.ts             # Data storage
│
├── shared/                      # Shared types and schemas
│   ├── types.ts
│   └── schema.ts
│
├── deployment/                  # Deployment utilities
│   └── vps/                   # VPS-specific configs
│
├── deploy-cloudflare.sh        # Cloudflare deployment
├── deploy-subdomain.sh         # Subdomain deployment
├── deploy-to-vps.sh           # Direct VPS deployment
│
├── nginx-cloudflare.conf       # Nginx config for Cloudflare
├── nginx-subdomain.conf        # Nginx config for subdomain
├── nginx-youtube-ai.conf       # General Nginx config
│
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS config
└── package.json               # Dependencies and scripts
```

## 🎯 Key Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | ChloeMvpDash | Main dashboard with analytics |
| `/create-course` | CreateCoursePage | AI-powered course creation |
| `/my-courses` | MyCourses | Course management |
| `/course/:id` | CourseDetailPage | Individual course details |
| `/learner-management` | LearnerManagement | Student analytics |
| `/revenue` | RevenueAndPayouts | Financial tracking |
| `/live-classes` | LiveClassesPage | Live session management |
| `/youtube-knowledge` | YoutubeKnowledgePage | YouTube content processing |
| `/reports` | Reports | Analytics and reports |
| `/settings` | Settings | Application settings |

## 🔌 API Endpoints

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### YouTube Processing
- `POST /api/youtube/process` - Process YouTube video
- `GET /api/youtube/status/:id` - Check processing status

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/revenue` - Revenue data
- `GET /api/analytics/learners` - Learner statistics

### Health Check
- `GET /health` - Server health status

## 🎨 UI Components

The project uses [shadcn/ui](https://ui.shadcn.com/) components:

- **Forms**: Input, Textarea, Select, Checkbox, Radio
- **Data Display**: Table, Card, Badge, Avatar
- **Navigation**: Sidebar, Tabs, Breadcrumb, Dropdown Menu
- **Feedback**: Alert, Toast, Dialog, Progress
- **Layout**: Sheet, Drawer, Separator, Scroll Area
- **Charts**: Line, Bar, Area (via Recharts)

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `PORT` | Server port (default: 5001) | No |
| `HOST` | Server host (default: 0.0.0.0) | No |
| `VPS_HOST` | VPS IP address for deployment | Deployment only |
| `VPS_PASSWORD` | VPS root password | Deployment only |
| `VPS_DEPLOY_PATH` | Deploy path on VPS | Deployment only |

## 🧪 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format
```

## 📦 Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are configured
- [ ] OpenAI API key is valid
- [ ] VPS credentials are in `.env`
- [ ] Domain DNS is configured (for Cloudflare)
- [ ] SSL certificates are set up
- [ ] Build completes without errors
- [ ] All tests pass (if applicable)

## 🐛 Troubleshooting

### Common Issues

**Issue**: DNS_PROBE_FINISHED_NXDOMAIN
- **Solution**: Ensure DNS A record is added in Cloudflare, wait for propagation

**Issue**: Error 521 (Cloudflare)
- **Solution**: Ensure SSL certificate is installed on origin server

**Issue**: Assets not loading
- **Solution**: Check that `getFigmaAsset()` is used for all asset paths

**Issue**: PM2 process not starting
- **Solution**: Check logs with `pm2 logs youtube-ai`

**Issue**: Nginx 502 Bad Gateway
- **Solution**: Ensure server is listening on `0.0.0.0:5001`

See [CLOUDFLARE_SETUP_GUIDE.md](./CLOUDFLARE_SETUP_GUIDE.md) for detailed troubleshooting.

## 🔒 Security

- SSL/TLS encryption via Let's Encrypt
- Cloudflare DDoS protection
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Real IP detection for Cloudflare proxy
- Environment variables for sensitive data
- CORS protection

## 📈 Performance Optimization

- Asset caching (1 day TTL)
- HTTP/2 support
- Gzip compression
- Code splitting with Vite
- React Query caching
- Cloudflare CDN
- Optimized bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👤 Author

**Nikhil Srivastava**
- GitHub: [@nicksriv](https://github.com/nicksriv)

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [OpenAI](https://openai.com/) for AI capabilities
- [Cloudflare](https://www.cloudflare.com/) for CDN and security
- [Let's Encrypt](https://letsencrypt.org/) for free SSL certificates

## 📞 Support

For issues and questions:
1. Check the [troubleshooting guide](./CLOUDFLARE_SETUP_GUIDE.md#troubleshooting)
2. Review [deployment documentation](./DEPLOYMENT_READY.md)
3. Open an issue on GitHub

---

**Live Application**: [https://lms.codescribed.com](https://lms.codescribed.com)

Built with ❤️ using React, TypeScript, and AI
