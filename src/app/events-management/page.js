'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../FirebaseProvider';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Calendar, Search, Trash2, Edit, Eye, MapPin } from 'lucide-react';

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    category: '',
    maxParticipants: '',
    ngoId: '',
    ngoName: '',
    ngoEmail: ''
  });
  const [ngoList, setNgoList] = useState([]);
  const [emailStatus, setEmailStatus] = useState({ sent: false, message: '' });

  useEffect(() => {
    fetchEvents();
    fetchNGOs();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const eventsList = [];
      querySnapshot.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      
      setEvents(eventsList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again later.");
      setLoading(false);
    }
  };

  const fetchNGOs = async () => {
    try {
      const ngosRef = collection(db, "ngos");
      const q = query(ngosRef, where("status", "==", "approved"));
      const querySnapshot = await getDocs(q);
      
      const ngosList = [];
      querySnapshot.forEach((doc) => {
        ngosList.push({ 
          id: doc.id, 
          organizationName: doc.data().organizationName,
          email: doc.data().email
        });
      });
      
      setNgoList(ngosList);
    } catch (err) {
      console.error("Error fetching NGOs:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNGOChange = (e) => {
    const selectedNGO = ngoList.find(ngo => ngo.id === e.target.value);
    if (selectedNGO) {
      setFormData({
        ...formData,
        ngoId: selectedNGO.id,
        ngoName: selectedNGO.organizationName,
        ngoEmail: selectedNGO.email
      });
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.location || 
          !formData.date || !formData.time || !formData.category || 
          !formData.maxParticipants || !formData.ngoId) {
        setError("Please fill in all required fields");
        return;
      }

      const auth = getAuth();
      const user = auth.currentUser;

      // Create event in Firestore
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        category: formData.category,
        maxParticipants: parseInt(formData.maxParticipants),
        currentParticipants: 0,
        ngoId: formData.ngoId,
        ngoName: formData.ngoName,
        createdAt: Timestamp.now(),
        createdBy: user ? user.uid : 'admin',
        status: 'active'
      };

      const docRef = await addDoc(collection(db, "events"), eventData);
      console.log("Event created with ID: ", docRef.id);

      // Send email notification to NGO
      try {
        const apiUrl = '/api/email/event-notification';
        console.log('Sending event creation notification to:', formData.ngoEmail);
        
        // Create a controller to handle timeout and abort
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
        
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: {
                email: formData.ngoEmail,
                organizationName: formData.ngoName,
                eventTitle: formData.title,
                eventDate: formData.date,
                eventTime: formData.time,
                eventLocation: formData.location
              }
            }),
            signal: controller.signal
          });
          
          // Clear the timeout since the request completed
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error details:', errorData);
            throw new Error(`API responded with status ${response.status}: ${errorData.details || JSON.stringify(errorData)}`);
          }
          
          const result = await response.json();
          console.log('Event notification email result:', result);
          setEmailStatus({ sent: true, message: 'Email notification sent successfully' });
        } catch (fetchError) {
          // Clear the timeout if there was an error
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (emailError) {
        console.error('Error sending event notification email:', emailError);
        setEmailStatus({ sent: false, message: `Failed to send email: ${emailError.message}` });
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        location: '',
        date: '',
        time: '',
        category: '',
        maxParticipants: '',
        ngoId: '',
        ngoName: '',
        ngoEmail: ''
      });
      setShowCreateModal(false);
      
      // Refresh events list
      fetchEvents();
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    }
  };

  const filteredEvents = events.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchLower) ||
      event.ngoName.toLowerCase().includes(searchLower) ||
      event.location.toLowerCase().includes(searchLower) ||
      event.category.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => fetchEvents()} 
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Refresh Data
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2"
            >
              <Calendar size={16} />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              className="float-right font-bold"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        {emailStatus.message && (
          <div className={`${emailStatus.sent ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
            {emailStatus.message}
            <button 
              className="float-right font-bold"
              onClick={() => setEmailStatus({ sent: false, message: '' })}
            >
              &times;
            </button>
          </div>
        )}

        {/* Search Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search by Event Title, NGO, Location, or Category" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border border-gray-200 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Events Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Title</th>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">NGO</th>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Time</th>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Location</th>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Category</th>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Participants</th>
                    <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{event.ngoName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{event.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{event.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center">
                          <MapPin size={14} className="mr-1 text-gray-400" />
                          {event.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {event.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <span className="font-medium">{event.currentParticipants}</span>
                            <span className="mx-1">/</span>
                            <span>{event.maxParticipants}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{event.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No events found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Event</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={createEvent}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1">Event Title*</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">NGO*</label>
                  <select
                    name="ngoId"
                    value={formData.ngoId}
                    onChange={handleNGOChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select NGO</option>
                    {ngoList.map(ngo => (
                      <option key={ngo.id} value={ngo.id}>
                        {ngo.organizationName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Date*</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Time*</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Location*</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Category*</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Environment">Environment</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Community">Community</option>
                    <option value="Animal Welfare">Animal Welfare</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Arts & Culture">Arts & Culture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Max Participants*</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="1"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1">Description*</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    rows="4"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
   </AdminLayout>
  );
}