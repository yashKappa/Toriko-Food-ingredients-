import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, firestore, GoogleAuthProvider, signInWithPopup, signOut } from './components/Firebase';
import { collection, query, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import './App.css';
import LoadingSpinner from './components/LoadingSpinner';
import Favorites from './components/Favorites';

function App() {
  const [user, setUser] = useState(null);
  const [showUserData, setShowUserData] = useState(
    JSON.parse(localStorage.getItem('showUserData')) || false
  );
  const [showHome, setShowHome] = useState(
    JSON.parse(localStorage.getItem('showHome')) || true
  );
  const [showFavorites, setShowFavorites] = useState(false);
  const [userData, setUserData] = useState([]);
  const [generalProducts, setGeneralProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('showUserData', JSON.stringify(showUserData));
    localStorage.setItem('showHome', JSON.stringify(showHome));
  }, [showUserData, showHome]);

  useEffect(() => {
    fetchGeneralProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, generalProducts]);

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

  const fetchGeneralProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(firestore, 'products'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGeneralProducts(data);
    } catch (error) {
      console.error('Error fetching general products:', error);
      setError('Error fetching products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = generalProducts.filter(product =>
      product.foodName.toLowerCase().includes(lowercasedQuery) ||
      product.ingredients.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredProducts(filtered);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
      fetchUserData(user.uid);
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData([]);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const toggleUserData = () => {
    setShowUserData(true);
    setShowHome(false);
    setShowFavorites(false);
  };

  const showHomeContent = () => {
    setShowHome(true);
    setShowUserData(false);
    setShowFavorites(false);
  };

  const showFavoritesContent = () => {
    setShowHome(false);
    setShowUserData(false);
    setShowFavorites(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      setError(null);

      try {
        // Delete from 'products' collection
        const productRef = doc(firestore, 'products', itemId);
        await deleteDoc(productRef);

        // Delete from user's collection
        if (user) {
          const userProductRef = doc(firestore, 'users', user.uid, 'products', itemId);
          await deleteDoc(userProductRef);
        }

        // Update local state
        setUserData(userData.filter(item => item.id !== itemId));
        setGeneralProducts(generalProducts.filter(product => product.id !== itemId));
        setFilteredProducts(filteredProducts.filter(product => product.id !== itemId));

      } catch (error) {
        console.error('Error deleting item:', error);
        setError('Error deleting item. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    filterProducts();
  };

  const handleAddToFavorites = async (productData) => {
    if (!user) return;

    const { foodName } = productData;
    const userId = user.uid;

    setLoading(true);
    setError(null);
    try {
      await setDoc(doc(firestore, 'users', userId, 'favorites', foodName), productData);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      setError('Error adding to favorites. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return(
  <div>
      <header className="header">
        <div className="logo">Toriko Food</div>
        <nav>
          <ul className="nav-links">
            <li><a href="#" onClick={showHomeContent}>Home</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Orders</a></li>
            <li><a href="#">Delivery</a></li>
            <li><a href="#">Contact</a></li>
            {user && (
              <>
                <li>
                  <Link to="#" onClick={toggleUserData}>Recipe</Link>
                </li>
                <li>
                  <Link to="/Products">Upload</Link>
                </li>
                <li>
                  <Link to="#" onClick={showFavoritesContent}>Favorites</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        {user ? (
          <div className="profile-container">
            <img src={user.photoURL} alt={user.displayName} className="profile-img" />
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button className="google-btn" onClick={handleGoogleLogin}>
            Sign in with Google
          </button>
        )}
      </header>

      <main>
        {loading && <LoadingSpinner />}
        {showFavorites && <Favorites />}
        {showUserData ? (
          <div className='data'>
            {error && <div className="error">{error}</div>}
            {userData.length === 0 && !loading && <div className='fetch-msg'>
              <h1>Your Uploaded Data</h1>
              <img src='https://cdn-icons-png.flaticon.com/128/7486/7486747.png'></img>
              <p>No data available.</p>
              </div>}
            <ul>
              {userData.map(item => (
                <li key={item.id} className="user-data-item">
                  <img src={item.fileURL} alt={item.foodName} className="food-img" />
                  <div className="user-data-text">
                    <h2>Food name: {item.foodName}</h2>
                    <p>Ingredients: {item.ingredients}</p>
                    <p>Process: {item.process}</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
                </li>
              ))}
            </ul>
          </div>
        ) : showHome ? (
          <>
 <section className="hero">
              <div className="hero-text">
                <h1>The best delicious food<br />that meets your needs</h1>
                <div className="categories">
                  <button className="category-btn">
                    <img src="https://w7.pngwing.com/pngs/166/140/png-transparent-greek-salad-caesar-salad-chicken-salad-greek-cuisine-spinach-salad-greek-salad-leaf-vegetable-food-recipe.png" alt="Salad" />
                    <p>Salad</p>
                  </button>
                  <button className="category-btn">
                    <img src="https://png.pngtree.com/png-clipart/20221001/ourmid/pngtree-fast-food-big-ham-burger-png-image_6244235.png" alt="Burger" />
                    <p>Burger</p>
                  </button>
                  <button className="category-btn">
                    <img src="https://freepngimg.com/thumb/pizza/4-pizza-png-image.png" alt="Pizza" />
                    <p>Pizza</p>
                  </button>
                  <button className="category-btn">
                    <img src="https://freepngimg.com/thumb/drinks/6-2-drink-png-9-thumb.png" alt="Drink" />
                    <p>Drink</p>
                  </button>
                  <button className="category-btn">
                    <img src="https://static.vecteezy.com/system/resources/previews/028/626/678/non_2x/hd-ai-generative-free-photo.jpg" alt="Dessert" />
                    <p>Dessert</p>
                  </button>
                </div>
              </div>
              <div className="hero-image">
                <img src="https://png.pngtree.com/png-clipart/20221001/ourmid/pngtree-fast-food-big-ham-burger-png-image_6244235.png" alt="Delicious salad" />
                <div className="discount-badge">30% Off</div>
              </div>
            </section>

            <section className="fetched-data">
              <h2 className='food'>Food Store Ingredients</h2>
              <form onSubmit={handleSearchSubmit} className="search-form">
                <div className="zip-code">
                  <input
                    type="text"
                    placeholder="Enter food name"
                    className="zip-code-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <button type="submit" className="zip-code-btn">Search</button>
                </div>
              </form>
              <div className="fetched-data-grid">
                {filteredProducts.length === 0 && !loading && <div>No data available.</div>}
                {filteredProducts.map(item => (
                  <div key={item.id} className="fetched-item">
                    <img src={item.fileURL} alt={item.foodName} className="fetched-item-img" />
                    <div className="fetched-item-text">
                      <h3>{item.foodName}</h3>
                    </div>
                    <div className='icon'>
						          <i id='heart' className='fas fa-heart' onClick={() => handleAddToFavorites(item)}></i>
                      <i className='fas fa-comments'></i>
                      <i className="fa-solid fa-thumbs-up"></i>
                    </div>
                  </div>
                ))}
              </div>
            </section>  
          </>
        ) : null}
      </main>

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

export default App;
