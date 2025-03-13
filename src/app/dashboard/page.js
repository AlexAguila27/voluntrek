'use client';
import { useEffect, useState } from "react";
import { db } from "../FirebaseProvider";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [eventsData, setEventsData] = useState({});
  const [volunteersData, setVolunteersData] = useState({});
  const [username, setUsername] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false); // Track dropdown state
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const fetchEventsData = async () => {
    const eventsRef = collection(db, "events");
    const eventSnapshot = await getDocs(eventsRef);

    let totalEvents = 0;
    let totalJoined = 0;
    let eventCategories = {};
    let eventCountsByMonth = {};

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
    });

    setEventsData({
      totalEvents,
      totalJoined,
      eventCategories,
      eventCountsByMonth,
    });
  };

  const fetchVolunteersData = async () => {
    const volunteersRef = collection(db, "volunteers");
    const volunteerSnapshot = await getDocs(volunteersRef);

    let skillsCounts = { /* predefined categories */ };
    let fieldOfStudyCounts = { /* predefined categories */ };
    let degreeCounts = { /* predefined categories */ };

    volunteerSnapshot.forEach(doc => {
      const volunteer = doc.data();
      const { skills, fieldOfStudy, highestDegree } = volunteer;

      if (skills) {
        Object.keys(skills).forEach(skillCategory => {
          skills[skillCategory].forEach(skill => {
            const normalizedSkill = skill.replace(/\s/g, '').replace(/&/g, '');
            skillsCounts[normalizedSkill] = (skillsCounts[normalizedSkill] || 0) + 1;
          });
        });
      }

      if (fieldOfStudy) {
        const normalizedField = fieldOfStudy.replace(/\s/g, '').replace('and', '');
        fieldOfStudyCounts[normalizedField] = (fieldOfStudyCounts[normalizedField] || 0) + 1;
      }

      if (highestDegree) {
        const normalizedDegree = highestDegree.replace(/\s/g, '').replace("Ph.D.", "Doctorate");
        degreeCounts[normalizedDegree] = (degreeCounts[normalizedDegree] || 0) + 1;
      }
    });

    setVolunteersData({ skillsCounts, fieldOfStudyCounts, degreeCounts });
  };

  useEffect(() => {
    fetchEventsData();
    fetchVolunteersData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    router.push('/');
  };

  const eventCategoriesData = eventsData.eventCategories ?
    Object.keys(eventsData.eventCategories).map(categories => ({
      name: categories,
      count: eventsData.eventCategories[categories]
    })) : [];

  const skillsData = volunteersData.skillsCounts ?
    Object.keys(volunteersData.skillsCounts).map(skill => ({
      name: skill,
      count: volunteersData.skillsCounts[skill]
    })) : [];

  const fieldOfStudyData = volunteersData.fieldOfStudyCounts ?
    Object.keys(volunteersData.fieldOfStudyCounts).map(field => ({
      name: field,
      count: volunteersData.fieldOfStudyCounts[field]
    })) : [];

  const degreeData = volunteersData.degreeCounts ?
    Object.keys(volunteersData.degreeCounts).map(degree => ({
      name: degree,
      count: volunteersData.degreeCounts[degree]
    })) : [];

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(prevState => !prevState);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center bg-blue-600 p-4 text-white">
        <div className="text-xl">Admin Dashboard</div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-white hover:underline">Dashboard</Link>
          <Link href="/ngo-accounts" className="text-white hover:underline">NGO Accounts</Link>
          <Link href="/volunteer-accounts" className="text-white hover:underline">Volunteer Accounts</Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button onClick={toggleDropdown} className="flex items-center space-x-2">
              <img src="https://www.w3schools.com/w3images/avatar2.png"  alt="Profile" className="w-8 h-8 rounded-full" />
              <span>{username}</span>
            </button>
            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white text-black rounded-lg shadow-lg w-48">
                <div className="py-2 px-4">{username}</div>
                <div className="py-2 px-4 cursor-pointer hover:bg-gray-200" onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">NGO Analytics</h2>

        {/* Events Data */}
        <h3>Total Events</h3>
        <div className="mb-6">{eventsData.totalEvents} Events</div>

        <h3>Total Events Joined</h3>
        <div className="mb-6">{eventsData.totalJoined} Volunteers Joined on all events</div>

        {/* Event Categories Bar Chart */}
        <h3>Event Categories</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={eventCategoriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>

        {/* Volunteers Analytics */}
        <h2 className="text-2xl font-semibold mb-6 mt-10">Volunteer Analytics</h2>

        {/* Volunteer Skills Pie Chart */}
        <h3>Volunteer Skills</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={skillsData} dataKey="count" nameKey="name" outerRadius={150} fill="#82ca9d" label />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Field of Study Bar Chart */}
        <h3>Field of Study</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={fieldOfStudyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>

        {/* Educational Degree Bar Chart */}
        <h3>Educational Degree</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={degreeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
