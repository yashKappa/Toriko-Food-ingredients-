    import React, { useState, useEffect } from 'react';
    import { Link } from 'react-router-dom';
    import { auth, firestore, GoogleAuthProvider, signInWithPopup, signOut } from './components/Firebase';
    import { collection, query, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
    import './App.css';
    import LoadingSpinner from './components/LoadingSpinner';
    import Favorites from './components/Favorites';
    import UserData from './components/UserData';

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
      const [favorites, setFavorites] = useState([]);
      const [usernamePrompt, setUsernamePrompt] = useState(false);
      const [newUsername, setNewUsername] = useState('');
      const [usernamePromptInterval, setUsernamePromptInterval] = useState(null);
      const [showPopup, setShowPopup] = useState(false);
      const [selectedRecipe, setSelectedRecipe] = useState(null);


      useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          setUser(user);
          if (user) {
            fetchUserData(user.uid);
            fetchFavorites(user.uid);
    
            const checkUsername = async () => {
              const userRef = doc(firestore, 'users', user.uid);
              const userSnap = await getDoc(userRef);
              if (!userSnap.exists() || !userSnap.data().username) {
                setUsernamePrompt(true);
              }
            };
    
            checkUsername();
          } else {
            setUserData([]);
            setFavorites([]);
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
    
      useEffect(() => {
        // Set up the interval if the username prompt is shown
        if (usernamePrompt && !usernamePromptInterval) {
          const intervalId = setInterval(() => {
            setUsernamePrompt(true); // Trigger the prompt every minute
          }, 6000); // 6000 ms = 1 minute
          setUsernamePromptInterval(intervalId);
        }
      
        // Clear the interval when the component unmounts or the prompt is not shown
        return () => {
          if (usernamePromptInterval) {
            clearInterval(usernamePromptInterval);
          }
        };
      }, [usernamePrompt, usernamePromptInterval]);
      

      const fetchUserData = async (userId) => {
        setLoading(true);
        setError(null);
        try {
          // Fetch user products
          const q = query(collection(firestore, 'users', userId, 'products'));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
          // Fetch the username
          const userRef = doc(firestore, 'users', userId);
          const userSnap = await getDoc(userRef);
          const username = userSnap.data().username || 'Anonymous';
      
          // Combine username with products
          const userDataWithUsername = data.map(item => ({ ...item, username }));
      
          setUserData(userDataWithUsername);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Error fetching data. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      
      const fetchFavorites = async (userId) => {
        setLoading(true);
        setError(null);
        try {
          const q = query(collection(firestore, 'users', userId, 'favorites'));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => doc.id); // Get only the favorite food names
          setFavorites(data);
        } catch (error) {
          console.error('Error fetching favorites:', error);
          setError('Error fetching favorites. Please try again later.');
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

      
      const handleThumbsUp = async (productData) => {
        if (!user) return;
      
        const { id } = productData;
        const userId = user.uid;
      
        setLoading(true);
        setError(null);
        try {
          const productRef = doc(firestore, 'products', id);
          const productSnap = await getDoc(productRef);
      
          let updatedThumbsUpCount = productSnap.data().thumbsUpCount || 0;
          let updatedThumbsUpUsers = productSnap.data().thumbsUpUsers || [];
      
          if (updatedThumbsUpUsers.includes(userId)) {
            // Remove thumbs-up if already given
            updatedThumbsUpCount -= 1;
            updatedThumbsUpUsers = updatedThumbsUpUsers.filter(user => user !== userId);
          } else {
            // Add thumbs-up
            updatedThumbsUpCount += 1;
            updatedThumbsUpUsers = [...updatedThumbsUpUsers, userId];
          }
      
          await setDoc(productRef, { thumbsUpCount: updatedThumbsUpCount, thumbsUpUsers: updatedThumbsUpUsers }, { merge: true });
      
          // Update local state
          const updatedProducts = generalProducts.map(product =>
            product.id === id ? { ...product, thumbsUpCount: updatedThumbsUpCount, thumbsUpUsers: updatedThumbsUpUsers } : product
          );
          setGeneralProducts(updatedProducts);
          setFilteredProducts(updatedProducts);
        } catch (error) {
          console.error('Error managing thumbs-up:', error);
          setError('Error managing thumbs-up. Please try again later.');
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
          fetchFavorites(user.uid);
        } catch (error) {
          console.error('Error during Google login:', error);
        }
      };

      const handleUsernameSubmit = async () => {
        if (!user || !newUsername) return;
    
        setLoading(true);
        setError(null);
        try {
          // Store the username in Firestore
          const userRef = doc(firestore, 'users', user.uid);
          await setDoc(userRef, { username: newUsername }, { merge: true });
          setUsernamePrompt(false); // Hide username prompt after submission
          fetchUserData(user.uid);
          fetchFavorites(user.uid);
        } catch (error) {
          console.error('Error storing username:', error);
          setError('Error storing username. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      const handleLogout = async () => {
        try {
          await signOut(auth);
          setUser(null);
          setUserData([]);
          setFavorites([]);
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

    // Update the local favorite items state
    setFavorites([...favorites, foodName]); // Add the foodName to the favorites list
  } catch (error) {
    console.error('Error adding to favorites:', error);
    setError('Error adding to favorites. Please try again later.');
  } finally {
    setLoading(false);
  }
};

      
      const handleViewRecipe = (recipe) => {
        setSelectedRecipe(recipe);
        setShowPopup(true);
        document.body.classList.add('no-scroll'); // Disable scrolling
      };
    
      const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedRecipe(null);
        document.body.classList.remove('no-scroll'); // Enable scrolling
      };
        
      return(
      <div>
      {usernamePrompt && (
          <div className="username-prompt">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter your username"
            />
            <button onClick={handleUsernameSubmit}>Submit</button>
            <button onClick={() => setUsernamePrompt(false)}>Close</button>
          </div>
        )}
          {loading && <LoadingSpinner />}
          <header className="header">
            <div className="logo">Toriko Food</div>
            <nav>
              <ul className="nav-links">
                <li><a href="#" onClick={showHomeContent}>Home</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Orders</a></li>
                <li><a href="#">Delivery</a></li>
                <li><a href="#">Contact</a></li>
                <li>
                  <Link to="#" onClick={user ? toggleUserData : () => alert('Please log in to access recipes')}>Recipe</Link>
                </li>
                <li>
                  <Link to={user ? "/Products" : "#"} onClick={user ? undefined : () => alert('Please log in to upload')}>Upload</Link>
                </li>
                <li>
                  <Link to="#" onClick={user ? showFavoritesContent : () => alert('Please log in to view favorites')}>Favorites</Link>
                </li>
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
                      <div className='datas'>
                      <p>Uploaded By : {item.username}</p>
                      <p>ingredients : {item.ingredients}</p>
                      <p>process : {item.process}</p>
                      </div>
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
                    {filteredProducts.map(item => (
                      <div key={item.id} className="fetched-item">
                      <img src={item.fileURL} alt={item.foodName} className="fetched-item-img" />
                      <span className='border'>
                      <div className="fetched-item-text">
                      <h3>Recipe : {item.foodName}</h3>
                      <p>Uploaded by: {item.username}</p>
                      <div>
                        <button className='view' onClick={() => handleViewRecipe()}>
                          View Recipe
                          </button>
                          {showPopup && (
                          <div className="popup-overlay">
                           <div className="popup-content">
                            <div className='cancel'>
                            <img src='https://www.freeiconspng.com/thumbs/close-icon/close-icon-png-close-window-icon-png-0.png' onClick={handleClosePopup}></img>
                            </div>
                            <h3>Recipe: {item.foodName}</h3>
                            <h3>Username: {item.username}</h3>
                            <h3>ingredients:</h3>{item.ingredients}
                            <h3>Process:</h3>{item.process}
                            </div>
                            </div>
                            )}
                        </div>
                        </div>
                        </span>
                        <div className="icon">
                          <i className={`fas fa-heart ${favorites.includes(item.foodName) ? 'favorite' : ''}`} onClick={() => handleAddToFavorites(item)} />
                          <i className='fas fa-comments'></i>
                          <i className={`fa-solid fa-thumbs-up ${item.thumbsUpUsers?.includes(user?.uid) ? 'thumbs-up-yellow' : ''}`} onClick={() => handleThumbsUp(item)} />
                          <span className="thumbs-up-count">{item.thumbsUpCount || 0}</span>
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
            <img src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/600px-LinkedIn_logo_initials.png' alt='LinkedIn' />
          </footer>
        </div>
      );
    }

    export default App;
