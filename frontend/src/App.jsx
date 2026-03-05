// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Automatically redirect the root URL to the login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* The Login Page Route */}
        <Route path="/login" element={<Login />} />
        
        {/* The Main Dashboard Route */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}