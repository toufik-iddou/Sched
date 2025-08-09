import * as React from 'react';
import axios from 'axios';
import { API_URL } from '../config.ts';

type Slot = { 
  _id?: string;
  day: string; 
  start: string; 
  end: string;
  slotType?: string;
  slotId?: string;
  duration?: number;
};

type SlotGroup = {
  [slotType: string]: Slot[];
};

type BulkSlotForm = {
  days: string[];
  timeRanges: { start: string; end: string }[];
  interval: number;
  slotType: string;
};

const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const intervals = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
];

function Dashboard() {
  const [user, setUser] = React.useState(null as any);
  const [loading, setLoading] = React.useState(true);
  const [availability, setAvailability] = React.useState([] as Slot[]);
  const [groupedSlots, setGroupedSlots] = React.useState({} as SlotGroup);
  const [slot, setSlot] = React.useState({ day: '', start: '', end: '' } as Slot);
  const [bookings, setBookings] = React.useState([] as any[]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [showBulkForm, setShowBulkForm] = React.useState(false);
  const [bulkForm, setBulkForm] = React.useState({
    days: [] as string[],
    timeRanges: [{ start: '09:00', end: '17:00' }],
    interval: 30,
    slotType: ''
  });
  const [isCreatingSlots, setIsCreatingSlots] = React.useState(false);

  React.useEffect(() => {
    setLoading(false)
    const token = localStorage.getItem('token');
    if (!token) return;
    console.log(`${API_URL}/user/me`)
    axios.get(`${API_URL}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setUser(res.data))
      .catch((err) => {
        setUser(null);
        setLoading(false)})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Get all availability slots
      axios.get(`${API_URL}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => setAvailability(res.data));

      // Get grouped slots by type
      axios.get(`${API_URL}/availability/grouped`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => setGroupedSlots(res.data));
    }
  }, [user]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      axios.get(`${API_URL}/user/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => setBookings(res.data));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Logged In</h3>
          <p className="text-gray-600 mb-4">Please sign in to access your dashboard.</p>
          <a href="/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleSlotChange = (e: any) => {
    setSlot({ ...slot, [e.target.name]: e.target.value });
  };

  const handleAddSlot = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.post(`${API_URL}/availability`, slot, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setAvailability((prev) => {
        const filtered = prev.filter((s) => s.day !== slot.day);
        return [...filtered, slot];
      });
      
      setSlot({ day: '', start: '', end: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding slot:', error);
    }
  };

  const handleDeleteSlot = async (day: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(`${API_URL}/availability/${day}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailability((prev) => prev.filter((s) => s.day !== day));
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const handleDeleteSlotType = async (slotType: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(`${API_URL}/availability/type/${encodeURIComponent(slotType)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh data
      const availRes = await axios.get(`${API_URL}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailability(availRes.data);
      
      const groupedRes = await axios.get(`${API_URL}/availability/grouped`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupedSlots(groupedRes.data);
    } catch (error) {
      console.error('Error deleting slot type:', error);
    }
  };

  const handleBulkFormChange = (field: keyof BulkSlotForm, value: any) => {
    setBulkForm(prev => ({ ...prev, [field]: value }));
  };

  const addTimeRange = () => {
    setBulkForm(prev => ({
      ...prev,
      timeRanges: [...prev.timeRanges, { start: '09:00', end: '17:00' }]
    }));
  };

  const removeTimeRange = (index: number) => {
    setBulkForm(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.filter((_, i) => i !== index)
    }));
  };

  const updateTimeRange = (index: number, field: 'start' | 'end', value: string) => {
    setBulkForm(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.map((range, i) => 
        i === index ? { ...range, [field]: value } : range
      )
    }));
  };

  const toggleDay = (day: string) => {
    setBulkForm(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleBulkCreate = async (e: any) => {
    e.preventDefault();
    if (!bulkForm.slotType.trim() || bulkForm.days.length === 0 || bulkForm.timeRanges.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreatingSlots(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.post(`${API_URL}/availability/bulk`, bulkForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(`Successfully created ${response.data.count} time slots!`);
      
      // Refresh data
      const availRes = await axios.get(`${API_URL}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailability(availRes.data);
      
      const groupedRes = await axios.get(`${API_URL}/availability/grouped`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupedSlots(groupedRes.data);

      // Reset form
      setBulkForm({
        days: [],
        timeRanges: [{ start: '09:00', end: '17:00' }],
        interval: 30,
        slotType: ''
      });
      setShowBulkForm(false);

    } catch (error: any) {
      console.error('Error creating bulk slots:', error);
      alert(error.response?.data?.message || 'Failed to create slots');
    } finally {
      setIsCreatingSlots(false);
    }
  };

  const calculatePreviewSlots = () => {
    if (!bulkForm.days.length || !bulkForm.timeRanges.length) return 0;
    
    let totalSlots = 0;
    for (const range of bulkForm.timeRanges) {
      const start = new Date(`1970-01-01T${range.start}:00`);
      const end = new Date(`1970-01-01T${range.end}:00`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
      const slotsPerRange = Math.floor(duration / bulkForm.interval);
      totalSlots += slotsPerRange;
    }
    
    return totalSlots * bulkForm.days.length;
  };

  const bookingUrl = `${window.location.origin}/book/${user.name}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white/95 backdrop-blur-md shadow-medium border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">Sched</span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 px-4 py-2 bg-gray-50 rounded-xl">
                <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-medium" />
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Dashboard</p>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome back, <span className="text-gradient">{user.name}!</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">Manage your availability and view upcoming bookings.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Booking Link Card */}
          <div className="lg:col-span-1">
            <div className="card card-hover">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Booking Link</h3>
                <p className="text-gray-600">Share this link to let others book time with you</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Share this link with others:</p>
                  <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-primary-300 transition-all duration-200">
                    <span className="text-sm text-gray-800 truncate font-mono">{bookingUrl}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(bookingUrl)}
                      className="ml-3 p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Preview Booking Page
                </a>
              </div>
            </div>
          </div>

          {/* Availability Section */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Availability Management</h3>
                  <p className="text-gray-600">Create and manage your booking slots</p>
                </div>
                <div className="flex space-x-3">
                <button 
                    onClick={() => setShowBulkForm(!showBulkForm)}
                  className="btn-primary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                    Create Bulk Slots
                  </button>
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-secondary"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Single Slot
                </button>
                </div>
              </div>

              {/* Add Slot Form */}
              {showAddForm && (
                <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 mb-8 border border-primary-100 animate-fade-in">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Time Slot</h4>
                  <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Day</label>
                      <select name="day" value={slot.day} onChange={handleSlotChange} required className="select-field">
                        <option value="">Select day</option>
                        {allDays.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                      <input name="start" type="time" value={slot.start} onChange={handleSlotChange} required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                      <input name="end" type="time" value={slot.end} onChange={handleSlotChange} required className="input-field" />
                    </div>
                    <div className="flex items-end space-x-3">
                      <button type="submit" className="btn-primary">Save</button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Bulk Slot Creation Form */}
              {showBulkForm && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100 animate-fade-in">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    <svg className="w-6 h-6 inline mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Create Bulk Time Slots (Calendly Style)
                  </h4>
                  
                  <form onSubmit={handleBulkCreate} className="space-y-6">
                    {/* Slot Type Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Slot Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Client Meeting, Consultation, etc."
                        value={bulkForm.slotType}
                        onChange={(e) => handleBulkFormChange('slotType', e.target.value)}
                        required 
                        className="input-field"
                      />
                      <p className="text-xs text-gray-500 mt-1">This will be used to group your slots and create unique booking links</p>
                    </div>

                    {/* Day Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Select Work Days *</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {allDays.map((day) => (
                          <label key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={bulkForm.days.includes(day)}
                              onChange={() => toggleDay(day)}
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                            />
                            <span className="ml-2 text-sm text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Time Ranges */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-gray-700">Available Time Ranges *</label>
                        <button
                          type="button"
                          onClick={addTimeRange}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          + Add Time Range
                        </button>
                      </div>
                      <div className="space-y-3">
                        {bulkForm.timeRanges.map((range, index) => (
                          <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg border">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-600 mb-1">From</label>
                              <input
                                type="time"
                                value={range.start}
                                onChange={(e) => updateTimeRange(index, 'start', e.target.value)}
                                className="input-field"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-600 mb-1">To</label>
                              <input
                                type="time"
                                value={range.end}
                                onChange={(e) => updateTimeRange(index, 'end', e.target.value)}
                                className="input-field"
                              />
                            </div>
                            {bulkForm.timeRanges.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTimeRange(index)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Add multiple time ranges to handle breaks (e.g., 9-12 and 1:30-5)</p>
                    </div>

                    {/* Interval Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Slot Duration *</label>
                      <select 
                        value={bulkForm.interval}
                        onChange={(e) => handleBulkFormChange('interval', parseInt(e.target.value))}
                        className="select-field"
                      >
                        {intervals.map((interval) => (
                          <option key={interval.value} value={interval.value}>{interval.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Preview */}
                    {bulkForm.days.length > 0 && bulkForm.timeRanges.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="text-sm font-semibold text-green-800 mb-2">Preview</h5>
                        <p className="text-sm text-green-700">
                          This will create approximately <strong>{calculatePreviewSlots()} individual slots</strong> across {bulkForm.days.length} day(s)
                        </p>
                        <div className="mt-2">
                          <p className="text-xs text-green-600">Selected days: {bulkForm.days.join(', ')}</p>
                          <p className="text-xs text-green-600">
                            Time ranges: {bulkForm.timeRanges.map(r => `${r.start}-${r.end}`).join(', ')}
                          </p>
                          <p className="text-xs text-green-600">Slot duration: {bulkForm.interval} minutes</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <button 
                        type="submit" 
                        disabled={isCreatingSlots}
                        className="btn-primary disabled:opacity-50"
                      >
                        {isCreatingSlots ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creating Slots...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Create {calculatePreviewSlots()} Slots
                          </>
                        )}
                      </button>
                      <button type="button" onClick={() => setShowBulkForm(false)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Slot Types List */}
              <div className="space-y-6">
                {Object.keys(groupedSlots).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No availability set yet</h4>
                    <p className="text-gray-600 mb-4">Create your first time slots using the bulk slot creator above!</p>
                    <button 
                      onClick={() => setShowBulkForm(true)}
                      className="btn-primary"
                    >
                      Get Started
                    </button>
                  </div>
                ) : (
                  Object.entries(groupedSlots).map(([slotType, slots]) => {
                    const slotsList = slots as Slot[];
                    const slotTypeSlug = slotType.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const bookingUrl = `${window.location.origin}/book/${user.name}/${slotTypeSlug}`;
                    const uniqueDays = [...new Set(slotsList.map(slot => slot.day))];
                    
                    return (
                      <div key={slotType} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-primary-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
                              <h5 className="text-xl font-bold text-gray-900">{slotType}</h5>
                              <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {slotsList.length} slots
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">
                              Available on: {uniqueDays.join(', ')} • {slotsList[0]?.duration || 30} min slots
                            </p>
                            
                            {/* Unique Booking Link */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">Unique booking link for this slot type:</p>
                              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                                <span className="text-sm text-gray-800 truncate font-mono flex-1 mr-2">{bookingUrl}</span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(bookingUrl)}
                                    className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-all duration-200"
                                    title="Copy link"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <a 
                                    href={bookingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-all duration-200"
                                    title="Preview"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                        </div>
                      </div>
                          
                      <button 
                            onClick={() => handleDeleteSlotType(slotType)}
                            className="btn-danger ml-4 opacity-75 hover:opacity-100"
                            title="Delete all slots of this type"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                        
                        {/* Sample time slots preview */}
                        <div className="mt-4">
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center">
                              <svg className="w-4 h-4 mr-1 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              View time slots ({slotsList.length} total)
                            </summary>
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                              {slotsList.slice(0, 24).map((slot, index) => (
                                <div key={index} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 text-center">
                                  <div className="font-medium text-gray-900">{slot.day.slice(0, 3)}</div>
                                  <div className="text-gray-600">{slot.start}-{slot.end}</div>
                                </div>
                              ))}
                              {slotsList.length > 24 && (
                                <div className="text-xs text-gray-500 text-center py-1">
                                  +{slotsList.length - 24} more...
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mt-12">
          <div className="card">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upcoming Bookings</h3>
              <p className="text-gray-600">Your scheduled meetings and appointments</p>
            </div>
            
            <div className="space-y-6">
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l-6 2.5V21a1 1 0 001 1h14a1 1 0 001-1v-7.5L14 11" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No upcoming bookings yet</h4>
                  <p className="text-gray-600 mb-4">Share your booking link to start receiving appointments!</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(bookingUrl)}
                    className="btn-secondary"
                  >
                    Copy Booking Link
                  </button>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-100 rounded-2xl hover:border-primary-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{booking.guestName}</p>
                        <p className="text-gray-600 font-medium">{booking.guestEmail}</p>
                        <p className="text-sm text-gray-500 font-medium">{new Date(booking.start).toLocaleString()}</p>
                      </div>
                    </div>
                    {booking.meetLink && (
                      <a 
                        href={booking.meetLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Join Meeting
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 