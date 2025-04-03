'use client';
import React, { useEffect, useState } from 'react';
import { db } from '../FirebaseProvider';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Building2, Search, Trash2, Edit, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { ExpandableCard, ExpandableCardContent } from '@/components/ui/expandable-card';

export default function NGOAccounts() {
  const [ngoAccounts, setNgoAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [username, setUsername] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const router = useRouter();

  // Get username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    fetchNGOAccounts();
  }, []);

  // Fetch NGO accounts from the "users" collection where role == "ngo"
  // Then, for each account, fetch its organization name from "ngo_profiles"
  const fetchNGOAccounts = async () => {
    const usersRef = collection(db, "users");
    const ngoQuery = query(usersRef, where("role", "==", "ngo"));
    const ngoSnapshot = await getDocs(ngoQuery);

    // Map each account and fetch its organization name and other details from ngo_profiles using the document id
    const ngoList = await Promise.all(
      ngoSnapshot.docs.map(async (docSnap) => {
        const account = { id: docSnap.id, ...docSnap.data() };
        const profileRef = doc(db, "ngo_profiles", account.id);
        const profileSnap = await getDoc(profileRef);

        const organizationName = profileSnap.exists() ? profileSnap.data().organizationName : "N/A";
        // Extract address from location object if it exists
        // Check both 'location' and 'officeLocation' fields since the data structure might vary
        const location = profileSnap.exists() ? profileSnap.data().location || profileSnap.data().officeLocation : null;
        const officeAddress = location && location.address ? location.address : "N/A";
        const areasOfOperation = profileSnap.exists() ? profileSnap.data().areasOfOperation || [] : [];
        const targetBeneficiaries = profileSnap.exists() ? profileSnap.data().targetBeneficiaries || [] : [];

        return { 
          ...account, 
          organizationName, 
          officeAddress, 
          areasOfOperation, 
          targetBeneficiaries 
        };
      })
    );
    setNgoAccounts(ngoList);
    setFilteredAccounts(ngoList);
  };

  // Filter accounts based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAccounts(ngoAccounts);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = ngoAccounts.filter(account => {
        // Safely check for undefined or null and provide a fallback to an empty string
        const orgName = account.organizationName ? account.organizationName.toLowerCase() : '';
        const email = account.email ? account.email.toLowerCase() : '';
        const id = account.id ? account.id.toLowerCase() : '';
        
        return orgName.includes(lowerSearch) ||
               email.includes(lowerSearch) ||
               id.includes(lowerSearch);
      });
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, ngoAccounts]);

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
      // Optionally, also delete from ngo_profiles if needed.
      fetchNGOAccounts(); // Refresh list after deletion
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting account:", error);
      closeDeleteModal();
    }
  };

  // Handle logout: clear localStorage and redirect to home
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
          <h1 className="text-3xl font-bold tracking-tight">NGO Accounts</h1>
          <button 
            onClick={() => fetchNGOAccounts()} 
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
            placeholder="Search by Organization Name, Email, or ID" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border border-gray-200 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* NGO Accounts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full transition-all duration-300">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400 w-12"></th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Organization</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map(account => (
                    <React.Fragment key={account.id}>
                      <tr 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                        onClick={() => toggleRowExpand(account.id)}
                      >
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(account.id);
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                            aria-label={expandedRows[account.id] ? "Collapse row" : "Expand row"}
                          >
                            {expandedRows[account.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.organizationName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">ID: {account.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{account.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                              className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-50"
                              title="Send Email"
                            >
                              <Mail size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[account.id] && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                                <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Office Address</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{account.officeAddress || 'N/A'}</p>
                              </div>
                              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                                <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Areas of Operation</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {Array.isArray(account.areasOfOperation) 
                                    ? account.areasOfOperation.join(', ') 
                                    : account.areasOfOperation || 'N/A'}
                                </p>
                              </div>
                              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                                <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Target Beneficiaries</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {Array.isArray(account.targetBeneficiaries) 
                                    ? account.targetBeneficiaries.join(', ') 
                                    : account.targetBeneficiaries || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Account ID:</span> {account.id}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No NGO accounts found
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
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-semibold mb-4">Are you sure you want to delete this account?</h3>
            <div className="flex justify-between">
              <button 
                onClick={deleteAccount} 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Confirm
              </button>
              <button 
                onClick={closeDeleteModal} 
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
