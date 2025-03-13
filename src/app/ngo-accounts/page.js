'use client';
import { useEffect, useState } from "react";
import { db } from "../FirebaseProvider";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  getDoc 
} from "firebase/firestore";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NGOAccounts() {
  const [ngoAccounts, setNgoAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [username, setUsername] = useState("");
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
  // Then, for each account, fetch the corresponding organizationName from "ngo_profiles"
  const fetchNGOAccounts = async () => {
    const usersRef = collection(db, "users");
    const ngoQuery = query(usersRef, where("role", "==", "ngo"));
    const ngoSnapshot = await getDocs(ngoQuery);

    // Map each account and fetch its organization name from ngo_profiles using the document id
    const ngoList = await Promise.all(
      ngoSnapshot.docs.map(async (docSnap) => {
        const account = { id: docSnap.id, ...docSnap.data() };
        const profileRef = doc(db, "ngo_profiles", account.id);
        const profileSnap = await getDoc(profileRef);
        const organizationName = profileSnap.exists() ? profileSnap.data().organizationName : "N/A";
        return { ...account, organizationName };
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

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center bg-blue-600 p-4 text-white">
        <div className="text-xl">Admin Dashboard</div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-white hover:underline">Dashboard</Link>
          <Link href="/ngo-accounts" className="text-white hover:underline">NGO Accounts</Link>
          <Link href="/volunteer-accounts" className="text-white hover:underline">Volunteer Accounts</Link>
          <button 
            className="text-white hover:underline"
            onClick={handleLogout}
          >
            Logout
          </button>
          {/* Profile Display */}
          <div className="flex items-center space-x-2">
            <img 
              src="https://www.w3schools.com/w3images/avatar2.png" 
              alt="Profile" 
              className="w-8 h-8 rounded-full" 
            />
            <span>{username}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">NGO Accounts</h2>

        {/* Search Filter */}
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Search by Organization Name, Email, or ID" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        {/* NGO Accounts Table */}
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Organization Name</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => (
              <tr key={account.id}>
                <td className="border px-4 py-2">{account.id}</td>
                <td className="border px-4 py-2">{account.email}</td>
                <td className="border px-4 py-2">{account.organizationName}</td>
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
