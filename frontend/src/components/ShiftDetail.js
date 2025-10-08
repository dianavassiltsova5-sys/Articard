import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { 
  Calendar, Clock, User, Building, AlertTriangle, 
  Plus, Trash2, Edit, FileText, ArrowLeft, Printer, MoreVertical 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { format, parseISO } from 'date-fns';
import { et } from 'date-fns/locale';
import { toast } from 'sonner';

const ShiftDetail = ({ shifts, onUpdateShift, onAddIncident, onRemoveIncident, onDeleteShift }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shift, setShift] = useState(null);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [incidentType, setIncidentType] = useState('general');
  const [incidentData, setIncidentData] = useState({
    description: '',
    gender: 'mees',
    amount: 0,
    special_tools_used: false,
    outcome: 'vabastatud',
    g4s_patrol_called: false,
    ambulance_called: false,
    theft_prevented: false,
    incident_time: ''
  });
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  useEffect(() => {
    const currentShift = shifts.find(s => s.id === id);
    setShift(currentShift);
  }, [id, shifts]);

  const resetIncidentForm = () => {
    setIncidentData({
      description: '',
      gender: 'mees',
      amount: 0,
      special_tools_used: false,
      outcome: 'vabastatud',
      g4s_patrol_called: false,
      ambulance_called: false,
      theft_prevented: false
    });
    setIncidentType('general');
  };

  const handleAddIncident = async () => {
    if (!incidentData.description.trim()) {
      toast.error('Palun sisesta intsidendi kirjeldus');
      return;
    }

    setIsSubmittingIncident(true);
    
    try {
      const incident = {
        type: incidentType,
        description: incidentData.description.trim(),
        ...(incidentType === 'theft' && {
          gender: incidentData.gender,
          amount: parseFloat(incidentData.amount),
          special_tools_used: incidentData.special_tools_used,
          outcome: incidentData.outcome
        })
      };
      
      await onAddIncident(id, incident);
      toast.success('Intsident lisatud edukalt!');
      setShowIncidentDialog(false);
      resetIncidentForm();
    } catch (error) {
      console.error('Error adding incident:', error);
      toast.error('Viga intsidendi lisamisel');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const handleRemoveIncident = async (incidentIndex) => {
    try {
      await onRemoveIncident(id, incidentIndex);
      toast.success('Intsident eemaldatud!');
    } catch (error) {
      console.error('Error removing incident:', error);
      toast.error('Viga intsidendi eemaldamisel');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDeleteShift = async () => {
    try {
      await onDeleteShift(id);
      toast.success('Vahetus kustutatud!');
      navigate('/');
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Viga vahetuse kustutamisel');
    }
  };

  const calculateHours = () => {
    if (!shift) return 0;
    
    const startTime = new Date(`2000-01-01T${shift.start_time}`);
    const endTime = new Date(`2000-01-01T${shift.end_time}`);
    let hours = (endTime - startTime) / (1000 * 60 * 60);
    
    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }
    
    return hours.toFixed(1);
  };

  const formatIncidentType = (type) => {
    return type === 'theft' ? 'Vargus' : 'Üldine intsident';
  };

  const formatGender = (gender) => {
    return gender === 'mees' ? 'Mees' : 'Naine';
  };

  const formatOutcome = (outcome) => {
    switch (outcome) {
      case 'vabastatud': return 'Vabastatud';
      case 'maksis_vabastatud': return 'Maksis ja vabastatud';
      case 'politsei': return 'Antud politseisse';
      default: return outcome;
    }
  };

  if (!shift) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vahetust ei leitud</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tagasi avaleheküljele
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between no-print">
        <Button 
          onClick={() => navigate('/')}
          variant="outline"
          className="btn-secondary"
          data-testid="back-to-dashboard-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tagasi
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handlePrintReport}
            className="btn-primary"
            data-testid="print-report-btn"
          >
            <Printer className="h-4 w-4 mr-2" />
            Prindi aruanne
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 focus:text-red-600"
                    data-testid="delete-shift-trigger"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Kustuta vahetus
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Kas oled kindel?</AlertDialogTitle>
                    <AlertDialogDescription>
                      See tegevus kustutab vahetuse "{shift?.guard_name}" ({shift ? format(parseISO(shift.date), 'dd.MM.yyyy') : ''}) 
                      ja kõik sellega seotud intsidendid jäädavalt. Seda toimingut ei saa tagasi pöörata.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Tühista</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteShift}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="confirm-delete-shift"
                    >
                      Kustuta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Shift Header */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Töövahetus - {format(parseISO(shift.date), 'dd. MMMM yyyy', { locale: et })}
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                {calculateHours()} tundi tööd
              </CardDescription>
            </div>
            <Badge 
              variant={shift.incidents && shift.incidents.length > 0 ? 'destructive' : 'secondary'}
              className="text-sm px-3 py-1"
            >
              {shift.incidents?.length || 0} intsident(i)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Turvamees</p>
                  <p className="text-lg font-semibold">{shift.guard_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Objekt</p>
                  <p className="text-lg font-semibold">{shift.object_name}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Ajavahemik</p>
                  <p className="text-lg font-semibold">
                    {shift.start_time} - {shift.end_time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Staatus</p>
                  <p className="text-lg font-semibold text-green-600">Lõpetatud</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Section */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Intsidendid
              </CardTitle>
              <CardDescription>
                Töövahetuse jooksul toimunud sündmused
              </CardDescription>
            </div>
            <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="btn-primary no-print"
                  data-testid="add-incident-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lisa intsident
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Uus intsident</DialogTitle>
                  <DialogDescription>
                    Vali intsidendi tüüp ja sisesta detailid
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Intsidendi tüüp</Label>
                    <Select value={incidentType} onValueChange={setIncidentType}>
                      <SelectTrigger data-testid="incident-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Üldine intsident</SelectItem>
                        <SelectItem value="theft">Vargus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Kirjeldus</Label>
                    <Textarea
                      id="description"
                      placeholder="Kirjelda toimunut..."
                      value={incidentData.description}
                      onChange={(e) => setIncidentData(prev => ({ ...prev, description: e.target.value }))}
                      data-testid="incident-description-input"
                    />
                  </div>

                  {incidentType === 'theft' && (
                    <>
                      <div className="space-y-2">
                        <Label>Sugu</Label>
                        <Select 
                          value={incidentData.gender} 
                          onValueChange={(value) => setIncidentData(prev => ({ ...prev, gender: value }))}
                        >
                          <SelectTrigger data-testid="gender-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mees">Mees</SelectItem>
                            <SelectItem value="naine">Naine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Varguse summa (€)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={incidentData.amount}
                          onChange={(e) => setIncidentData(prev => ({ ...prev, amount: e.target.value }))}
                          data-testid="theft-amount-input"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="special_tools"
                          checked={incidentData.special_tools_used}
                          onCheckedChange={(checked) => setIncidentData(prev => ({ ...prev, special_tools_used: checked }))}
                          data-testid="special-tools-checkbox"
                        />
                        <Label htmlFor="special_tools">Kasutati erivahendeid</Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Tulemus</Label>
                        <Select 
                          value={incidentData.outcome} 
                          onValueChange={(value) => setIncidentData(prev => ({ ...prev, outcome: value }))}
                        >
                          <SelectTrigger data-testid="outcome-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vabastatud">Vabastatud</SelectItem>
                            <SelectItem value="maksis_vabastatud">Maksis ja vabastatud</SelectItem>
                            <SelectItem value="politsei">Antud politseisse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="theft_prevented"
                          checked={incidentData.theft_prevented}
                          onCheckedChange={(checked) => setIncidentData(prev => ({ ...prev, theft_prevented: checked }))}
                          data-testid="theft-prevented-checkbox"
                        />
                        <Label htmlFor="theft_prevented" className="text-sm">Vargus ennetatud</Label>
                      </div>
                    </>
                  )}

                  {/* Additional incident fields */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium text-slate-700">Täiendavad teenused</Label>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="g4s_patrol"
                        checked={incidentData.g4s_patrol_called}
                        onCheckedChange={(checked) => setIncidentData(prev => ({ ...prev, g4s_patrol_called: checked }))}
                        data-testid="g4s-patrol-checkbox"
                      />
                      <Label htmlFor="g4s_patrol" className="text-sm">Kutsutud G4S patrull</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ambulance"
                        checked={incidentData.ambulance_called}
                        onCheckedChange={(checked) => setIncidentData(prev => ({ ...prev, ambulance_called: checked }))}
                        data-testid="ambulance-checkbox"
                      />
                      <Label htmlFor="ambulance" className="text-sm">Kutsutud kiirabi</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleAddIncident} 
                      className="flex-1 btn-primary"
                      disabled={isSubmittingIncident}
                      data-testid="save-incident-btn"
                    >
                      {isSubmittingIncident ? (
                        <>
                          <div className="spinner mr-2" />
                          Salvestamine...
                        </>
                      ) : (
                        'Lisa intsident'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowIncidentDialog(false);
                        resetIncidentForm();
                      }}
                      className="btn-secondary"
                      data-testid="cancel-incident-btn"
                    >
                      Tühista
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {shift.incidents && shift.incidents.length > 0 ? (
            <div className="space-y-4" data-testid="incidents-list">
              {shift.incidents.map((incident, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 bg-slate-50"
                  data-testid={`incident-${index}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={incident.type === 'theft' ? 'destructive' : 'secondary'}
                      >
                        {formatIncidentType(incident.type)}
                      </Badge>
                      {incident.timestamp && (
                        <span className="text-xs text-slate-500">
                          {format(parseISO(incident.timestamp), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIncident(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 no-print"
                      data-testid={`remove-incident-${index}-btn`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm mb-3">{incident.description}</p>
                  
                  {incident.type === 'general' && (
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-3">
                      <div>
                        <span className="font-medium">G4S patrull:</span> {incident.g4s_patrol_called ? 'Jah' : 'Ei'}
                      </div>
                      <div>
                        <span className="font-medium">Kiirabi:</span> {incident.ambulance_called ? 'Jah' : 'Ei'}
                      </div>
                    </div>
                  )}
                  
                  {incident.type === 'theft' && (
                    <div className="space-y-2 mb-3">
                      {incident.theft_prevented && (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <div className="text-sm font-medium text-green-800">
                            ✅ Vargus ennetatud summas {incident.amount}€
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                        <div>
                          <span className="font-medium">Sugu:</span> {formatGender(incident.gender)}
                        </div>
                        <div>
                          <span className="font-medium">{incident.theft_prevented ? 'Ennetatud summa' : 'Summa'}:</span> {incident.amount}€
                        </div>
                        <div>
                          <span className="font-medium">Erivahendid:</span> {incident.special_tools_used ? 'Jah' : 'Ei'}
                        </div>
                        <div>
                          <span className="font-medium">G4S patrull:</span> {incident.g4s_patrol_called ? 'Jah' : 'Ei'}
                        </div>
                        <div>
                          <span className="font-medium">Kiirabi:</span> {incident.ambulance_called ? 'Jah' : 'Ei'}
                        </div>
                        {!incident.theft_prevented && (
                          <div>
                            <span className="font-medium">Tulemus:</span> {formatOutcome(incident.outcome)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Services now shown in main incident info grid above */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">Intsidente pole</p>
              <p className="text-sm">See vahetus möödus ilma intsidentideta</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Header */}
      <div className="print-only print-header">
        <div className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_security-timetrack/artifacts/37b9rrnc_Articard.png" 
            alt="Articard Logo" 
            className="print-logo"
          />
          <div>
            <h1 className="print-title">ARTICARD TURVAFIRMA</h1>
            <p className="print-subtitle">Professionaalne turvateenus</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p>Töövahetus aruanne</p>
          <p>{format(new Date(), 'dd.MM.yyyy HH:mm', { locale: et })}</p>
        </div>
      </div>

      {/* Print Footer */}
      <div className="print-only mt-4 pt-2 border-t border-slate-200">
        <div className="text-center text-xs text-slate-600">
          <p>Articard Turvafirma | Litsents nr. TJT000000 | Tel: +372 000 0000 | info@articard.ee</p>
          <p>Konfidentsiaalne dokument - ainult ametlikuks kasutamiseks</p>
        </div>
      </div>
    </div>
  );
};

export default ShiftDetail;