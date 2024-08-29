import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useUserAuth } from '../context/UserAuthContext';

const FeedbackModal = ({ show, onHide }) => {
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const { user } = useUserAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const feedbackRef = collection(db, 'feedback');
      await addDoc(feedbackRef, {
        name,
        feedback,
        email: user.email,
        timestamp: new Date(),
      });
      onHide(); // Close the modal
      setName(''); // Clear the form fields
      setFeedback('');
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Submit Feedback</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="feedbackName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group controlId="feedbackText" className="mt-3">
            <Form.Label>Feedback</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-3">
            Submit
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default FeedbackModal;
