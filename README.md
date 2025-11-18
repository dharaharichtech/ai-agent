# 🤖 AI Agent Full-Stack Application

A comprehensive full-stack AI Agent system built with React 19, Node.js, and MongoDB. Features user authentication, lead management, PDF uploads, and AI-powered calling via Bolna.ai.

## 🚀 Tech Stack

### Frontend
- **React 19** with Vite
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** authentication
- **Multer** for file uploads
- **Bolna.ai** integration

## 📁 Project Structure

```
ai-agent-app/
├── client/          # React frontend
│   ├── src/
│   │   ├── api/           # API services
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # Redux store & slices
│   │   └── routes/        # Route protection
│   └── package.json
├── server/          # Node.js backend
│   ├── src/
│   │   ├── config/        # Database config
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # MongoDB models
│   │   ├── repositories/  # Data access layer
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   └── package.json
└── package.json     # Root package.json
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Bolna.ai API key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd ai-agent-app
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Environment Variables

#### Server (.env in server/)
```env
PORT=8081
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/fullstack-ai-agent
JWT_SECRET=your-super-secret-jwt-key
BOLNA_API_KEY=your-bolna-api-key
BOLNA_AGENT_ID=2632f810-8d83-4296-a27a-a2ac166a2743
```

#### Client (.env in client/)
```env
VITE_API_URL=http://localhost:8081
```

### 4. Run the application
```bash
npm run dev
```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:8081) concurrently.

## 🔐 Features

### Authentication
- User registration and login
- JWT-based authentication
- Protected routes
- Token persistence

### Dashboard
- Responsive sidebar navigation
- User-specific data display
- Real-time updates

### Lead Management
- CRUD operations for leads
- User-specific lead filtering
- AI calling integration

### PDF Upload
- Secure file upload
- User-specific file storage
- File metadata tracking

### AI Calling (Bolna.ai)
- Automated calling for leads
- Call history tracking
- Integration with Bolna.ai API

## 🛠 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Leads
- `GET /api/leads` - Get user leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### PDF Management
- `POST /api/pdf/upload` - Upload PDF file
- `GET /api/pdf` - Get user PDFs

### AI Calling
- `POST /api/calls/create` - Initiate AI call
- `GET /api/calls` - Get call history

## 🔄 Development

### Frontend Development
```bash
cd client
npm run dev
```

### Backend Development
```bash
cd server
npm run dev
```

### Build for Production
```bash
npm run build:client
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the client: `npm run build:client`
2. Deploy the `client/dist` folder

### Backend (Railway/Heroku)
1. Set environment variables
2. Deploy the `server` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- File upload size limit: 10MB
- Bolna.ai rate limiting applies
- MongoDB connection timeout handling

## 📞 Support

For support, create an issue in the repository.
