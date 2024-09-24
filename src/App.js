// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DishColumns from './DishColumns';
import Login from './Login';
import Register from './Register';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dishes" element={<DishColumns />} />
            </Routes>
        </Router>
    );
}

export default App;
