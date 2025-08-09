import React from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config.ts';

type Slot = { day: string; start: string; end: string };

type Host = { name: string; avatar: string };

type BookedSlot = {
  start: Date;
  end: Date;
};

function Booking() {
  const { username, slotType } = useParams();
  const [host, setHost] = React.useState(null as Host | null);
  const [slots, setSlots] = React.useState([] as Slot[]);
  const [bookedSlots, setBookedSlots] = React.useState([] as BookedSlot[]);
  const [currentSlotType, setCurrentSlotType] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState('');
  const [selectedSlot, setSelectedSlot] = React.useState(null as { start: string; end: string } | null);
  const [guestName, setGuestName] = React.useState('');
  const [guestEmail, setGuestEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  React.useEffect(() => {
    // Load availability and booked slots
    const loadData = async () => {
      try {
        // Get availability
        const endpoint = slotType 
          ? `${API_URL}/booking/availability/${username}/${slotType}`
          : `${API_URL}/booking/availability/${username}`;
        const availabilityRes = await axios.get(endpoint);
        setHost(availabilityRes.data.host);
        setSlots(availabilityRes.data.slots);
        setCurrentSlotType(availabilityRes.data.slotType || '');

        // Get booked slots
        const bookingsRes = await axios.get(`${API_URL}/booking/host/${username}/bookings`);
        setBookedSlots(bookingsRes.data.map((booking: any) => ({
          start: new Date(booking.start),
          end: new Date(booking.end)
        })));
      } catch (err) {
        setError(slotType ? 'Slot type not found' : 'Host not found');
      }
    };
    
    loadData();
  }, [username, slotType]);

  // Helper functions for calendar
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
    };

  // Helper function to create a Date object from selectedDate string in local timezone
  const createLocalDate = (dateString: string) => {
    const dateParts = dateString.split('-');
    return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  };

  const isDateAvailable = (date: Date) => {
    const dayName = getDayName(date);
    return slots.some(slot => slot.day === dayName);
  };

  const getAvailableSlotsForDate = (date: Date) => {
    const dayName = getDayName(date);
    const daySlots = slots.filter(slot => slot.day === dayName);
    
    // Filter out booked slots
    return daySlots.filter(slot => {
      // Create local date and time objects to avoid timezone conversion
      const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
        parseInt(slot.start.split(':')[0]), parseInt(slot.start.split(':')[1]));
      const slotEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
        parseInt(slot.end.split(':')[0]), parseInt(slot.end.split(':')[1]));
      
      return !bookedSlots.some(booked => 
        (slotStart >= booked.start && slotStart < booked.end) ||
        (slotEnd > booked.start && slotEnd <= booked.end) ||
        (slotStart <= booked.start && slotEnd >= booked.end)
      );
    });
  };

  const handleBook = async (e: any) => {
    e.preventDefault();
    setError(''); 
    setMessage('');
    setIsLoading(true);
    
    if (!selectedSlot || !selectedDate) {
      setError('Please select a date and time slot');
      setIsLoading(false);
      return;
    }
    
    // Create dates in local timezone to avoid UTC conversion issues
    const selectedDateObj = createLocalDate(selectedDate);
    const start = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 
      parseInt(selectedSlot.start.split(':')[0]), parseInt(selectedSlot.start.split(':')[1]));
    const end = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 
      parseInt(selectedSlot.end.split(':')[0]), parseInt(selectedSlot.end.split(':')[1]));
    
    try {
      await axios.post(`${API_URL}/booking/book/${username}`, {
        guestName, guestEmail, start, end
      });
      setMessage('Booking successful! Check your email for the meeting details.');
      setGuestName('');
      setGuestEmail('');
      setSelectedDate('');
      setSelectedSlot(null);
      
      // Refresh booked slots
      const bookingsRes = await axios.get(`${API_URL}/booking/host/${username}/bookings`);
      setBookedSlots(bookingsRes.data.map((booking: any) => ({
        start: new Date(booking.start),
        end: new Date(booking.end)
      })));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    console.log(error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  if (!host) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <button onClick={() => {setMessage(''); setError('');}} className="btn-primary w-full">
              Book Another Meeting
            </button>
            <Link to="/" className="btn-secondary w-full">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get today's date for minimum date selection
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <svg className="w-8 h-8 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span className="text-xl font-bold text-gray-900">Sched</span>
            </Link>
            {/* <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Sign in to create your own booking page
            </Link> */}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        {currentSlotType && (
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <a href={`/book/${username}`} className="hover:text-gray-700">{host.name}'s Calendar</a>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">{currentSlotType}</span>
            </nav>
          </div>
        )}

        {/* Host Information */}
        <div className="text-center mb-8">
          <img 
            src={host.avatar} 
            alt={`${host.name}'s avatar`} 
            className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-white shadow-medium" 
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book {currentSlotType ? `${currentSlotType} with` : 'a meeting with'} {host.name}
          </h1>
          <p className="text-gray-600">
            {currentSlotType 
              ? `Select an available ${currentSlotType.toLowerCase()} time slot that works for you`
              : 'Select an available time slot that works for you'
            }
          </p>
          {currentSlotType && (
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {currentSlotType}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendar View */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select a Date
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h4 className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {(() => {
                const daysInMonth = getDaysInMonth(currentMonth);
                const firstDay = getFirstDayOfMonth(currentMonth);
                const today = new Date();
                const days: any[] = [];
                
                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="p-2"></div>);
                }
                
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isPast = date < today;
                  const isAvailable = !isPast && isDateAvailable(date);
                  const isSelected = selectedDate === formatDate(date);
                  
                  days.push(
                    <button
                      key={day}
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedDate(formatDate(date));
                          setSelectedSlot(null); // Reset slot selection when date changes
                        }
                      }}
                      className={`p-2 text-sm rounded transition-all duration-200 ${
                        isPast 
                          ? 'text-gray-300 cursor-not-allowed'
                          : isAvailable
                            ? isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                            : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {day}
                    </button>
                  );
                }
                
                return days;
              })()}
            </div>
            
            {/* Available slots for selected date */}
            
            {selectedDate && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Available times for {createLocalDate(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                {(() => {
                  const availableSlots = getAvailableSlotsForDate(createLocalDate(selectedDate));
                  
                  if (availableSlots.length === 0) {
                    return (
                      <p className="text-sm text-gray-500">No available times for this date.</p>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 text-sm rounded border-2 transition-all duration-200 ${
                            selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {slot.start} - {slot.end}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
            
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  required
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Meeting details will be sent to this email
                </p>
              </div>

              {selectedSlot && selectedDate && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-primary-800">
                        Selected: {createLocalDate(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-primary-600">
                        {selectedSlot.start} - {selectedSlot.end}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !selectedSlot || !selectedDate}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l-6 2.5V21a1 1 0 001 1h14a1 1 0 001-1v-7.5L14 11" />
                    </svg>
                    Confirm Booking
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By booking, you'll receive a Google Calendar invitation with a Meet link
              </p>
            </form>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-lg mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l-6 2.5V21a1 1 0 001 1h14a1 1 0 001-1v-7.5L14 11" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Easy Booking</h4>
            <p className="text-sm text-gray-600">Simple and intuitive booking process</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-lg mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Email Confirmation</h4>
            <p className="text-sm text-gray-600">Instant email with meeting details</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-lg mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Video Ready</h4>
            <p className="text-sm text-gray-600">Automatic Google Meet integration</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking; 