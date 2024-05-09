import './App.css';

import { BrowserRouter as  Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import FileUpload from './FileUpload';
import SignUp from './SignUp';
import Main from "./Main";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/upload" element={<FileUpload />} />
            </Routes>
        </Router>
    );
}

export default App;
