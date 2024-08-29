import React, { useState, useEffect } from 'react';
import './App.css';
import { UserAuthContextProvider } from './context/UserAuthContext';
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import ViewSubmissions from './components/ViewSubmissions';

function App() {
  // State to manage access token verification
  const [accessGranted, setAccessGranted] = useState(false);
  const [idToken, setIdToken] = useState('');
  const correctToken = process.env.REACT_APP_CORRECT_TOKEN;

  // Check if access has already been granted on component mount
  useEffect(() => {
    const isAccessGranted = sessionStorage.getItem('accessGranted');
    if (isAccessGranted) {
      setAccessGranted(true);
    }
  }, []);

  // Function to handle access token submission
  const handleIdTokenSubmit = () => {
    if (idToken === correctToken) {
      setAccessGranted(true);
      sessionStorage.setItem('accessGranted', 'true');
    } else {
      setAccessGranted(false);
    }
  };

  // Render access token input if access not granted
  if (!accessGranted) {
    return (
      <>
      <div className="App">
        <header className="top-bar"><span className="grade-wise-title">GradeWise</span></header>
        <main className="main-content">
          <div className="centered-box">
            <h1 className="App-title">Enter Access Code</h1>
            <input
              className="my-3"
              type="text"
              value={idToken}
              onChange={(e) => setIdToken(e.target.value)}
              placeholder="Access Code"
            />
            <Button variant="outline-primary" onClick={handleIdTokenSubmit}>Submit</Button>
          </div>
        </main>
        <footer className="footer">
          Copyright &copy; 2024 GradeWise, LLC
        </footer>
      </div>
      </>
    );
  }

  // Render the main app if access is granted
  return (
    <Router>
      <UserAuthContextProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/view-submissions/:id" element={
            <ProtectedRoute>
              <ViewSubmissions />
            </ProtectedRoute>
          } />
        </Routes>
      </UserAuthContextProvider>
    </Router>
  );
}

export default App;
