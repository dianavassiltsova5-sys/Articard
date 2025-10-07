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

  const formatOutcome = (outcome) => {
    switch (outcome) {
      case 'vabastatud': return 'Vabastatud';
      case 'maksis_vabastatud': return 'Maksis';
      case 'politsei': return 'Politsei';
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

      {/* Monthly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Kogu tunnid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalHours.toFixed(1)}
            </div>
            <p className="text-sm text-slate-600">tundi kokku</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Vahetused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalShifts}
            </div>
            <p className="text-sm text-slate-600">vahetust</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Intsidendid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats.totalIncidents}
            </div>
            <p className="text-sm text-slate-600">kokku ({stats.theftIncidents} vargust)</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Vargused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalTheftAmount.toFixed(0)}€
            </div>
            <p className="text-sm text-slate-600">kahju summa</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Turvamehed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.guards.map((guard, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary">{guard}</Badge>
                  <span className="text-sm text-slate-600">
                    ({monthlyShifts.filter(s => s.guard_name === guard).length} vahetust)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Objektid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.objects.map((object, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary">{object}</Badge>
                  <span className="text-sm text-slate-600">
                    ({monthlyShifts.filter(s => s.object_name === object).length} vahetust)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Shifts Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Detailne vahetuste ülevaade</CardTitle>
          <CardDescription>
            Kõik {monthName} vahetused kronoloogilises järjekorras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyShifts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="monthly-shifts-table">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-medium">Kuupäev</th>
                    <th className="text-left py-2 font-medium">Turvamees</th>
                    <th className="text-left py-2 font-medium">Objekt</th>
                    <th className="text-left py-2 font-medium">Aeg</th>
                    <th className="text-left py-2 font-medium">Tunnid</th>
                    <th className="text-left py-2 font-medium">Intsidendid</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyShifts.map((shift, index) => {
                    const startTime = new Date(`2000-01-01T${shift.start_time}`);
                    const endTime = new Date(`2000-01-01T${shift.end_time}`);
                    let hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
                    if (hoursWorked < 0) hoursWorked += 24;
                    
                    return (
                      <tr key={shift.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3">
                          {format(parseISO(shift.date), 'dd.MM.yyyy', { locale: et })}
                        </td>
                        <td className="py-3">{shift.guard_name}</td>
                        <td className="py-3">{shift.object_name}</td>
                        <td className="py-3">{shift.start_time} - {shift.end_time}</td>
                        <td className="py-3 font-medium">{hoursWorked.toFixed(1)}h</td>
                        <td className="py-3">
                          {shift.incidents && shift.incidents.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {shift.incidents.map((incident, idx) => (
                                <Badge 
                                  key={idx}
                                  variant={incident.type === 'theft' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {formatIncidentType(incident.type)}
                                  {incident.type === 'theft' && ` (${incident.amount}€)`}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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