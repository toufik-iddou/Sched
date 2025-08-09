import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Booking from './pages/Booking.tsx';
import Home from './pages/Home.tsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/book/:username" element={<Booking />} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-9xl font-bold text-gray-200">404</h1>
                <h2 className="text-2xl font-semibold text-gray-600 mt-4">Page Not Found</h2>
                <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary mt-6">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
