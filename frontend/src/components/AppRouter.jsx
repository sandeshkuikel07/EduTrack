import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
// import Dashboard from '../pages/Dashboard';
// import Application from '../pages/Application';
import ApplicationForm from '../pages/ApplicationForm';
import AdminDashboard from '../pages/AdminDashboard';
import ViewApplication from '../pages/ViewApplication';
import EditApplication from '../pages/EditApplication';
import ManageUsers from '../pages/ManageUsers';
import Settings from '../pages/Settings.jsx';
// import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import UserDashboard from '../pages/UserDashboard';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/application" 
        element={
          <ProtectedRoute>
            <ApplicationForm />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      
      <Route 
        path="/admin/application/:id" 
        element={
          <AdminRoute>
            <ViewApplication />
          </AdminRoute>
        } 
      />
      
      <Route 
        path="/admin/edit-application/:id" 
        element={
          <AdminRoute>
            <EditApplication />
          </AdminRoute>
        } 
      />
      
      <Route 
        path="/admin/manage-users" 
        element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        } 
      />
      
      <Route 
        path="/admin/settings" 
        element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        } 
      />
      
      {/* <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" />} /> */}
    </Routes>
  );
};

export default AppRouter;