import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CalendarIcon, Clock, User, Building, Save, Bookmark, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { et } from 'date-fns/locale';
import { toast } from 'sonner';
import axios from 'axios';

const ShiftForm = ({ onSubmit, onCancel, initialData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: initialData?.date ? new Date(initialData.date) : new Date(),
    object_name: initialData?.object_name || '',
    guard_name: initialData?.guard_name || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || ''
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateSelect = (date) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
    setShowCalendar(false);
  };

  const validateForm = () => {
    if (!formData.date) {
      toast.error('Palun vali kuupäev');
      return false;
    }
    if (!formData.object_name.trim()) {
      toast.error('Palun sisesta objekti nimi');
      return false;
    }
    if (!formData.guard_name.trim()) {
      toast.error('Palun sisesta turvamehe nimi');
      return false;
    }
    if (!formData.start_time) {
      toast.error('Palun sisesta algusaeg');
      return false;
    }
    if (!formData.end_time) {
      toast.error('Palun sisesta lõpuaeg');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        date: format(formData.date, 'yyyy-MM-dd'),
        object_name: formData.object_name.trim(),
        guard_name: formData.guard_name.trim(),
        start_time: formData.start_time,
        end_time: formData.end_time
      };
      
      await onSubmit(submitData);
      toast.success('Vahetus salvestatud edukalt!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting shift:', error);
      toast.error('Viga vahetuse salvestamisel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="form-slide-in card-hover">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            {initialData ? 'Muuda vahetust' : 'Uus töövahetus'}
          </CardTitle>
          <CardDescription>
            Sisesta töövahetuse põhiandmed. Intsidente saad lisada pärast salvestamist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Kuupäev
              </Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    data-testid="date-picker-btn"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, 'dd. MMMM yyyy', { locale: et })
                    ) : (
                      'Vali kuupäev'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={handleDateSelect}
                    locale={et}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Object Name */}
            <div className="space-y-2">
              <Label htmlFor="object_name" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Objekti nimi
              </Label>
              <Input
                id="object_name"
                type="text"
                placeholder="Sisesta objekti nimi (nt. Kaubanduskeskus, Büroohoone)"
                value={formData.object_name}
                onChange={(e) => handleInputChange('object_name', e.target.value)}
                className="transition-smooth"
                data-testid="object-name-input"
              />
            </div>

            {/* Guard Name */}
            <div className="space-y-2">
              <Label htmlFor="guard_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Turvamehe nimi
              </Label>
              <Input
                id="guard_name"
                type="text"
                placeholder="Sisesta turvamehe nimi"
                value={formData.guard_name}
                onChange={(e) => handleInputChange('guard_name', e.target.value)}
                className="transition-smooth"
                data-testid="guard-name-input"
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Algusaeg
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  className="transition-smooth"
                  data-testid="start-time-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Lõpuaeg
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  className="transition-smooth"
                  data-testid="end-time-input"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1 btn-primary"
                disabled={isSubmitting}
                data-testid="save-shift-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner mr-2" />
                    Salvestamine...
                  </>
                ) : (
                  'Salvesta vahetus'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1 btn-secondary"
                data-testid="cancel-shift-btn"
              >
                Tühista
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftForm;