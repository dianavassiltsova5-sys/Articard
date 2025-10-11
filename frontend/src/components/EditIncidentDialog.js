import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { AlertTriangle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const EditIncidentDialog = ({ shift, incident, incidentIndex, isOpen, onClose, onIncidentUpdated }) => {
  const [formData, setFormData] = useState({
    type: incident?.type || '',
    description: incident?.description || '',
    incident_time: incident?.incident_time || '',
    g4s_patrol_called: incident?.g4s_patrol_called || false,
    ambulance_called: incident?.ambulance_called || false,
    // Theft specific
    gender: incident?.gender || '',
    amount: incident?.amount || '',
    special_tools_used: incident?.special_tools_used || false,
    outcome: incident?.outcome || '',
    theft_prevented: incident?.theft_prevented || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatGender = (gender) => {
    switch (gender) {
      case 'male': return 'Mees';
      case 'female': return 'Naine';
      default: return gender;
    }
  };

  const formatOutcome = (outcome) => {
    switch (outcome) {
      case 'vabastatud': return 'Vabastatud';
      case 'maksis_vabastatud': return 'Maksis ja vabastatud';
      case 'politsei': return 'Üle antud politseisse';
      default: return outcome;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Palun sisestage kirjeldus');
      return;
    }

    if (formData.type === 'theft') {
      if (!formData.gender || !formData.amount || !formData.outcome) {
        toast.error('Palun täitke kõik varguse kohustuslikud väljad');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        type: formData.type,
        description: formData.description.trim(),
        incident_time: formData.incident_time || null,
        g4s_patrol_called: formData.g4s_patrol_called,
        ambulance_called: formData.ambulance_called
      };

      // Add theft-specific fields if it's a theft incident
      if (formData.type === 'theft') {
        updateData.gender = formData.gender;
        updateData.amount = parseFloat(formData.amount);
        updateData.special_tools_used = formData.special_tools_used;
        updateData.outcome = formData.outcome;
        updateData.theft_prevented = formData.theft_prevented;
      }

      await axios.put(`${backendUrl}/api/shifts/${shift.id}/incidents/${incidentIndex}`, updateData);
      
      toast.success('Intsident uuendatud edukalt!');
      onIncidentUpdated();
      onClose();
    } catch (error) {
      console.error('Update incident error:', error);
      toast.error('Viga intsidendi uuendamisel');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-amber-600" />
            Muuda intsidenti
          </DialogTitle>
          <DialogDescription>
            Muutke intsidendi andmeid
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Incident Type */}
          <div className="space-y-2">
            <Label>Intsidendi tüüp</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Valige tüüp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Üldine intsident</SelectItem>
                <SelectItem value="theft">Vargus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Kirjeldus</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Kirjeldage, mis toimus..."
              rows={3}
            />
          </div>

          {/* Incident Time */}
          <div className="space-y-2">
            <Label htmlFor="incident-time">Intsidendi aeg (valikuline)</Label>
            <Input
              id="incident-time"
              type="time"
              value={formData.incident_time}
              onChange={(e) => handleInputChange('incident_time', e.target.value)}
            />
          </div>

          {/* Services */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="g4s-patrol">G4S patrull kutsutud</Label>
              <Switch
                id="g4s-patrol"
                checked={formData.g4s_patrol_called}
                onCheckedChange={(checked) => handleInputChange('g4s_patrol_called', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ambulance">Kiirabi kutsutud</Label>
              <Switch
                id="ambulance"
                checked={formData.ambulance_called}
                onCheckedChange={(checked) => handleInputChange('ambulance_called', checked)}
              />
            </div>
          </div>

          {/* Theft-specific fields */}
          {formData.type === 'theft' && (
            <div className="space-y-4 p-4 border rounded-lg bg-red-50">
              <h4 className="font-medium text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Varguse üksikasjad
              </h4>
              
              {/* Gender */}
              <div className="space-y-2">
                <Label>Isiku sugu</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valige sugu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Mees</SelectItem>
                    <SelectItem value="female">Naine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Summa (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Special tools and theft prevented */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="special-tools">Erivahendeid kasutatud</Label>
                  <Switch
                    id="special-tools"
                    checked={formData.special_tools_used}
                    onCheckedChange={(checked) => handleInputChange('special_tools_used', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="theft-prevented">Vargus ennetatud</Label>
                  <Switch
                    id="theft-prevented"
                    checked={formData.theft_prevented}
                    onCheckedChange={(checked) => handleInputChange('theft_prevented', checked)}
                  />
                </div>
              </div>

              {/* Outcome */}
              <div className="space-y-2">
                <Label>Tulemus</Label>
                <Select value={formData.outcome} onValueChange={(value) => handleInputChange('outcome', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valige tulemus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vabastatud">Vabastatud</SelectItem>
                    <SelectItem value="maksis_vabastatud">Maksis ja vabastatud</SelectItem>
                    <SelectItem value="politsei">Üle antud politseisse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
                'Uuenda intsident'
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

export default EditIncidentDialog;