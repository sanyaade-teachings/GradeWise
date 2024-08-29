import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import GoogleButton from "react-google-button";
import { useUserAuth } from "../context/UserAuthContext";
import Layout from "./Layout.js";
import { db } from '../firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Updated imports

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { logIn, googleSignIn } = useUserAuth();
  const navigate = useNavigate();

  // Helper function to ensure user document exists in Firestore
  const ensureUserDocument = async (user) => {
    const userRef = doc(db, "users", user.uid); // Use user's UID as document ID
    const userDoc = await getDoc(userRef);

    // If user document does not exist, create a new one
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: user.email, // Use email from user credential
        // Any other fields you want to initialize
      });
    }
  };

  // Handle form submission for email and password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await logIn(email, password);
      await ensureUserDocument(userCredential.user); // Ensure user document exists
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await googleSignIn();
      await ensureUserDocument(userCredential.user); // Ensure user document exists
      navigate("/home");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Layout>
      <main className="main-content">
        <div className="centered-box">
          <h2 className="mb-3">Log In</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>

            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Control
                type="email"
                placeholder="Email address"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Control
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="outline-primary" type="Submit">
                Log In
              </Button>
            </div>
          </Form>
          <hr />
          <div>
            <GoogleButton
              className="g-btn"
              type="dark"
              onClick={handleGoogleSignIn}
            />
          </div>
          <div className="p-4 box mt-3 text-center">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Login;
