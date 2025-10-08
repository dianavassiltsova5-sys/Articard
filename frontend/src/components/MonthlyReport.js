import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, Printer, Calendar, Clock, AlertTriangle, 
  FileText, TrendingUp, User, Building, Trash2 
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { et } from 'date-fns/locale';

const MonthlyReport = ({ shifts, onDeleteShift }) => {
  const { year, month } = useParams();
  const navigate = useNavigate();
  const [monthlyShifts, setMonthlyShifts] = useState([]);

  useEffect(() => {
    if (shifts && year && month) {
      const filterDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthStart = startOfMonth(filterDate);
      const monthEnd = endOfMonth(filterDate);
      
      const filtered = shifts.filter(shift => {
        const shiftDate = parseISO(shift.date);
        return shiftDate >= monthStart && shiftDate <= monthEnd;
      });
      
      // Sort by date
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      setMonthlyShifts(filtered);
    }
  }, [shifts, year, month]);

  const calculateMonthlyStats = () => {
    return monthlyShifts.reduce((stats, shift) => {
      // Calculate hours worked
      const startTime = new Date(`2000-01-01T${shift.start_time}`);
      const endTime = new Date(`2000-01-01T${shift.end_time}`);
      let hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
      
      // Handle overnight shifts
      if (hoursWorked < 0) {
        hoursWorked += 24;
      }
      
      stats.totalHours += hoursWorked;
      stats.totalShifts += 1;
      stats.totalIncidents += shift.incidents ? shift.incidents.length : 0;
      
      // Track different guards and objects
      if (!stats.guards.includes(shift.guard_name)) {
        stats.guards.push(shift.guard_name);
      }
      if (!stats.objects.includes(shift.object_name)) {
        stats.objects.push(shift.object_name);
      }
      
      // Calculate theft incidents and amounts
      if (shift.incidents) {
        shift.incidents.forEach(incident => {
          if (incident.type === 'theft') {
            stats.theftIncidents += 1;
            if (incident.theft_prevented) {
              stats.preventedTheftAmount += parseFloat(incident.amount) || 0;
              stats.preventedThefts += 1;
            } else {
              stats.totalTheftAmount += parseFloat(incident.amount) || 0;
            }
          }
        });
      }
      
      return stats;
    }, {
      totalHours: 0,
      totalShifts: 0,
      totalIncidents: 0,
      theftIncidents: 0,
      totalTheftAmount: 0,
      preventedTheftAmount: 0,
      preventedThefts: 0,
      guards: [],
      objects: []
    });
  };

  const stats = calculateMonthlyStats();
  const monthName = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: et });

  const handlePrintReport = () => {
    window.print();
  };

  const handleDeleteAllShifts = async () => {
    try {
      const deletePromises = monthlyShifts.map(shift => onDeleteShift(shift.id));
      await Promise.all(deletePromises);
      toast.success(`${monthlyShifts.length} vahetust kustutatud!`);
      navigate('/');
    } catch (error) {
      console.error('Error deleting shifts:', error);
      toast.error('Viga vahetuste kustutamisel');
    }
  };

  const formatIncidentType = (type) => {
    return type === 'theft' ? 'Vargus' : 'Üldine';
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
            data-testid="print-monthly-report-btn"
          >
            <Printer className="h-4 w-4 mr-2" />
            Prindi aruanne
          </Button>
          {monthlyShifts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="btn-secondary"
                  data-testid="delete-all-shifts-trigger"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Kustuta kõik vahetused
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kas oled kindel?</AlertDialogTitle>
                  <AlertDialogDescription>
                    See tegevus kustutab KÕIK {monthlyShifts.length} vahetust kuust {monthName} 
                    ja kõik nendega seotud intsidendid jäädavalt. Seda toimingut ei saa tagasi pöörata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Tühista</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllShifts}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="confirm-delete-all-shifts"
                  >
                    Kustuta kõik ({monthlyShifts.length})
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Report Header */}
      <Card className="card-hover">
        <CardHeader className="text-center py-4">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Kuu Aruanne - {monthName}
          </CardTitle>
          <CardDescription className="text-base">
            Articard Turvafirma | Töövahetus ülevaade
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Personnel and Objects */}
      <Card className="card-hover no-print">
        <CardHeader>
          <CardTitle className="text-lg">Personal ja objektid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-1">
                <User className="h-4 w-4" />
                Turvamehed ({stats.guards.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.guards.map((guard, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {guard} ({monthlyShifts.filter(s => s.guard_name === guard).length})
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-1">
                <Building className="h-4 w-4" />
                Objektid ({stats.objects.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.objects.map((object, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {object} ({monthlyShifts.filter(s => s.object_name === object).length})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Statistics Before Table */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-6 border border-slate-200">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.totalShifts}</div>
              <div className="text-sm font-medium text-slate-600">Vahetust</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalHours.toFixed(1)}h</div>
              <div className="text-sm font-medium text-slate-600">Tundi kokku</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.preventedTheftAmount.toFixed(0)}€</div>
              <div className="text-sm font-medium text-slate-600">Ennetatud varguse summa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Table Report - Similar to Reference Screenshot */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Tööaeg ja info sündmuste kohta</CardTitle>
          <CardDescription>
            Periood: {format(startOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'dd.MM.yyyy')} - {format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'dd.MM.yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyShifts.length > 0 ? (
            <div data-testid="monthly-shifts-cards">
              {/* Ultra Compact Shift Cards - 2 dates per card */}
              <div className="space-y-4 mb-6">
                {Array.from({ length: Math.ceil(monthlyShifts.length / 2) }, (_, pairIndex) => {
                  const leftShift = monthlyShifts[pairIndex * 2];
                  const rightShift = monthlyShifts[pairIndex * 2 + 1];
                  
                  const getShiftHours = (shift) => {
                    const startTime = new Date(`2000-01-01T${shift.start_time}`);
                    const endTime = new Date(`2000-01-01T${shift.end_time}`);
                    let hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
                    if (hoursWorked < 0) hoursWorked += 24;
                    return hoursWorked;
                  };

                  const renderShift = (shift, side) => {
                    if (!shift) return null;
                    const hoursWorked = getShiftHours(shift);
                    
                    return (
                      <div className={`${side === 'right' ? 'border-l pl-4' : 'pr-4'} flex-1`}>
                        {/* Date and hours header */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-lg font-bold text-slate-800">
                            {format(parseISO(shift.date), 'dd.MM')}
                          </div>
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {hoursWorked.toFixed(1)}h
                          </div>
                        </div>
                        
                        {/* Time and personnel */}
                        <div className="space-y-1 mb-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">{shift.start_time} - {shift.end_time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-emerald-600" />
                            <span className="font-medium text-slate-700 text-xs">{shift.guard_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-blue-600" />
                            <span className="text-slate-600 text-xs truncate">{shift.object_name}</span>
                          </div>
                        </div>
                        
                        {/* Incidents */}
                        {shift.incidents && shift.incidents.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              <span className="text-xs font-medium text-slate-700">
                                {shift.incidents.length} int.
                              </span>
                            </div>
                            {shift.incidents.map((incident, idx) => (
                              <div key={idx} className="bg-slate-50 rounded p-2 text-xs space-y-1">
                                <div className="font-medium">
                                  {incident.incident_time && (
                                    <span className="font-bold text-slate-700">{incident.incident_time} - </span>
                                  )}
                                  <span className={incident.type === 'theft' ? 'text-red-600' : 'text-amber-600'}>
                                    {formatIncidentType(incident.type)}
                                  </span>
                                  {incident.type === 'theft' && incident.theft_prevented && (
                                    <span className="bg-green-100 text-green-700 px-1 rounded ml-1 text-xs">ENE</span>
                                  )}
                                </div>
                                
                                <div className="text-slate-600 text-xs bg-white rounded p-1">
                                  <span className="font-medium">Kirj:</span> {incident.description.length > 40 ? `${incident.description.substring(0, 40)}...` : incident.description}
                                </div>
                                
                                {incident.type === 'theft' && (
                                  <div className="grid grid-cols-2 gap-1 text-xs">
                                    <div>
                                      <span className="text-slate-500">Isik:</span> {formatGender(incident.gender)}
                                    </div>
                                    <div>
                                      <span className="text-slate-500">
                                        {incident.theft_prevented ? 'Enn:' : 'Sum:'}
                                      </span> 
                                      <span className={incident.theft_prevented ? 'text-green-600 font-bold ml-1' : 'text-red-600 font-bold ml-1'}>
                                        {incident.amount}€
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Eriv:</span> {incident.special_tools_used ? 'Jah' : 'Ei'}
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Tul:</span> 
                                      <span className={
                                        incident.outcome === 'politsei' ? 'text-red-600 font-bold ml-1' :
                                        (incident.outcome === 'vabastatud' || incident.outcome === 'maksis_vabastatud') ? 'text-green-600 font-bold ml-1' : 'ml-1'
                                      }>
                                        {formatOutcome(incident.outcome).substring(0, 8)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">G4S:</span> 
                                      <span className={incident.g4s_patrol_called ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                                        {incident.g4s_patrol_called ? 'Jah' : 'Ei'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Kiir:</span> 
                                      <span className={incident.ambulance_called ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                                        {incident.ambulance_called ? 'Jah' : 'Ei'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {incident.type === 'general' && (
                                  <div className="grid grid-cols-2 gap-1 text-xs">
                                    <div>
                                      <span className="text-slate-500">G4S:</span> 
                                      <span className={incident.g4s_patrol_called ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                                        {incident.g4s_patrol_called ? 'Jah' : 'Ei'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Kiir:</span> 
                                      <span className={incident.ambulance_called ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                                        {incident.ambulance_called ? 'Jah' : 'Ei'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 text-center py-2">
                            Ei ole intsidenti
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div key={pairIndex} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                      <div className="flex">
                        {renderShift(leftShift, 'left')}
                        {rightShift && renderShift(rightShift, 'right')}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-700">{stats.totalHours.toFixed(1)}h</div>
                    <div className="text-sm text-blue-600">Kokku tunde</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-700">{stats.totalShifts}</div>
                    <div className="text-sm text-emerald-600">Vahetust</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-700">{stats.totalIncidents}</div>
                    <div className="text-sm text-amber-600">Intsidenti</div>
                  </div>
                </div>
                {stats.preventedThefts > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-center">
                    <div className="text-lg font-bold text-green-700">
                      Ennetatud varguse summa: {stats.preventedTheftAmount.toFixed(0)}€
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">Vahetusi ei leitud</p>
              <p className="text-sm">Sellel kuul ei ole veel ühtegi vahetust registreeritud</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print header - simplified */}
      <div className="print-only mb-4">
        <div className="text-center border-b pb-2">
          <h2 className="text-lg font-bold">Kuu aruanne - {monthName}</h2>
          <p className="text-sm">{format(new Date(), 'dd.MM.yyyy HH:mm', { locale: et })}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-slate-200">
        <div className="text-center text-xs text-slate-600">
          <p>Konfidentsiaalne dokument - ainult ametlikuks kasutamiseks</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;