import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {

        if (!email) {
            alert('email is empty');
            return
        }

        if (!password) {
            alert('password is empty');
            return
        }

        try {
            const response = await axios.post('http://127.0.0.1:5000/signin', { email, password });
            localStorage.setItem('jwt', response.data.access_token)
            localStorage.setItem('userEmail', email)
            document.cookie = `jwt=${response.data.access_token}; path=/; HttpOnly`;
            navigate('/');
        } catch (error) {
            alert('Login failed: wrong password or email');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}

export default Login;
