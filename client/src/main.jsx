// client/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AlertProvider } from './contexts/AlertContext.jsx'
import './assets/styles/index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { registerServiceWorker } from './utils/sw-register.js'

registerServiceWorker(); // Register the service worker

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AlertProvider>
        <AuthProvider>
          <App />
          <ToastContainer position="top-right" autoClose={5000} />
        </AuthProvider>
      </AlertProvider>
    </Router>
  </React.StrictMode>,
)
