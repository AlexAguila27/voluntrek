'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from './FirebaseProvider'; 
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function LoginPage() {

  const router = useRouter();
  const [username, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      console.log(username);
  
      // Query Firestore for a user with the matching username
      const usersRef = collection(db, 'user-web');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        setError('User not found');
        return;
      }
  
      const userDoc = querySnapshot.docs[0]; // Assuming there's only one match
      const userData = userDoc.data();
  
      if (userData.password !== password) {
        setError('Invalid credentials');
        return;
      }
  
      if (userData.role !== 'admin') {
        setError('Access denied. Only admins can log in.');
        return;
      }
  
      // Save username in local storage
      localStorage.setItem('username', username);
  
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    }
  };
  

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-96 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="input"
            placeholder="username"
            value={username}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full mb-3"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full mb-3"
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
