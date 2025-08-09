import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

type Slot = { day: string; start: string; end: string };

type Host = { name: string; avatar: string };

function Booking() {
  const { username } = useParams();
  const [host, setHost] = React.useState(null as Host | null);
  const [slots, setSlots] = React.useState([] as Slot[]);
  const [selected, setSelected] = React.useState(null as { day: string; start: string; end: string } | null);
  const [guestName, setGuestName] = React.useState('');
  const [guestEmail, setGuestEmail] = React.useState('');
  const [date, setDate] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/booking/availability/${username}`)
      .then(res => {
        setHost(res.data.host);
        setSlots(res.data.slots);
      })
      .catch(() => setError('Host not found'));
  }, [username]);

  const handleBook = async (e: any) => {
    e.preventDefault();
    setError(''); 
    setMessage('');
    setIsLoading(true);
    
    if (!selected || !date) {
      setError('Please select a time slot and date');
      setIsLoading(false);
      return;
    }
    
    const start = new Date(`${date}T${selected.start}`);
    const end = new Date(`${date}T${selected.end}`);
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/booking/book/${username}`, {
        guestName, guestEmail, start, end
      });
      setMessage('Booking successful! Check your email for the meeting details.');
      setGuestName('');
      setGuestEmail('');
      setDate('');
      setSelected(null);
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
        {/* Host Information */}
        <div className="text-center mb-8">
          <img 
            src={host.avatar} 
            alt={`${host.name}'s avatar`} 
            className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-white shadow-medium" 
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a meeting with {host.name}</h1>
          <p className="text-gray-600">Select an available time slot that works for you</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Time Slot Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>
            
            {slots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No available time slots at the moment.</p>
                <p className="text-sm mt-1">Please check back later or contact {host.name} directly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map(slot => (
                  <button
                    key={slot.day + slot.start}
                    type="button"
                    onClick={() => setSelected(slot)}
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      selected?.day === slot.day && selected?.start === slot.start
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{slot.day}</div>
                    <div className="text-sm text-gray-600">{slot.start} - {slot.end}</div>
                    {selected?.day === slot.day && selected?.start === slot.start && (
                      <div className="mt-2 flex items-center text-primary-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs font-medium">Selected</span>
                      </div>
                    )}
                  </button>
                ))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={today}
                  required
                  className="input-field"
                />
              </div>

              {selected && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-primary-800">
                        Selected: {selected.day} {date && new Date(date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-primary-600">
                        {selected.start} - {selected.end}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !selected || !date}
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