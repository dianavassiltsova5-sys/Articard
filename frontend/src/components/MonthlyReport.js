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
            stats.totalTheftAmount += parseFloat(incident.amount) || 0;
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
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Kuu Aruanne - {monthName}
          </CardTitle>
          <CardDescription className="text-lg">
            Articard Turvafirma | Töövahetus ülevaade
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Compact Monthly Statistics */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{stats.totalHours.toFixed(1)}</div>
              <div className="text-xs text-slate-600">Tundi kokku</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{stats.totalShifts}</div>
              <div className="text-xs text-slate-600">Vahetust</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-amber-600">{stats.totalIncidents}</div>
              <div className="text-xs text-slate-600">Intsidenti</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">{stats.totalTheftAmount.toFixed(0)}€</div>
              <div className="text-xs text-slate-600">Kahju</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Summary */}
      <Card className="card-hover">
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

      {/* Detailed Daily Report */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Detailne päevaaruanne</CardTitle>
          <CardDescription>
            {monthName} - kõik vahetused ja intsidendid päevade lõikes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyShifts.length > 0 ? (
            <div className="space-y-4" data-testid="monthly-shifts-detailed">
              {monthlyShifts.map((shift, index) => {
                const startTime = new Date(`2000-01-01T${shift.start_time}`);
                const endTime = new Date(`2000-01-01T${shift.end_time}`);
                let hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
                if (hoursWorked < 0) hoursWorked += 24;
                
                return (
                  <div key={shift.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    {/* Shift Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-medium">
                          {format(parseISO(shift.date), 'dd.MM.yyyy EEEE', { locale: et })}
                        </Badge>
                        <span className="font-semibold text-slate-800">{shift.guard_name}</span>
                        <span className="text-slate-600">{shift.object_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">
                          {shift.start_time} - {shift.end_time} ({hoursWorked.toFixed(1)}h)
                        </Badge>
                        {shift.incidents && shift.incidents.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {shift.incidents.length} intsident{shift.incidents.length !== 1 ? 'i' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Incidents Details */}
                    {shift.incidents && shift.incidents.length > 0 ? (
                      <div className="space-y-3 ml-4 pl-4 border-l-2 border-amber-200">
                        {shift.incidents.map((incident, idx) => (
                          <div key={idx} className="bg-slate-50 rounded p-3 text-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={incident.type === 'theft' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {formatIncidentType(incident.type)}
                                </Badge>
                                {incident.timestamp && (
                                  <span className="text-xs text-slate-500">
                                    {format(parseISO(incident.timestamp), 'HH:mm')}
                                  </span>
                                )}
                              </div>
                              {incident.type === 'theft' && incident.amount > 0 && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                  {incident.amount}€
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-slate-700 mb-2">
                              <strong>Kirjeldus:</strong> {incident.description}
                            </div>
                            
                            {incident.type === 'theft' && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600 mb-2">
                                <div><strong>Sugu:</strong> {formatGender(incident.gender)}</div>
                                <div><strong>Erivahendid:</strong> {incident.special_tools_used ? 'Jah' : 'Ei'}</div>
                                <div><strong>Tulemus:</strong> {formatOutcome(incident.outcome)}</div>
                              </div>
                            )}

                            {/* Additional services for all incident types */}
                            {(incident.g4s_patrol_called || incident.ambulance_called) && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {incident.g4s_patrol_called && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    G4S patrull
                                  </Badge>
                                )}
                                {incident.ambulance_called && (
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                    Kiirabi
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-4 pl-4 border-l-2 border-green-200">
                        <div className="text-sm text-green-700 bg-green-50 rounded p-2">
                          ✅ Intsident-vaba vahetus
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
          <p>Kuu aruanne - {monthName}</p>
          <p>{format(new Date(), 'dd.MM.yyyy HH:mm', { locale: et })}</p>
        </div>
      </div>

      {/* Print Footer */}
      <div className="print-only mt-4 pt-2 border-t border-slate-200">
        <div className="text-center text-xs text-slate-600 space-y-1">
          <p>Articard Turvafirma | Litsents nr. TJT000000 | Tel: +372 000 0000 | info@articard.ee</p>
          <p>Kokkuvõte: {stats.totalHours.toFixed(1)}h | {stats.totalShifts} vahetust | {stats.totalIncidents} intsidenti</p>
          <p>Konfidentsiaalne dokument - ainult ametlikuks kasutamiseks</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;