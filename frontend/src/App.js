import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';

// Import des pages et composants
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Annonces from './pages/Annonces';
import Login from './pages/login';
import Signup from './pages/signup';
import CreateAnnonce from './pages/CreateAnnonce';

// Composant pour protéger les routes (nécessite d'être connecté)
function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

// Composant principal avec le routeur
function AppInner() {
  return (
    <Router>
      {/* Navbar visible sur toutes les pages */}
      <Navbar />

      <Routes>
        {/* Page d'accueil publique (accessible à tous) */}
        <Route path="/" element={<Home />} />

        {/* Page des annonces publique (accessible à tous, mais faut être connecté pour modifier) */}
        <Route path="/annonces" element={<Annonces />} />

        {/* Login (accessible à tous) */}
        <Route path="/login" element={<Login />} />

        {/* Signup (accessible à tous) */}
        <Route path="/signup" element={<Signup />} />

        {/* Créer annonce (protégée = faut être connecté) */}
        <Route 
          path="/create-annonce" 
          element={
            <ProtectedRoute>
              <CreateAnnonce />
            </ProtectedRoute>
          } 
        />

        {/* Route par défaut : redirige vers l'accueil */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// Export avec AuthProvider wrapper
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
