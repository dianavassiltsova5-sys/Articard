import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Clock, User, Building } from 'lucide-react';
import { format } from 'date-fns';
import { et } from 'date-fns/locale';
import { toast } from 'sonner';
import axios from 'axios';

const EditShiftDialog = ({ shift, isOpen, onClose, onShiftUpdated }) => {
  const [formData, setFormData] = useState({
    date: shift ? new Date(shift.date) : new Date(),
    object_name: shift?.object_name || '',
    guard_name: shift?.guard_name || '',
    start_time: shift?.start_time || '',
    end_time: shift?.end_time || ''
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.object_name.trim() || !formData.guard_name.trim()) {
      toast.error('Palun täitke kõik kohustuslikud väljad');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        date: formData.date.toISOString().split('T')[0],
        object_name: formData.object_name.trim(),
        guard_name: formData.guard_name.trim(),
        start_time: formData.start_time,
        end_time: formData.end_time
      };

      await axios.put(`${backendUrl}/api/shifts/${shift.id}`, updateData);
      
      toast.success('Vahetus uuendatud edukalt!');
      onShiftUpdated();
      onClose();
    } catch (error) {
      console.error('Update shift error:', error);
      toast.error('Viga vahetuse uuendamisel');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shift) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Muuda vahetust
          </DialogTitle>
          <DialogDescription>
            Muutke vahetuse andmeid
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Kuupäev</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, 'dd.MM.yyyy', { locale: et })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => {
                    if (date) {
                      handleInputChange('date', date);
                      setShowCalendar(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Object Name */}
          <div className="space-y-2">
            <Label htmlFor="object-name" className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              Objekt
            </Label>
            <Input
              id="object-name"
              value={formData.object_name}
              onChange={(e) => handleInputChange('object_name', e.target.value)}
              placeholder="nt. VIRU TN 4 MAXIMA (T289)"
            />
          </div>

          {/* Guard Name */}
          <div className="space-y-2">
            <Label htmlFor="guard-name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Turvamehe nimi
            </Label>
            <Input
              id="guard-name"
              value={formData.guard_name}
              onChange={(e) => handleInputChange('guard_name', e.target.value)}
              placeholder="nt. V.Kauts"
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                Algusaeg
              </Label>
              <Input
                id="start-time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" />
                Lõpuaeg
              </Label>
              <Input
                id="end-time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner mr-2" />
                  Uuendamine...
                </>
              ) : (
                'Uuenda vahetus'
              )}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Tühista
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditShiftDialog;