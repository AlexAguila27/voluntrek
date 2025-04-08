'use client';
import React, { useEffect, useState } from 'react';
import { db, auth } from '../FirebaseProvider';
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Users, Search, Trash2, Edit, Mail, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { ExpandableCard, ExpandableCardContent } from '@/components/ui/expandable-card';

export default function VolunteerAccounts() {
  const [volunteerAccounts, setVolunteerAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [username, setUsername] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const router = useRouter();

  // Get username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Fetch volunteer accounts from "users" collection where role == "volunteer"
  useEffect(() => {
    fetchVolunteerAccounts();
  }, []);

  const fetchVolunteerAccounts = async () => {
    const usersRef = collection(db, "users");
    const volunteerQuery = query(usersRef, where("role", "==", "volunteer"));
    const volunteerSnapshot = await getDocs(volunteerQuery);
    
    const volunteerList = [];

    for (const docSnap of volunteerSnapshot.docs) {
      const userData = docSnap.data();
      const volunteerId = docSnap.id;

      // Fetch additional data from volunteers collection
      const volunteerDocRef = doc(db, "volunteers", volunteerId);
      const volunteerDocSnap = await getDoc(volunteerDocRef);

      let volunteerData = {
        fullName: '',
        dateOfBirth: '',
        age: '',
        address: '',
        interest: '',
        skills: {},
        email: '', // Initialize email field
      };

      if (volunteerDocSnap.exists()) {
        const data = volunteerDocSnap.data();
        const dob = data.dateOfBirth && data.dateOfBirth.toDate ? data.dateOfBirth.toDate() : null;
        const age = dob ? new Date().getFullYear() - dob.getFullYear() : 'N/A';

        volunteerData = {
          fullName: data.fullName || '',
          dateOfBirth: dob ? dob.toISOString().split('T')[0] : 'N/A', // Convert to YYYY-MM-DD
          age,
          address: data.location || '',
          interest: data.interests || '',
          skills: data.skills || {},
          email: data.email || '', // Get email from volunteer document if available
        };
      }

      // Prioritize email from users collection (auth data) if available
      // Otherwise, use the email from volunteer document as fallback
      const email = userData.email || volunteerData.email || 'No email available';

      volunteerList.push({
        id: volunteerId,
        email: email,
        ...volunteerData
      });
    }

    setVolunteerAccounts(volunteerList);
    setFilteredAccounts(volunteerList);
  };

  // Search filter
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAccounts(volunteerAccounts);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = volunteerAccounts.filter(account => 
        (account.fullName && account.fullName.toLowerCase().includes(lowerSearch)) ||
        (account.email && account.email.toLowerCase().includes(lowerSearch)) ||
        (account.id && account.id.toLowerCase().includes(lowerSearch))
      );
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, volunteerAccounts]);

  const openDeleteModal = (id) => {
    setAccountToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAccountToDelete(null);
  };

  const deleteAccount = async () => {
    try {
      const accountRef = doc(db, "users", accountToDelete);
      await deleteDoc(accountRef);
      fetchVolunteerAccounts();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting account:", error);
      closeDeleteModal();
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    router.push('/');
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Volunteer Accounts</h1>
          <button 
            onClick={() => fetchVolunteerAccounts()} 
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search by Full Name, Email, or ID" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border border-gray-200 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Volunteer Accounts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Expand</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">ID</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Email</th>
                   <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Full Name</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map(account => (
                    <React.Fragment key={account.id}>
                      <tr 
        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
        onClick={() => toggleRowExpand(account.id)}
      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center justify-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpand(account.id);
                              }}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                              aria-label={expandedRows[account.id] ? "Collapse row" : "Expand row"}
                            >
                              {expandedRows[account.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {account.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{account.email || 'No email available'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{account.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(account.id);
                              }} 
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                              title="Delete Account"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                              title="Edit Account"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="text-purple-500 hover:text-purple-700 p-1 rounded-full hover:bg-purple-50"
                              title="View Achievements"
                            >
                              <Award size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[account.id] && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan="6" className="px-6 py-4">
                            <ExpandableCard 
                              title="Volunteer Details" 
                              defaultExpanded={true} 
                              className="border-0 shadow-none"
                            >
                              <ExpandableCardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                                    <p className="text-sm">{account.fullName || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                                    <p className="text-sm">{account.email || 'No email available'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Age</p>
                                    <p className="text-sm">{account.age || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Date of Birth</p>
                                    <p className="text-sm">{account.dateOfBirth || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                                    <p className="text-sm">{account.address || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Interest</p>
                                    <p className="text-sm">{account.interest || 'N/A'}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Skills</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {Object.keys(account.skills || {}).length > 0 ? (
                                        Object.entries(account.skills).map(([category, skills]) => (
                                          <div key={category} className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                            <p className="font-medium text-sm">{category}</p>
                                            <p className="text-sm">{skills.join(", ")}</p>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500">No skills listed</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Account ID</p>
                                    <p className="text-sm">{account.id || 'N/A'}</p>
                                  </div>
                                </div>
                              </ExpandableCardContent>
                            </ExpandableCard>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No volunteer accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Are you sure you want to delete this account?</h3>
            <div className="flex justify-between">
              <button onClick={deleteAccount} className="bg-red-500 text-white px-4 py-2 rounded">Confirm</button>
              <button onClick={closeDeleteModal} className="bg-gray-300 text-black px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
     </AdminLayout>
  );
}
