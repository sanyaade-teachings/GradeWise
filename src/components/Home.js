import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import NavBar from './NavBar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Form from 'react-bootstrap/Form';
import { getDownloadURL, uploadBytes, ref as firebaseStorageRef } from 'firebase/storage';
import { storage } from '../firebase';
import TutorialWrapper from './Tutorial';

const ViewAssignments = () => {
  // State variables
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [newAssignmentName, setNewAssignmentName] = useState('');
  const [newAssignmentDescription, setNewAssignmentDescription] = useState('');
  const [newGradingRubric, setNewGradingRubric] = useState('Use a standard grading rubric for this grade level.');
  const [newEducationLevel, setNewEducationLevel] = useState('College Freshman');
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [tutorialStep, setTutorialStep] = useState();
  const [pauseTour, setPauseTour] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Function to fetch assignments from Firestore
  const fetchAssignments = useCallback(async () => {
    if (user && user.uid) {
      const assignmentsRef = collection(db, `users/${user.uid}/assignments`);
      const assignmentsSnapshot = await getDocs(assignmentsRef);

      const assignmentsData = await Promise.all(assignmentsSnapshot.docs.map(async (doc) => {
        const assignmentData = doc.data();
        const submissionsRef = collection(db, `users/${user.uid}/assignments/${doc.id}/submissions`);
        const submissionsSnapshot = await getDocs(submissionsRef);
        const submissions = submissionsSnapshot.docs.map(subDoc => subDoc.data());
        return { ...assignmentData, id: doc.id, submissions };
      }));

      setAssignments(assignmentsData);
      setFilteredAssignments(assignmentsData); // Initially, no filtering
    }
  }, [user]);

  // Fetch assignments on component mount and when user changes
  useEffect(() => {
    fetchAssignments();
  }, [user, user?.email, fetchAssignments]); // Dependencies array

  // Handle file selection for uploading submissions
  const handleFileSelection = (file) => {
    const allowedExtensions = ['txt'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setErrorMessage(''); // Clear any previous error message
    } else {
        setErrorMessage('Invalid file type. Please upload a .txt file.');
    }
};

  // Handle creating a new assignment
  const handleCreateAssignment = async () => {
    if (!newAssignmentName || !newAssignmentDescription || !newGradingRubric) {
      // Handle empty fields (show an error or alert)
      return;
    }

    try {
      const assignmentsRef = collection(db, `users/${user.uid}/assignments`);
      const newAssignmentRef = doc(assignmentsRef);

      await setDoc(newAssignmentRef, {
        assignmentName: newAssignmentName,
        assignmentDescription: newAssignmentDescription,
        gradingRubric: newGradingRubric,
        educationLevel: newEducationLevel,
        userEmail: user.email,
      });

      // Close the modal and reset the form fields
      setShowCreateAssignmentModal(false);
      setNewAssignmentName('');
      setNewAssignmentDescription('');
      setNewGradingRubric('Use a standard grading rubric for this grade level.');
      setNewEducationLevel('College Freshman');
      // Fetch assignments again to update the list
      await fetchAssignments();

      // Move to the next tutorial step
      setTutorialStep(1);
      setPauseTour(false); // Resume the tour
    } catch (error) {
      console.error('Error creating new assignment:', error);
    }
  };

  // Handle file upload for a submission
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Define the storage path
    const storageRef = firebaseStorageRef(storage, `submissions/${file.name}`);
    await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(storageRef);

    // Specify the document reference
    const newSubmissionId = doc(collection(db, `users/${user.uid}/assignments/${currentAssignmentId}/submissions`)).id;
    const submissionDocRef = doc(db, `users/${user.uid}/assignments/${currentAssignmentId}/submissions`, newSubmissionId);

    await setDoc(submissionDocRef, {
      fileUrl: fileUrl,
      fileName: file.name,
      createdAt: new Date(), // Store submission time
      graded: false, // Initial state
    });

    setShowUploadModal(false); // Close the modal after upload
    setTutorialStep(2);
    setPauseTour(false); // Resume the tour

    // Navigate to the view submissions page
    navigate(`/view-submissions/${currentAssignmentId}`, { state: { tutorialStep: 2 } });
  };

  // Handle deleting an assignment
  const handleDeleteAssignment = async (assignmentId) => {
    const confirmed = window.confirm('Are you sure you want to delete this assignment?');
    if (!confirmed) return;

    try {
      const assignmentDocRef = doc(db, `users/${user.uid}/assignments`, assignmentId);
      const submissionsRef = collection(db, `users/${user.uid}/assignments/${assignmentId}/submissions`);
      const submissionsSnap = await getDocs(submissionsRef);

      // Create a batch instance
      const batch = writeBatch(db);

      // Delete all submissions
      submissionsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Commit the batch
      await batch.commit();

      // Delete the assignment itself
      await deleteDoc(assignmentDocRef);
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  // Filter assignments based on the selected filter
  useEffect(() => {
    switch (filter) {
      case 'All':
        setFilteredAssignments(assignments);
        break;
      case 'With Submissions':
        setFilteredAssignments(assignments.filter((assignment) => assignment.submissions.length > 0));
        break;
      case 'Without Submissions':
        setFilteredAssignments(assignments.filter((assignment) => assignment.submissions.length === 0));
        break;
      default:
        setFilteredAssignments(assignments);
    }
  }, [filter, assignments]);

  // Handle changing the filter
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <TutorialWrapper pauseTour={pauseTour} currentStep={tutorialStep}>
      <NavBar />
      <Container fluid className="mt-5">
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="content-limit" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <Row>
                <Col lg={2} md={3} className="d-flex align-items-start">
                  <div className="pt-5">
                    <ListGroup>
                      <ListGroup.Item action onClick={() => handleFilterChange('All')}>
                        All Assignments
                      </ListGroup.Item>
                      <ListGroup.Item action onClick={() => handleFilterChange('With Submissions')}>
                        Assignments with Submissions
                      </ListGroup.Item>
                      <ListGroup.Item action onClick={() => handleFilterChange('Without Submissions')}>
                        Assignments without Submissions
                      </ListGroup.Item>
                    </ListGroup>
                  </div>
                </Col>
                <Col lg={10} md={9}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Assignments</h2>
                    <Button
                      variant="primary"
                      size="sm"
                      className="create-assignment-button"
                      onClick={() => {
                        setShowCreateAssignmentModal(true);
                        setPauseTour(true); // Pause the tour while entering details
                      }}
                    >
                      Create Assignment
                    </Button>
                  </div>
                  {filteredAssignments.length === 0 && (
                    <p>No assignments saved. Click "Create Assignment" to start grading assignments.</p>
                  )}
                  {filteredAssignments.map((assignment) => (
                    <Card key={assignment.id} className="mb-3 flex-row" style={{ minHeight: '4rem' }}>
                      <Card.Img variant="left" src={logo} style={{ width: '3rem', height: '3rem', objectFit: 'cover' }} />
                      <Card.Body className="flex-grow-1">
                        <Card.Title style={{ fontSize: '1rem' }}>{assignment.assignmentName}</Card.Title>
                        <Card.Text style={{ fontSize: '.9rem' }}>{assignment.assignmentDescription.substring(0, 300)}...</Card.Text>
                      </Card.Body>
                      <div className="d-flex flex-column align-items-end p-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mb-1 new-submission-button"
                          style={{ width: '100px', fontSize: '0.7em' }}
                          onClick={() => {
                            setCurrentAssignmentId(assignment.id);
                            setShowUploadModal(true);
                            setPauseTour(true); // Pause the tour while uploading
                          }}
                        >
                          New Submission
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="mb-1"
                          style={{ width: '100px', fontSize: '0.7em' }}
                          onClick={() => navigate(`/view-submissions/${assignment.id}`, { state: { tutorialStep } })}
                        >
                          View Submissions
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="mb-1"
                          style={{ fontSize: '0.7em', whiteSpace: 'nowrap'}}
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
        <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Upload Submission</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Select file to upload</Form.Label>
                <Form.Control 
                type="file" 
                onChange={(e) => handleFileSelection(e.target.files[0])}
                accept=".txt" />
                {errorMessage && <div className="text-danger mt-2">{errorMessage}</div>}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => handleFileUpload(selectedFile)}>
              Upload
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal show={showCreateAssignmentModal} onHide={() => setShowCreateAssignmentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Assignment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="assignmentForm.GradeLevel">
                <Form.Label>Grade Level</Form.Label>
                <Form.Control
                  as="select"
                  value={newEducationLevel}
                  onChange={(e) => setNewEducationLevel(e.target.value)}
                >
                  <option>8th Grade</option>
                  <option>9th Grade</option>
                  <option>10th Grade</option>
                  <option>11th Grade</option>
                  <option>12th Grade</option>
                  <option>College Freshman</option>
                  <option>College Sophomore</option>
                  <option>College Junior</option>
                  <option>College Senior</option>
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3" controlId="assignmentForm.AssignmentName">
                <Form.Label>Assignment Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Name this assignment..."
                  value={newAssignmentName}
                  onChange={(e) => setNewAssignmentName(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="assignmentDescription">
                <Form.Label>Assignment Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Paste the assignment instructions here..."
                  value={newAssignmentDescription}
                  onChange={(e) => setNewAssignmentDescription(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="gradingRubric">
                <Form.Label>Grading Rubric</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Paste the grading rubric here..."
                  value={newGradingRubric}
                  onChange={(e) => setNewGradingRubric(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateAssignmentModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleCreateAssignment}>
              Create Assignment
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </TutorialWrapper>
  );
};

export default ViewAssignments;
