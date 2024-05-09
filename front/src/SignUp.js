import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";

function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/user', { name, email, password });
            // Setting the JWT in a cookie as HttpOnly
            localStorage.setItem('jwt', response.data.users.access_token)
            localStorage.setItem('userEmail', email)
            document.cookie = `jwt=${response.data.users.access_token}; path=/; HttpOnly`;
            navigate('/');
            // You might want to redirect the user to a different page on successful sign in
        } catch (error) {
            // Error handling, could be because of wrong credentials or server issues
            alert('Sign In failed: ' + (error.response?.data.error || 'Server error'));
        }
    };

    return (
        <div>
            <h2>Sign Up</h2>
            <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
            />
            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
            />
            <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
            />
            <button onClick={handleSignIn}>Sign In</button>
        </div>
    );
}

export default SignUp;
