import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, GoogleAuthProvider, signInWithPopup, signOut } from './components/Firebase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // The signed-in user info
      const user = result.user;
      setUser(user);
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="logo">Food Fusion</div>
        <nav>
          <ul className="nav-links">
            <li><a href="#">Menu</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Orders</a></li>
            <li><a href="#">Delivery</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </nav>
        {user ? (
          <div className="profile-container">
            <img src={user.photoURL} alt={user.displayName} className="profile-img" />
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <>
            <Link to="/login">
              <button className="login-btn">Admin Login</button>
            </Link>
            <button className="google-btn" onClick={handleGoogleLogin}>
              Sign in with Google
            </button>
          </>
        )}
      </header>

      <main>
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
                <img src="https://www.pngkey.com/png/full/781-7813349_19-dessert-png.png" alt="Dessert" />
                <p>Dessert</p>
              </button>
            </div>
            <div className="zip-code">
              <input type="text" placeholder="Enter Zip Code" className="zip-code-input" />
              <button className="zip-code-btn">Go</button>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://png.pngtree.com/png-clipart/20221001/ourmid/pngtree-fast-food-big-ham-burger-png-image_6244235.png" alt="Delicious salad" />
            <div className="discount-badge">30% Off</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
