import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. The Default Redirect */}
        {/* If a user hits the bare URL, instantly bounce them to the login screen. 
            The 'replace' keyword ensures they don't get stuck in a "Back Button" loop. */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 2. Our Main Application Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 3. The 404 Catch-All */}
        {/* If a user types a random URL like /fakepage, catch it and send them to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;