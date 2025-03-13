'use client'; 
import { useEffect, useState } from "react";
import { db } from "../FirebaseProvider";
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from "firebase/firestore";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VolunteerAccounts() {
  const [volunteerAccounts, setVolunteerAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [username, setUsername] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
        };
      }

      volunteerList.push({
        id: volunteerId,
        email: userData.email,
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

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center bg-blue-600 p-4 text-white">
        <div className="text-xl">Admin Dashboard</div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-white hover:underline">Dashboard</Link>
          <Link href="/ngo-accounts" className="text-white hover:underline">NGO Accounts</Link>
          <Link href="/volunteer-accounts" className="text-white hover:underline">Volunteer Accounts</Link>
          <button onClick={handleLogout} className="text-white hover:underline">Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Volunteer Accounts</h2>

        {/* Search Filter */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Full Name, Email, or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Volunteer Accounts Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Full Name</th>
                <th className="border px-4 py-2">Date of Birth</th>
                <th className="border px-4 py-2">Age</th>
                <th className="border px-4 py-2">Address</th>
                <th className="border px-4 py-2">Interest</th>
                <th className="border px-4 py-2">Skills</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => (
                <tr key={account.id}>
                  <td className="border px-4 py-2">{account.id}</td>
                  <td className="border px-4 py-2">{account.email}</td>
                  <td className="border px-4 py-2">{account.fullName}</td>
                  <td className="border px-4 py-2">{account.dateOfBirth || 'N/A'}</td>
                  <td className="border px-4 py-2">{account.age}</td>
                  <td className="border px-4 py-2">{account.address || 'N/A'}</td>
                  <td className="border px-4 py-2">{account.interest || 'N/A'}</td>
                  <td className="border px-4 py-2">
                    {Object.entries(account.skills).map(([category, skills]) => (
                      <div key={category}>
                        <strong>{category}:</strong> {skills.join(", ")}
                      </div>
                    ))}
                  </td>
                  <td className="border px-4 py-2">
                    <button 
                      onClick={() => openDeleteModal(account.id)} 
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
