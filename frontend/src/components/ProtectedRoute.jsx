import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // Check if the token exists in the browser
  const token = localStorage.getItem('sky_token');

  // If there is no token, kick them back to the login page
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If they have a token, let them through to the protected component
  return children;
}