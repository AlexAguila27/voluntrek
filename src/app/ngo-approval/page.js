'use client';
import { useEffect, useState } from 'react';
import { db } from '../FirebaseProvider';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { CheckSquare, Search, Check, X, Eye, Building2 } from 'lucide-react';

export default function NGOApproval() {
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [filteredNGOs, setFilteredNGOs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedNGODetails, setSelectedNGODetails] = useState(null);
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
    fetchPendingNGOs();
  }, []);

  // Fetch NGO accounts from the "users" collection where role == "ngo"
  // Then, for each account, fetch its organization name from "ngo_profiles"
  const fetchPendingNGOs = async () => {
    try {
      const usersRef = collection(db, "users");
      const ngoQuery = query(usersRef, where("role", "==", "ngo"));
      const ngoSnapshot = await getDocs(ngoQuery);

      // Map each account and fetch its organization name and other details from ngo_profiles using the document id
      const ngoList = await Promise.all(
        ngoSnapshot.docs.map(async (docSnap) => {
          const account = { id: docSnap.id, ...docSnap.data() };
          const profileRef = doc(db, "ngo_profiles", account.id);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            // Only include NGOs that don't have a verification status or have 'pending' status
            const verificationStatus = profileData.verificationStatus || 'pending';
            
            if (verificationStatus.toLowerCase() === 'pending') {
              return { 
                ...account, 
                ...profileData,
                verificationStatus
              };
            }
          }
          return null;
        })
      );

      // Filter out null values (NGOs that are already verified or rejected)
      const pendingNGOsList = ngoList.filter(ngo => ngo !== null);
      
      setPendingNGOs(pendingNGOsList);
      setFilteredNGOs(pendingNGOsList);
    } catch (error) {
      console.error("Error fetching pending NGOs:", error);
    }
  };

  // Filter NGOs based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNGOs(pendingNGOs);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = pendingNGOs.filter(ngo => {
        // Safely check for undefined or null and provide a fallback to an empty string
        const orgName = ngo.organizationName ? ngo.organizationName.toLowerCase() : '';
        const email = ngo.email ? ngo.email.toLowerCase() : '';
        const id = ngo.id ? ngo.id.toLowerCase() : '';
        
        return orgName.includes(lowerSearch) ||
               email.includes(lowerSearch) ||
               id.includes(lowerSearch);
      });
      setFilteredNGOs(filtered);
    }
  }, [searchTerm, pendingNGOs]);

  const openApproveModal = (ngo) => {
    setSelectedNGO(ngo);
    setIsApproveModalOpen(true);
  };

  const closeApproveModal = () => {
    setIsApproveModalOpen(false);
    setSelectedNGO(null);
  };

  const openRejectModal = (ngo) => {
    setSelectedNGO(ngo);
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setSelectedNGO(null);
  };

  const openDetailsModal = async (ngo) => {
    setSelectedNGODetails(ngo);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedNGODetails(null);
  };

  const approveNGO = async () => {
    try {
      if (!selectedNGO) return;
      
      // Update the NGO profile with verified status
      const profileRef = doc(db, "ngo_profiles", selectedNGO.id);
      await updateDoc(profileRef, {
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: username
      });

      // Send email notification to the NGO
      try {
        const apiUrl = '/api/email';
        console.log('Sending approval email to:', selectedNGO.email);
        
        // Show loading indicator or toast notification
        alert('Sending approval notification email...');
        
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
                email: selectedNGO.email,
                organizationName: selectedNGO.organizationName,
                status: 'approved'
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
          console.log('Approval notification email result:', result);
          alert('Approval notification email sent successfully!');
        } catch (fetchError) {
          // Clear the timeout if there was an error
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (emailError) {
        console.error('Error sending approval notification email:', emailError);
        
        // Provide more specific error message based on error type
        let errorMessage = emailError.message;
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Network error: Unable to connect to the notification service. Please check your internet connection and verify the function is deployed.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Request timed out: The notification service is taking too long to respond.';
        } else if (errorMessage.includes('email-auth-error')) {
          errorMessage = 'Email authentication error: The system is unable to authenticate with the email provider. Please contact the administrator to verify email credentials.';
        }
        
        alert(`Failed to send approval notification: ${errorMessage}. The NGO status has been updated, but they may not receive an email notification.`);
      }

      // Refresh the list
      fetchPendingNGOs();
      closeApproveModal();
    } catch (error) {
      console.error("Error approving NGO:", error);
    }
  };

  const rejectNGO = async () => {
    try {
      if (!selectedNGO) return;
      
      // Get rejection reason if provided
      const rejectionReasonElement = document.getElementById('rejectionReason');
      const rejectionReason = rejectionReasonElement ? rejectionReasonElement.value.trim() : '';
      
      // Update the NGO profile with rejected status
      const profileRef = doc(db, "ngo_profiles", selectedNGO.id);
      await updateDoc(profileRef, {
        verificationStatus: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: username,
        rejectionReason: rejectionReason || null
      });

      // Send email notification to the NGO
      try {
        const apiUrl = '/api/email';
        console.log('Sending rejection email to:', selectedNGO.email);
        
        // Show loading indicator or toast notification
        alert('Sending rejection notification email...');
        
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
                email: selectedNGO.email,
                organizationName: selectedNGO.organizationName,
                status: 'rejected',
                rejectionReason: rejectionReason || undefined
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
          console.log('Rejection notification email result:', result);
          alert('Rejection notification email sent successfully!');
        } catch (fetchError) {
          // Clear the timeout if there was an error
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (emailError) {
        console.error('Error sending rejection notification email:', emailError);
        
        // Provide more specific error message based on error type
        let errorMessage = emailError.message;
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Network error: Unable to connect to the notification service. Please check your internet connection and verify the function is deployed.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Request timed out: The notification service is taking too long to respond.';
        } else if (errorMessage.includes('email-auth-error')) {
          errorMessage = 'Email authentication error: The system is unable to authenticate with the email provider. Please contact the administrator to verify email credentials.';
        }
        
        alert(`Failed to send rejection notification: ${errorMessage}. The NGO status has been updated, but they may not receive an email notification.`);
      }

      // Refresh the list
      fetchPendingNGOs();
      closeRejectModal();
    } catch (error) {
      console.error("Error rejecting NGO:", error);
    }
  };

  // Handle logout: clear localStorage and redirect to home
  const handleLogout = () => {
    localStorage.removeItem('username');
    router.push('/');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">NGO Approval</h1>
          <button 
            onClick={() => fetchPendingNGOs()} 
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

        {/* NGO Approval Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">ID</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Organization Name</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNGOs.length > 0 ? (
                  filteredNGOs.map(ngo => (
                    <tr key={ngo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ngo.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ngo.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ngo.organizationName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {ngo.verificationStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openApproveModal(ngo)} 
                            className="p-1 rounded-full text-green-600 hover:text-green-800 hover:bg-green-50"
                            title="Approve NGO"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => openRejectModal(ngo)} 
                            className="p-1 rounded-full text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Reject NGO"
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={() => openDetailsModal(ngo)} 
                            className="p-1 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No pending NGO approvals found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NGO Details Modal */}
      {detailsModalOpen && selectedNGODetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">NGO Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="font-semibold">Organization Name:</p>
                <p>{selectedNGODetails.organizationName || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Email:</p>
                <p>{selectedNGODetails.email || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Phone Number:</p>
                <p>{selectedNGODetails.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Website:</p>
                <p>{selectedNGODetails.website || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Office Address:</p>
                <p>{selectedNGODetails.location?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Registration Date:</p>
                <p>{selectedNGODetails.createdAt ? new Date(selectedNGODetails.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Description:</p>
              <p className="whitespace-pre-wrap">{selectedNGODetails.description || 'N/A'}</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Mission:</p>
              <p className="whitespace-pre-wrap">{selectedNGODetails.mission || 'N/A'}</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Vision:</p>
              <p className="whitespace-pre-wrap">{selectedNGODetails.vision || 'N/A'}</p>
            </div>

            {selectedNGODetails.documentPdfUrl && (
              <div className="mb-4">
                <p className="font-semibold">Registration Document:</p>
                <a 
                  href={selectedNGODetails.documentPdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Document
                </a>
              </div>
            )}
            
            <div className="mb-4">
              <p className="font-semibold">Areas of Operation:</p>
              <div className="flex flex-wrap gap-2">
                {selectedNGODetails.areasOfOperation && selectedNGODetails.areasOfOperation.length > 0 ? (
                  selectedNGODetails.areasOfOperation.map((area, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No areas of operation specified</span>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={closeDetailsModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {isApproveModalOpen && selectedNGO && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Approval</h3>
            <p className="mb-4">Are you sure you want to approve {selectedNGO.organizationName}?</p>
            <p className="mb-6 text-sm text-gray-600">This will grant them full access to the platform as a verified NGO.</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeApproveModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={approveNGO}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedNGO && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Rejection</h3>
            <p className="mb-4">Are you sure you want to reject {selectedNGO.organizationName}?</p>
            <p className="mb-4 text-sm text-gray-600">This will prevent them from accessing the platform as a verified NGO.</p>
            
            {/* Rejection Reason Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (Optional):</label>
              <textarea 
                className="w-full border rounded p-2 text-sm" 
                rows="3"
                placeholder="Provide a reason for rejection that will be included in the email notification"
                id="rejectionReason"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeRejectModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={rejectNGO}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}