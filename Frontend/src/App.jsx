import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Overview from "./pages/Overview";
import Documents from "./pages/Documents";
import HSN from "./pages/HSN";
import Duty from "./pages/Duty";
import Risk from "./pages/Risk";
import Shipments from "./pages/Shipments";
import Analytics from "./pages/Analytics";

import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="documents" element={<Documents />} />
            <Route path="hsn" element={<HSN />} />
            <Route path="duty" element={<Duty />} />
            <Route path="risk" element={<Risk />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;