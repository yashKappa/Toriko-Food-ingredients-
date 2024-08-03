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
        <h2>Your Favorites</h2>
      <div className="favorites-content">
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        <div className="favorites-grid">
          {favorites.length === 0 && !loading && (
            <div className="no-favorites-message">
              <div className='.fav-msg'>
              <img src='https://i.pinimg.com/originals/87/b4/1c/87b41c85f93d29810a40ddfe454269be.png' alt='Heart' />
              <p>No favorites found.</p>
              <p>You can add your favorite recipes in the list</p>
              <p>Just by click on heart icon</p>
              </div>
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
    </div>
  );
}

export default Favorites;