import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';


// Import des pages et composants
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Annonces from './pages/Annonces';
import Login from './pages/login';
import Signup from './pages/signup';
import CreateAnnonce from './pages/CreateAnnonce';
import AdminDashboard from './pages/AdminDashboard';  // ← AJOUTE


// Composant pour protéger les routes (nécessite d'être connecté)
function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}


// Composant pour protéger les routes ADMIN (nécessite d'être admin)
function ProtectedAdminRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user && user.role === 'admin' ? children : <Navigate to="/" />;  // ← AJOUTE
}


// Composant principal avec le routeur
function AppInner() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Navbar visible sur toutes les pages */}
        <Navbar />


        {/* Main content */}
        <main style={{ flex: 1 }}>
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


            {/* Admin Dashboard (protégée = faut être admin) */}  {/* ← AJOUTE */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />


            {/* Route par défaut : redirige vers l'accueil */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>


        {/* Footer visible sur toutes les pages */}
        <Footer />
      </div>
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
