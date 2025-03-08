import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, firestore, GoogleAuthProvider, signInWithPopup, signOut } from './components/Firebase';
import { collection, query, getDocs, deleteDoc, doc, where, setDoc, getDoc } from 'firebase/firestore';
import './App.css';
import LoadingSpinner from './components/LoadingSpinner';
import Favorites from './components/Favorites';
import UserData from './components/UserData';
import TypingEffect from "react-typing-effect";
import About from './components/About';


function App() {
  const [user, setUser] = useState(null);
  const [showUserData, setShowUserData] = useState(
    JSON.parse(localStorage.getItem('showUserData')) || false
  );
  const [showAbout, setShowAbout] = useState(
    JSON.parse(localStorage.getItem('showAbout')) || true
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
  const [msg, setMsg] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [usernamePrompt, setUsernamePrompt] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernamePromptInterval, setUsernamePromptInterval] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUsername(userSnap.data().username);
      }
    };
  
    fetchUsername();
  }, [user]);
  

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
    localStorage.setItem('showAbout', JSON.stringify(showAbout));
    localStorage.setItem('showHome', JSON.stringify(showHome));
  }, [showUserData, showHome, showAbout]);

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
    if (!user || !newUsername.trim()) return;
  
    setLoading(true);
    setError(null);
  
    try {
      // Check if the username already exists
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("username", "==", newUsername));
      const querySnapshot = await getDocs(q);
  
      console.log("Query Snapshot Size:", querySnapshot.size);
      console.log("Query Snapshot Docs:", querySnapshot.docs.map((doc) => doc.data()));
  
      if (!querySnapshot.empty) {
        setError("This username already exists.");
        setLoading(false);
        return;
      }
  
      // Store the username in Firestore
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { username: newUsername }, { merge: true });
  
      console.log("Username successfully stored:", newUsername);
  
      setUsernamePrompt(false); // Hide username prompt after submission
      fetchUserData(user.uid);
      fetchFavorites(user.uid);
    } catch (err) {
      console.error("Firestore Error:", err.code, err.message);
      setError(`Firestore Error: ${err.message}`);
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
    setShowAbout(false);
  };

  const toggleAbout = () => {
    setShowAbout(true);
    setShowUserData(false);
    setShowHome(false);
    setShowFavorites(false);
  };

  const showHomeContent = () => {
    setShowHome(true);
    setShowUserData(false);
    setShowFavorites(false);
    setShowAbout(false);
  };

  const showFavoritesContent = () => {
    setShowHome(false);
    setShowUserData(false);
    setShowAbout(false);
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



  const handleViewRecipe = (item) => {
    setSelectedRecipe(item);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedRecipe(null);
  };

  const categories = [
    { name: "Salad", img: "https://w7.pngwing.com/pngs/166/140/png-transparent-greek-salad-caesar-salad-chicken-salad-greek-cuisine-spinach-salad-greek-salad-leaf-vegetable-food-recipe.png" },
    { name: "Burger", img: "https://png.pngtree.com/png-clipart/20221001/ourmid/pngtree-fast-food-big-ham-burger-png-image_6244235.png" },
    { name: "Pizza", img: "https://freepngimg.com/thumb/pizza/4-pizza-png-image.png" },
    { name: "Drink", img: "https://freepngimg.com/thumb/drinks/6-2-drink-png-9-thumb.png" },
    { name: "Dessert", img: "https://static.vecteezy.com/system/resources/previews/028/626/678/non_2x/hd-ai-generative-free-photo.jpg" },
    { name: "cake", img: "https://www.noracooks.com/wp-content/uploads/2022/04/sq-4.jpg" },
    { name: "paneer", img: "https://spoorthycuisine.com/wp-content/uploads/2020/09/Adobe-premier-project-matar-paneer.png" },
    { name: "coffee", img: "https://images.immediate.co.uk/production/volatile/sites/30/2020/08/flat-white-3402c4f.jpg" },
    { name: "biryani ", img: "https://www.cookwithkushi.com/wp-content/uploads/2016/04/chicken_tikka_biryani_recipe_best_simple_easy.jpg" },
  ];

  const duplicateCategories = [...categories, ...categories]; // Duplicate for infinite effect


  return (
    <div>
    {usernamePrompt && (
  <div className="username-prompt">
    <div className="prompt">
      <div className='user'>
      <input
        type="text"
        value={newUsername}
        onChange={(e) => {
          setNewUsername(e.target.value);
          setError(null); // Clear error when user starts typing
        }}
        placeholder="Enter your username"
      />
            {error && <p className="error-message">{error}</p>} {/* Show error below input */}
      </div>
      <div className="prompt-btn">
        <button className="sub" onClick={handleUsernameSubmit} disabled={loading}>
          {loading ? "Checking..." : "Submit"}
        </button>
        <button className="close" onClick={() => setUsernamePrompt(false)}>Close</button>
      </div>
    </div>
  </div>
)}


      {loading && <LoadingSpinner />}
      <header className="header">
        <div className="logo">Toriko Food</div>
        <nav>
          <ul className="nav-links">
            <li><a href="#home" onClick={showHomeContent}>Home</a></li>
            <li>
            <Link to={user ? "/About" : "#"} onClick={user ? undefined : () => alert('Please log in to upload')}>About</Link>
            </li>            
            <li><a href="#sdf">Contact</a></li>
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
              <img src='https://cdn-icons-png.flaticon.com/128/7486/7486747.png' alt='img'></img>
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
              <h1>Welcome {username ? `${username}` : ""} ☺️, <br /> To My Toriko Food Ingredients 😋</h1>
              <div className="hero-text">
                  <TypingEffect
                    className="text-size"
                    text={[
                      "The best 👍 delicious food that meets your needs 😍",
                      "Create Your Own Food And Make Family Happy 🤩",
                      " 😇 Upload Your Favorite Recipes For All the Foodies 🤤",
                      "🤔 Why You Are Waiting Here 😕 Start Cooking Your Favorite Food 😤"
                    ]}
                    speed={80} // Typing Speed
                    eraseSpeed={50} // Erasing Speed
                    eraseDelay={2000} // Delay before erasing
                    typingDelay={500} // Delay before typing starts
                    cursor={" "} // Custom Cursor
                    displayTextRenderer={(text, i) => {
                      return (
                        <h2 key={i} dangerouslySetInnerHTML={{ __html: text }} />
                      );
                    }}
                  />
                </div>
                <div className="categories-slider">
                  <div className="categories">
                    <div className="slider-track">
                      {duplicateCategories.map((category, index) => (
                        <button key={index} className="category-btn">
                          <img src={category.img} alt={category.name} />
                          <p>{category.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero-image">
                <div className='big'>
                  <img src="https://png.pngtree.com/png-clipart/20221001/ourmid/pngtree-fast-food-big-ham-burger-png-image_6244235.png" alt="Delicious salad" />
                  <div className="discount-badge">30% Off</div>
                </div>
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
                    <span >
                      <div className="fetched-item-text">
                        <h3>Recipe : {item.foodName}</h3>
                        <p>Uploaded by: {item.username}</p>
                        <div>
                          <button className='view' onClick={() => handleViewRecipe(item)}>
                            View Recipe
                          </button>
                          {showPopup && selectedRecipe && (
                            <div className="popup-overlay">
                              <div className="popup-content">
                                <div className='cancel'>
                                  <img src='https://www.freeiconspng.com/thumbs/close-icon/close-icon-png-close-window-icon-png-0.png'
                                    onClick={handleClosePopup}
                                    alt='Close' />
                                </div>
                                <img className='img' src={selectedRecipe.fileURL} alt={selectedRecipe.fileURL} />
                                <h3>Recipe: {selectedRecipe.foodName}</h3>
                                <h3>Uploaded By: {selectedRecipe.username}</h3>
                                <h3>Ingredients</h3> <p>{selectedRecipe.ingredients}</p>
                                <h3>Process</h3> <p>{selectedRecipe.process}</p>
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

      <footer className="bg-dark text-light pt-4">
      <div className="container">
        <div className="row text-center text-md-start">
          
          {/* Company Info */}
          <div className="col-md-6">
            <h4 className="text-warning">Toriko Food</h4>
            <p>Bringing you the best flavors from around the world.</p>
            <p>&copy; 2024 Toriko Food. All rights reserved.</p>
          </div>

          {/* Quick Links */}
          <div className="col-md-3">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/about" className="text-light text-decoration-none">About Us</a></li>
              <li><a href="/menu" className="text-light text-decoration-none">Our Menu</a></li>
              <li><a href="/contact" className="text-light text-decoration-none">Contact</a></li>
              <li><a href="/privacy-policy" className="text-light text-decoration-none">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-3">
            <h5>Contact Us</h5>
            <p>Email: support@torikofood.com</p>
            <p>Phone: +91 98765 43210</p>
            <p>Location: Mumbai, India</p>
          </div>

          {/* Social Media Links (Separate Row) */}
          <div className="foot w-100 border-top mt-3 pt-3 text-center">
            <h5>Follow Us</h5>
            <div className="d-flex justify-content-center gap-3 mt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="Facebook" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png" alt="Instagram" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/600px-LinkedIn_logo_initials.png" alt="LinkedIn" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <img src="https://cdn-icons-png.flaticon.com/256/3938/3938028.png" alt="Twitter" />
              </a>
            </div>
          </div>

        </div>

        {/* Developer Credit */}
        <div className="text-center mt-3 border-top pt-3">
          <p>Designed & Developed by <span className="text-warning fw-bold">Yash Saundalkar</span></p>
        </div>

      </div>
    </footer>
    </div>
  );
}

export default App;
