'use client';
import { useEffect, useState } from "react";
import { db } from "../FirebaseProvider";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
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

      // Fetch fullName from volunteers collection using userId
      const volunteerDocRef = doc(db, "volunteers", volunteerId);
      const volunteerDocSnap = await getDoc(volunteerDocRef);

      let fullName = '';
      if (volunteerDocSnap.exists()) {
        fullName = volunteerDocSnap.data().fullName;
      }

      volunteerList.push({
        id: volunteerId,
        email: userData.email,
        fullName,
      });
    }

    setVolunteerAccounts(volunteerList);
    setFilteredAccounts(volunteerList);
  };

  // Search filter: filter volunteerAccounts based on search term (fullName, email, or id)
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
      fetchVolunteerAccounts(); // Refresh list after deletion
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
          <div className="relative">
            <button onClick={toggleDropdown} className="flex items-center space-x-2">
              <img src="https://www.w3schools.com/w3images/avatar2.png" alt="Profile" className="w-8 h-8 rounded-full" />
              <span>{username}</span>
            </button>
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
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Full Name</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => (
              <tr key={account.id}>
                <td className="border px-4 py-2">{account.id}</td>
                <td className="border px-4 py-2">{account.email}</td>
                <td className="border px-4 py-2">{account.fullName}</td>
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
    </div>
  );
}
