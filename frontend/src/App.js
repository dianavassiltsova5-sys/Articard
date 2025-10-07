import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import ShiftForm from './components/ShiftForm';
import ShiftDetail from './components/ShiftDetail';
import MonthlyReport from './components/MonthlyReport';
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

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/shifts');
      setShifts(response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
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
    fetchShifts();
  }, []);

  return (
    <div className="App min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <BrowserRouter>
        <div className="container mx-auto px-4 py-6">
          <header className="mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Articard Turvafirma
              </h1>
              <p className="text-slate-600 text-lg">
                Töövahetus ja intsidentide haldussüsteem
              </p>
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