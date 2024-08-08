import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import App from './App';
import './index.css';
import Products from './components/Products';

ReactDOM.render(
  <React.StrictMode>
    <Router basename="/Toriko-Food-ingredients-">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/Products" element={<Products />} /> 
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
