import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import UserData from './components/UserData';
import Products from './components/Products';
import Favorites from './components/Favorites';

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/UserData" element={<UserData />} />
      <Route path="/Products" element={<Products />} />
      <Route path="/Favorites" element={<Favorites />} />
    </Routes>
  </Router>,
  document.getElementById('root')
);