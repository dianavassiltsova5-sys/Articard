import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import ShiftForm from './components/ShiftForm';
import ShiftDetail from './components/ShiftDetail';
import MonthlyReport from './components/MonthlyReport';
import Login from './components/Login';
import { Toaster } from './components/ui/sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 10000,
});

function App() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const checkAuthentication = async () => {
    try {
      const response = await apiClient.get('/auth/check');
      if (response.data.authenticated) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
    } finally {
      setAuthChecking(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    fetchShifts();
  };

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/shifts');
      setShifts(response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
      }
    } finally {
      setLoading(false);
    }
  };

  const createShift = async (shiftData) => {
    try {
      const response = await apiClient.post('/shifts', shiftData);
      await fetchShifts(); // Refresh shifts
      return response.data;
    } catch (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
  };

  const updateShift = async (shiftId, updateData) => {
    try {
      const response = await apiClient.put(`/shifts/${shiftId}`, updateData);
      await fetchShifts(); // Refresh shifts
      return response.data;
    } catch (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  };

  const addIncident = async (shiftId, incidentData) => {
    try {
      await apiClient.post(`/shifts/${shiftId}/incidents`, {
        shift_id: shiftId,
        incident_data: incidentData
      });
      await fetchShifts(); // Refresh shifts
    } catch (error) {
      console.error('Error adding incident:', error);
      throw error;
    }
  };

  const removeIncident = async (shiftId, incidentIndex) => {
    try {
      await apiClient.delete(`/shifts/${shiftId}/incidents/${incidentIndex}`);
      await fetchShifts(); // Refresh shifts
    } catch (error) {
      console.error('Error removing incident:', error);
      throw error;
    }
  };

  const deleteShift = async (shiftId) => {
    try {
      await apiClient.delete(`/shifts/${shiftId}`);
      await fetchShifts(); // Refresh shifts
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchShifts();
    }
  }, [isAuthenticated]);

  return (
    <div className="App min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <BrowserRouter>
        <div className="container mx-auto px-4 py-6">
          <header className="mb-8">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center gap-6">
                <img 
                  src="https://customer-assets.emergentagent.com/job_security-timetrack/artifacts/37b9rrnc_Articard.png" 
                  alt="Articard Logo" 
                  className="h-16 w-16 object-contain"
                />
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-2">
                    ARTICARD TURVAFIRMA
                  </h1>
                  <p className="text-blue-100 text-lg font-medium">
                    Professionaalne turvateenus • Töövahetus ja intsidentide haldussüsteem
                  </p>
                  <div className="flex justify-center gap-4 mt-3 text-sm text-blue-200">
                    <span>• 24/7 Valve</span>
                    <span>• Sertifitseeritud personal</span>
                    <span>• Digitaalne aruandlus</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  shifts={shifts}
                  loading={loading}
                  onCreateShift={createShift}
                  onDeleteShift={deleteShift}
                />
              } 
            />
            <Route 
              path="/shift/new" 
              element={
                <ShiftForm 
                  onSubmit={createShift}
                  onCancel={() => window.history.back()}
                />
              } 
            />
            <Route 
              path="/shift/:id" 
              element={
                <ShiftDetail 
                  shifts={shifts}
                  onUpdateShift={updateShift}
                  onAddIncident={addIncident}
                  onRemoveIncident={removeIncident}
                  onDeleteShift={deleteShift}
                />
              } 
            />
            <Route 
              path="/monthly-report/:year/:month" 
              element={
                <MonthlyReport 
                  shifts={shifts}
                  onDeleteShift={deleteShift}
                />
              } 
            />
          </Routes>
        </div>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;