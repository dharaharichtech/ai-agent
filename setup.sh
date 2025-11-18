#!/bin/bash

echo "🚀 Setting up AI Agent Full-Stack Application..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Create necessary directories
echo "📁 Creating upload directories..."
mkdir -p server/uploads
mkdir -p server/uploads/temp

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update server/.env with your MongoDB URI and VAPI API key"
echo "2. Run 'npm run dev' to start both client and server"
echo "3. Open http://localhost:5173 for the frontend"
echo "4. API will be available at http://localhost:5000/api"
echo ""
echo "🔧 Environment Setup:"
echo "- Client: http://localhost:5173"
echo "- Server: http://localhost:5000"
echo "- MongoDB: Update MONGO_URI in server/.env"
echo "- VAPI.ai: Update VAPI_API_KEY in server/.env"