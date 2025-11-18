require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`)
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received')
  console.log('🔄 Shutting down gracefully')
  server.close(() => {
    console.log('💤 Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('👋 SIGINT received')
  console.log('🔄 Shutting down gracefully')
  server.close(() => {
    console.log('💤 Process terminated')
    process.exit(0)
  })
})

module.exports = server