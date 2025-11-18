import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.jsx'
import { store } from './redux/store.js'
import './index.css'

// Clean up any corrupted localStorage data on app start
const cleanupLocalStorage = () => {
  const items = ['user', 'token']
  items.forEach(item => {
    const value = localStorage.getItem(item)
    if (value === 'undefined' || value === 'null') {
      localStorage.removeItem(item)
    }
  })
}

// Run cleanup before app starts
cleanupLocalStorage()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)