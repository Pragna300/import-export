import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Dashboard/Overview';
import Documents from './pages/Dashboard/Documents';
import Shipments from './pages/Dashboard/Shipments';
import HSN from './pages/Dashboard/HSN';
import Risk from './pages/Dashboard/Risk';
import Tracking from './pages/Dashboard/Tracking';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        
        {/* Admin/User Dashboard Routes (Protected in future) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="documents" element={<Documents />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="hsn" element={<HSN />} />
          <Route path="risk" element={<Risk />} />
          <Route path="tracking" element={<Tracking />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
