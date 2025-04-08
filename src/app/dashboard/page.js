'use client';
import { useEffect, useState } from "react";
import { db } from "../FirebaseProvider";
import { collection, getDocs, query, where } from "firebase/firestore";
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { useRouter } from 'next/navigation';
import AdminLayout from "@/components/layout/AdminLayout";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Users, Calendar, Building2, CheckSquare, TrendingUp, BarChart2, PieChartIcon, Activity } from 'lucide-react';

export default function Dashboard() {
  const [eventsData, setEventsData] = useState({});
  const [volunteersData, setVolunteersData] = useState({});
  const [ngoData, setNgoData] = useState({});
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Fetch events data with monthly trends
  const fetchEventsData = async () => {
    const eventsRef = collection(db, "events");
    const eventSnapshot = await getDocs(eventsRef);

    let totalEvents = 0;
    let totalJoined = 0;
    let eventCategories = {};
    let eventCountsByMonth = {};
    let joinedCountsByMonth = {};

    // Initialize months (0-11 for Jan-Dec)
    for (let i = 0; i < 12; i++) {
      eventCountsByMonth[i] = 0;
      joinedCountsByMonth[i] = 0;
    }

    eventSnapshot.forEach(doc => {
      const event = doc.data();
      const createdAt = event.createdAt ? event.createdAt.toDate() : null;

      if (!createdAt) {
        return;
      }

      const acceptedCounts = event.acceptedCount || 0;
      const categories = event.categories;

      totalEvents++;
      totalJoined += acceptedCounts;

      if (categories) {
        categories.forEach(category => {
          eventCategories[category] = (eventCategories[category] || 0) + 1;
        });
      }

      const month = createdAt.getMonth();
      eventCountsByMonth[month] = (eventCountsByMonth[month] || 0) + 1;
      joinedCountsByMonth[month] = (joinedCountsByMonth[month] || 0) + acceptedCounts;
    });

    // Convert month data to array format for charts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyEventData = Object.entries(eventCountsByMonth).map(([month, count]) => ({
      name: monthNames[parseInt(month)],
      events: count,
      joined: joinedCountsByMonth[month] || 0
    }));

    setEventsData({
      totalEvents,
      totalJoined,
      eventCategories,
      monthlyEventData,
    });
  };

  // Fetch volunteers data with detailed analytics
  const fetchVolunteersData = async () => {
    const volunteersRef = collection(db, "volunteers");
    const volunteerSnapshot = await getDocs(volunteersRef);

    let totalVolunteers = 0;
    let skillsCounts = {};
    let fieldOfStudyCounts = {};
    let educationLevelCounts = {};

    volunteerSnapshot.forEach(doc => {
      const volunteer = doc.data();
      totalVolunteers++;
      
      // Process skills
      if (volunteer.skills) {
        Object.keys(volunteer.skills).forEach(skillCategory => {
          volunteer.skills[skillCategory].forEach(skill => {
            skillsCounts[skill] = (skillsCounts[skill] || 0) + 1;
          });
        });
      }

      // Process field of study
      if (volunteer.fieldOfStudy) {
        fieldOfStudyCounts[volunteer.fieldOfStudy] = 
          (fieldOfStudyCounts[volunteer.fieldOfStudy] || 0) + 1;
      }

      // Process education level
      if (volunteer.highestDegree) {
        educationLevelCounts[volunteer.highestDegree] = 
          (educationLevelCounts[volunteer.highestDegree] || 0) + 1;
      }
    });

    setVolunteersData({
      totalVolunteers,
      skillsCounts,
      fieldOfStudyCounts,
      educationLevelCounts
    });
  };

  // Fetch NGO data with analytics
  const fetchNgoData = async () => {
    const ngosRef = collection(db, "ngo_profiles");
    const ngoSnapshot = await getDocs(ngosRef);

    let totalNgos = 0;
    let areaOfOperationCounts = {
      'Local': 0,
      'National': 0,
      'International': 0
    };
    
    let beneficiariesCounts = {
      'Children': 0,
      'Environment': 0,
      'Education': 0,
      'Healthcare': 0,
      'Elderly': 0,
      'Disaster Relief': 0,
      'Poverty Alleviation': 0,
      'Animal Welfare': 0
    };

    ngoSnapshot.forEach(doc => {
      const ngo = doc.data();
      totalNgos++;
      
      // Process areas of operation
      if (ngo.areasOfOperation && Array.isArray(ngo.areasOfOperation)) {
        ngo.areasOfOperation.forEach(area => {
          if (areaOfOperationCounts.hasOwnProperty(area)) {
            areaOfOperationCounts[area]++;
          }
        });
      }
      
      // Process target beneficiaries
      if (ngo.targetBeneficiaries && Array.isArray(ngo.targetBeneficiaries)) {
        ngo.targetBeneficiaries.forEach(beneficiary => {
          if (beneficiariesCounts.hasOwnProperty(beneficiary)) {
            beneficiariesCounts[beneficiary]++;
          }
        });
      }
    });

    setNgoData({
      totalNgos,
      areaOfOperationCounts,
      beneficiariesCounts
    });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEventsData(), fetchVolunteersData(), fetchNgoData()])
      .finally(() => setLoading(false));
  }, []);

  // Prepare data for charts
  const eventCategoriesData = eventsData.eventCategories ?
    Object.keys(eventsData.eventCategories).map(category => ({
      name: category,
      count: eventsData.eventCategories[category]
    })) : [];

  const skillsData = volunteersData.skillsCounts ?
    Object.entries(volunteersData.skillsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Limit to top 10 skills for better visualization
      .map(([skill, count]) => ({
        name: skill,
        count: count
      })) : [];

  const fieldOfStudyData = volunteersData.fieldOfStudyCounts ?
    Object.keys(volunteersData.fieldOfStudyCounts).map(field => ({
      name: field,
      count: volunteersData.fieldOfStudyCounts[field]
    })) : [];

  const educationLevelData = volunteersData.educationLevelCounts ?
    Object.keys(volunteersData.educationLevelCounts).map(level => ({
      name: level,
      count: volunteersData.educationLevelCounts[level]
    })) : [];

  const areaOfOperationData = ngoData.areaOfOperationCounts ?
    Object.keys(ngoData.areaOfOperationCounts).map(area => ({
      name: area,
      count: ngoData.areaOfOperationCounts[area]
    })) : [];

  const beneficiariesData = ngoData.beneficiariesCounts ?
    Object.keys(ngoData.beneficiariesCounts).map(beneficiary => ({
      name: beneficiary,
      count: ngoData.beneficiariesCounts[beneficiary]
    })) : [];

  // Colors for charts - simplified and more consistent color scheme
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-5 w-5" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="h-5 w-5" /> },
    { id: 'volunteers', label: 'Volunteers', icon: <Users className="h-5 w-5" /> },
    { id: 'ngos', label: 'NGOs', icon: <Building2 className="h-5 w-5" /> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8"> {/* Increased spacing between sections */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <button 
            onClick={() => {
              setLoading(true);
              Promise.all([fetchEventsData(), fetchVolunteersData(), fetchNgoData()])
                .finally(() => setLoading(false));
            }} 
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Total Volunteers"
                value={volunteersData.totalVolunteers || 0}
                icon={<Users className="text-indigo-500" size={24} />}
                description="Registered volunteers"
              />
              <DashboardCard
                title="Total Events"
                value={eventsData.totalEvents || 0}
                icon={<Calendar className="text-emerald-500" size={24} />}
                description="Created events"
              />
              <DashboardCard
                title="Event Participations"
                value={eventsData.totalJoined || 0}
                icon={<TrendingUp className="text-amber-500" size={24} />}
                description="Total volunteer participations"
              />
              <DashboardCard
                title="NGOs"
                value={ngoData.totalNgos || 0}
                icon={<Building2 className="text-rose-500" size={24} />}
                description="Registered organizations"
              />
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Monthly Events Trend */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium mb-4">Monthly Events Created</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={eventsData.monthlyEventData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="events" stroke="#4f46e5" strokeWidth={2} name="Events Created" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Monthly Volunteer Participation */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium mb-4">Monthly Volunteer Participations</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={eventsData.monthlyEventData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="joined" stroke="#10b981" strokeWidth={2} name="Volunteers Joined" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                 
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button 
                       // onClick={() => router.push('/ngo-approval')} 
                      //  className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg flex items-center space-x-3 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <CheckSquare size={24} />
                        <span>NGO Approvals</span>
                      </button>
                      <button 
                      //  onClick={() => router.push('/events-management')} 
                      //  className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg flex items-center space-x-3 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                       
                        <Calendar size={24} />
                      <span>Manage Events</span>
                      </button>
                      <button 
                       // onClick={() => router.push('/volunteer-accounts')} 
                       // className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg flex items-center space-x-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        <Users size={24} />
                        <span>Volunteer Accounts</span>
                      </button>
                      <button 
                       // onClick={() => router.push('/ngo-accounts')} 
                       // className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-lg flex items-center space-x-3 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                      >
                        <Building2 size={24} />
                        <span>NGO Accounts</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div className="space-y-8">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold mb-8 text-gray-800 dark:text-gray-100">Events Analytics</h2>
                    
                    {/* First row - Monthly trends */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                      {/* Monthly Events Trend */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300 flex items-center">
                          <Calendar className="mr-2 h-5 w-5 text-indigo-500" />
                          Monthly Events Created
                        </h3>
                        <div className="h-96"> {/* Increased height for better visualization */}
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={eventsData.monthlyEventData || []} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                              <Legend wrapperStyle={{ paddingTop: '10px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="events" 
                                stroke="#4f46e5" 
                                strokeWidth={3} 
                                name="Events Created" 
                                dot={{ stroke: '#4f46e5', strokeWidth: 2, r: 4, fill: '#fff' }}
                                activeDot={{ stroke: '#4f46e5', strokeWidth: 2, r: 6, fill: '#4f46e5' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Monthly Volunteer Participation */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300 flex items-center">
                          <Users className="mr-2 h-5 w-5 text-emerald-500" />
                          Monthly Volunteer Participations
                        </h3>
                        <div className="h-96"> {/* Increased height for better visualization */}
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={eventsData.monthlyEventData || []} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                              <Legend wrapperStyle={{ paddingTop: '10px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="joined" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                name="Volunteers Joined" 
                                dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#fff' }}
                                activeDot={{ stroke: '#10b981', strokeWidth: 2, r: 6, fill: '#10b981' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    {/* Second row - Categories */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300 flex items-center">
                        <PieChartIcon className="mr-2 h-5 w-5 text-amber-500" />
                        Event Categories Distribution
                      </h3>
                      <div className="h-96"> {/* Increased height for better visualization */}
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={eventCategoriesData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="count" name="Events" radius={[4, 4, 0, 0]}>
                              {eventCategoriesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Volunteers Tab */}
              {activeTab === 'volunteers' && (
                <div className="space-y-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-6">Volunteer Analytics</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Top Volunteer Skills Chart */}
                      <div className="h-80">
                        <h3 className="text-lg font-medium mb-4">Top Volunteer Skills</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={skillsData} 
                              dataKey="count" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={80} 
                              label
                            >
                              {skillsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Field of Study Chart */}
                      <div className="h-80">
                        <h3 className="text-lg font-medium mb-4">Fields of Study</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={fieldOfStudyData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" />
                            <YAxis dataKey="name" type="category" width={120} stroke="#6b7280" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="Volunteers">
                              {fieldOfStudyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Education Level Chart */}
                      <div className="h-80">
                        <h3 className="text-lg font-medium mb-4">Education Levels</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={educationLevelData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="Volunteers">
                              {educationLevelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NGOs Tab */}
              {activeTab === 'ngos' && (
                <div className="space-y-10">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-8">NGO Analytics</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Area of Operation Chart */}
                      <div className="h-96 p-4">
                        <h3 className="text-lg font-medium mb-6">Area of Operation</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                            <Pie 
                              data={areaOfOperationData} 
                              dataKey="count" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={100} 
                              label
                              paddingAngle={2}
                            >
                              {areaOfOperationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Target Beneficiaries Chart */}
                      <div className="h-96 p-4">
                        <h3 className="text-lg font-medium mb-6">Target Beneficiaries</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={beneficiariesData} 
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" padding={{ left: 10, right: 10 }} />
                            <YAxis dataKey="name" type="category" width={160} stroke="#6b7280" />
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                            <Bar dataKey="count" name="NGOs" barSize={20}>
                              {beneficiariesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

