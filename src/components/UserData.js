import React, { useState, useEffect } from 'react';
import { auth, firestore } from './Firebase'; // Adjust the path as needed
import { collection, query, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import './UserData.css';

function UserData() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        fetchUserData(user.uid);
      } else {
        setUser(null);
        setUserData([]);
        setLoading(false);
        setShowLoadingScreen(false); // Ensure loading screen hides if no user is logged in
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Set a timeout to ensure loading screen is shown for at least 3 seconds
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const fetchUserData = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(firestore, 'users', userId, 'products'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Error fetching data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      setError(null);
      try {
        // Check if the user is authenticated
        if (!user) {
          throw new Error('User not authenticated');
        }

        console.log(`Deleting item ${itemId} from user's collection and main products collection`);

        // Delete from user's collection
        const userDocRef = doc(firestore, 'users', user.uid, 'products', itemId);
        console.log(`User collection path: ${userDocRef.path}`);
        await deleteDoc(userDocRef);
        console.log(`Successfully deleted item ${itemId} from user's collection`);

        // Check if product exists in main products collection before deletion
        const productDocRef = doc(firestore, 'products', itemId);
        console.log(`Main products collection path: ${productDocRef.path}`);
        const productDoc = await getDoc(productDocRef);

        if (productDoc.exists()) {
          // Delete from main products collection
          await deleteDoc(productDocRef);
          console.log(`Successfully deleted item ${itemId} from main products collection`);
        } else {
          console.warn(`Item ${itemId} does not exist in main products collection`);
        }

        // Update state directly to avoid reloading
        setUserData(prevData => prevData.filter(item => item.id !== itemId));
      } catch (error) {
        console.error('Error deleting item:', error);
        setError('Error deleting item. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading || showLoadingScreen) {
    return (
      <div className="loading">
        <img src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/04de2e31234507.564a1d23645bf.gif" alt="Loading" />
      </div>
    );
  }

  if (!user) {
    return <div>Please log in to view your data.</div>;
  }

  return (
    <div className='data'>
      <ul>
        {error && <div className="error">{error}</div>}
        {userData.length === 0 && !loading && 
          <div className='img'>
            <img src='https://cdn-icons-png.flaticon.com/512/7486/7486754.png' alt="Upload your recipe" />
            <p>Upload Your Recipe</p>
          </div>
        }
        
        {userData.map(item => (
          <li key={item.id} className="user-data-item">
            <img src={item.fileURL} alt={item.foodName} className="food-img" />
            <div className="user-data-text">
              <h2>Food name: {item.foodName}</h2>
              <p>Ingredients:</p> {item.ingredients}
              <p>Process:</p> {item.process}
            </div>
            <div className='delete'>
              <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserData;
