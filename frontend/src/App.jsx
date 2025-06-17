import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './pages/MapPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import MonthlyTicketsPage from './pages/MonthlyTicketsPage';
import AdminFullStatsPage from './pages/AdminFullStatsPage';
import Header from './components/Header';
import { AuthProvider } from './context/AuthContext';
import './styles/main.css';
import EditProfilePage from './pages/EditProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <Routes>
            <Route path="/" element={<Navigate to="/map" />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/login" element={<AuthPage type="login" />} />
            <Route path="/register" element={<AuthPage type="register" />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/monthly-tickets" element={<MonthlyTicketsPage />} />
            <Route path="/admin/full-stats" element={<AdminFullStatsPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
