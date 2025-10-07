import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Calendar as CalendarIcon, Clock, AlertTriangle, FileText, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { et } from 'date-fns/locale';
import { toast } from 'sonner';

const Dashboard = ({ shifts, loading, onCreateShift, onDeleteShift }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const dateKey = shift.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(shift);
    return acc;
  }, {});

  // Get shifts for selected date
  const selectedDateShifts = selectedDate 
    ? shiftsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  // Calculate monthly statistics
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const monthlyStats = monthDays.reduce((stats, day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayShifts = shiftsByDate[dayKey] || [];
    
    dayShifts.forEach(shift => {
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
    });
    
    return stats;
  }, { totalHours: 0, totalShifts: 0, totalIncidents: 0 });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleCreateShift = () => {
    navigate('/shift/new');
  };

  const handleViewShift = (shiftId) => {
    navigate(`/shift/${shiftId}`);
  };

  const handleViewMonthlyReport = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    navigate(`/monthly-report/${year}/${month}`);
  };

  const handleDeleteShift = async (shiftId, shiftName) => {
    try {
      await onDeleteShift(shiftId);
      toast.success('Vahetus kustutatud!');
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Viga vahetuse kustutamisel');
    }
  };

  // Custom day content for calendar
  const dayContent = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayShifts = shiftsByDate[dateKey] || [];
    const hasIncidents = dayShifts.some(shift => shift.incidents && shift.incidents.length > 0);
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className="text-sm">{format(date, 'd')}</span>
        {dayShifts.length > 0 && (
          <div className="absolute bottom-0 right-0 flex gap-1">
            <div className={`w-2 h-2 rounded-full ${
              hasIncidents ? 'bg-amber-500' : 'bg-blue-500'
            }`} />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="spinner" />
        <span className="ml-2 text-slate-600">Andmete laadimine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Tunnid kuus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {monthlyStats.totalHours.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-green-600" />
              Vahetused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {monthlyStats.totalShifts}
            </div>
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
              {monthlyStats.totalIncidents}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Aruanded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleViewMonthlyReport}
              className="w-full btn-secondary"
              variant="outline"
              data-testid="monthly-report-btn"
            >
              Kuu aruanne
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Töövahetus Kalender</span>
                <Button 
                  onClick={handleCreateShift}
                  className="btn-primary"
                  data-testid="create-shift-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Uus vahetus
                </Button>
              </CardTitle>
              <CardDescription>
                Kliki kuupäevale, et näha vahetuse detaile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                locale={et}
                className="rounded-md border"
                components={{
                  Day: ({ date, ...props }) => (
                    <button 
                      {...props}
                      className="calendar-day p-3 text-sm hover:bg-slate-100 rounded-md transition-colors"
                      data-testid={`calendar-day-${format(date, 'yyyy-MM-dd')}`}
                    >
                      {dayContent(date)}
                    </button>
                  )
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Daily Details */}
        <div className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'dd. MMMM yyyy', { locale: et }) : 'Vali kuupäev'}
              </CardTitle>
              <CardDescription>
                {selectedDateShifts.length > 0 
                  ? `${selectedDateShifts.length} vahetus(t)` 
                  : 'Vahetusi ei ole'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateShifts.length > 0 ? (
                <div className="space-y-3" data-testid="daily-shifts">
                  {selectedDateShifts.map((shift) => (
                    <div 
                      key={shift.id} 
                      className="border rounded-lg p-3 hover:bg-slate-50 transition-colors"
                      data-testid={`shift-card-${shift.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="font-medium text-slate-800 cursor-pointer hover:text-blue-600"
                          onClick={() => handleViewShift(shift.id)}
                        >
                          {shift.guard_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={shift.incidents && shift.incidents.length > 0 ? 'destructive' : 'secondary'}
                          >
                            {shift.start_time} - {shift.end_time}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewShift(shift.id)}>
                                Vaata detaile
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 focus:text-red-600"
                                    data-testid={`delete-shift-trigger-${shift.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Kustuta vahetus
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Kas oled kindel?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      See tegevus kustutab vahetuse "{shift.guard_name}" ({format(parseISO(shift.date), 'dd.MM.yyyy')}) 
                                      ja kõik sellega seotud intsidendid jäädavalt. Seda toimingut ei saa tagasi pöörata.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Tühista</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteShift(shift.id, shift.guard_name)}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-testid={`confirm-delete-shift-${shift.id}`}
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
                      <p 
                        className="text-sm text-slate-600 mb-2 cursor-pointer hover:text-blue-600"
                        onClick={() => handleViewShift(shift.id)}
                      >
                        Objekt: {shift.object_name}
                      </p>
                      {shift.incidents && shift.incidents.length > 0 && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">
                            {shift.incidents.length} intsident(i)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Sellel päeval vahetusi ei ole</p>
                  <Button 
                    onClick={handleCreateShift}
                    variant="outline" 
                    className="mt-3"
                    data-testid="create-shift-empty-btn"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Lisa vahetus
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;