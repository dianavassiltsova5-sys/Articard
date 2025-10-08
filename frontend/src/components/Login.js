import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const Login = ({ onAuthSuccess }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Palun sisestage parool');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        password: password
      });

      if (response.data.authenticated) {
        toast.success('Sisselogimine õnnestus!');
        localStorage.setItem('isAuthenticated', 'true');
        onAuthSuccess();
      } else {
        toast.error('Vale parool');
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Viga sisselogimisel');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-4 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            ARTICARD TURVAFIRMA
          </CardTitle>
          <CardDescription className="text-slate-600">
            Töövahetus süsteem - Sisselogimiseks sisestage parool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Parool
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sisestage parool..."
                className="text-center"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner mr-2" />
                  Kontrollimine...
                </>
              ) : (
                'Sisene'
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-3 bg-slate-50 rounded-lg border text-sm text-slate-600 text-center">
            <Shield className="h-4 w-4 mx-auto mb-2 text-slate-500" />
            <p>Turvalisuse eesmärgil on vaja siseneda parooliga.</p>
            <p className="text-xs mt-1">Parool kehtib 30 minutit.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;