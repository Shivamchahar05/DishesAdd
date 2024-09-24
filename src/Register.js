// src/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import './Register.css';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for the toast


const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/register', { email, password });
            window.location.href = '/';
        } catch (error) {
            console.error('Registration failed', error);
            toast.error(error.response.data,{
                position: "top-right",
                autoClose: 3000, 
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            }); 

        }
    };

    return (
        
        <div className="register-container">
            <form onSubmit={handleSubmit}>
                <h1>Register</h1>
                <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Register</button>
            </form>
            <div className="login-account">
                <p>Already have an account? <a href="/">Login here</a>.</p>
            </div>
            <ToastContainer /> 

        </div>
        
    );
};

export default Register;
