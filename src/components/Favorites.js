import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { firestore, auth } from './Firebase'; // Adjust the import path if necessary
import './favorite.css'; // Import the CSS file

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated.');
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);

      try {
        const userId = user.uid;
        const favoritesRef = collection(firestore, 'users', userId, 'favorites');
        const q = query(favoritesRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({ uniqueProductId: doc.id, ...doc.data() }));
          console.log('Fetched favorites:', data); // Log the favorites data
          setFavorites(data);
        }, (error) => {
          throw error;
        });

        return () => unsubscribe(); // Clean up the subscription on unmount
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setError('Error fetching favorites. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleDelete = async (uniqueProductId) => {
    if (!window.confirm('Are you sure you want to delete this favorite?')) {
      return; // Exit if the user cancels the delete action
    }

    setLoading(true);
    setError(null);

    try {
      if (!user || !user.uid) {
        throw new Error('User is not authenticated.');
      }

      const userId = user.uid;
      const favoriteDocRef = doc(firestore, 'users', userId, 'favorites', uniqueProductId);

      console.log('Attempting to delete document with uniqueProductId:', uniqueProductId); // Log the ID
      console.log('Document Reference Path:', favoriteDocRef.path); // Log the path

      await deleteDoc(favoriteDocRef);

      console.log('Document deleted successfully.');

      // Update state to remove deleted item from UI
      setFavorites(prevFavorites => prevFavorites.filter(fav => fav.uniqueProductId !== uniqueProductId));
    } catch (error) {
      console.error('Error deleting favorite:', error);
      setError('Error deleting favorite. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="favorites-container">
      <div className="favorites-content">
        <h2>Your Favorites</h2>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        <div className="favorites-grid">
          {favorites.length === 0 && !loading && (
            <div className="no-favorites-message">
              <img src='https://w7.pngwing.com/pngs/820/953/png-transparent-love-hearts-love-hearts-red-heart-love-heart-computer-icons-thumbnail.png' alt='Heart' />
              <p>No favorites found.</p>
            </div>
          )}
          {favorites.map(fav => (
            <div key={fav.uniqueProductId} className="favorite-item">
              <img className="favorite-item-img" src={fav.fileURL} alt={fav.foodName} />
              <div className="favorite-item-text">
                <h3>{fav.foodName}</h3>
                <button className="remove" onClick={() => handleDelete(fav.uniqueProductId)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className="footer">
        <p>&copy; 2024 Toriko Food. All rights reserved.</p>
        <p className='name'>Yash Saundalkar</p>
        <img src='https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png' alt='Facebook' />
        <img src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png' alt='Instagram' />
        <img src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/600px-LinkedIn_logo_initials.png' alt='LinkedIn' />
      </footer>
    </div>
  );
}

export default Favorites;