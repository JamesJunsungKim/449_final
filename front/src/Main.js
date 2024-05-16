import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import {useDropzone} from 'react-dropzone'


function Counter() {
    const [count, setCount] = useState(0);
    const navigate = useNavigate()
    const userEmail = localStorage.getItem('userEmail'); // Get the user's email from localStorage
    const [files, setFiles] = useState([]);

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles);
    }, [])

    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})


    const handleLogout = () => {
        localStorage.removeItem('jwt'); // Remove the stored JWT
        localStorage.removeItem('userEmail'); // Remove the stored email
        navigate('/login')
    };

    const checkTokenAndFetchCount = async () => {
        const token = localStorage.getItem('jwt');  // Replace with your method of storing the token
        if (!token) {
            navigate('/login');  // Adjust the path as needed
        } else {
            fetchCount();
        }
    };

    // Function to fetch the current count from the backend
    const fetchCount = async () => {
        const token = localStorage.getItem('jwt'); // Retrieve the token
        try {
            const response = await axios.get('http://127.0.0.1:5000/count', {
                headers: { Authorization: `Bearer ${token}` } // Include the token in the header
            });
            setCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch count', error);
        }
    };

    // Function to increment the count on the backend
    const incrementCount = async () => {
        const token = localStorage.getItem('jwt'); // Retrieve the token
        try {
            const response = await axios.post('http://127.0.0.1:5000/increment', {}, {
                headers: { Authorization: `Bearer ${token}` } // Include the token in the header
            });
            setCount(response.data.count); // Assuming the backend sends back the new count
        } catch (error) {
            console.error('Failed to increment count', error);
        }
    };


    const didClickOnResetFiles = () => {
        setFiles([])
    }

    const didClickOnSend = async () => {
        if (files.length === 0) {
            return alert('Please select a file before sending.');
        }

        const token = localStorage.getItem('jwt');
        const formData = new FormData();
        formData.append('file', files[0]); // Assuming you're uploading the first selected file

        try {
            const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('File uploaded successfully:', response.data);
        } catch (error) {
            console.error('Failed to send file', error);
        }
    };


    // Fetch the initial count on component mount
    useEffect(() => {
        checkTokenAndFetchCount();
    }, []);

    return (
        <div>
            <h1>Welcome, {userEmail}</h1> {/* Display the user's email */}
            <button onClick={handleLogout}>Log Out</button>
            {/* Logout button */}

            <h1>Count: {count}</h1>
            <button onClick={incrementCount}>Increment Count</button>

            <div
                style={{border: '#222222 1px solid', marginTop: '20px'}}
                {...getRootProps()}
            >
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p>Drop the files here ...</p> :
                        <p>Drag 'n' drop some files here, or click to select files</p>
                }
            </div>

            <div>
                {files.map((file, index) => (
                    <div key={index}>
                        File: {file.name}
                    </div>
                ))}
            </div>


            <button
                onClick={didClickOnSend}>
                Send
            </button>

            <button
                onClick={didClickOnResetFiles}>
                Reset
            </button>

        </div>
    );
}

export default Counter;
