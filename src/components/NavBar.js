import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import FeedbackModal from './FeedbackModal';

function NavBar() {
  const { logOut, user } = useUserAuth();
  const navigate = useNavigate();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleFeedback = () => {
    setShowFeedbackModal(true);
  };

  return (
    <>
      <Navbar className="custom-navbar" expand="lg" variant="dark">
        <Container>
          <Navbar.Brand className='app-title' as={Link} to="/home" style={{ fontSize: '3rem', fontWeight: 'bold' }}>GradeWise</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {user && (
              <div className="user-info">
                <Navbar.Text className="user-email">
                  Signed in as: <a href="#login">{user.email}</a>
                </Navbar.Text>
                <Nav className="navbar-nav">
                  <Nav.Link as={Link} to="/home">Home</Nav.Link>
                  <Nav.Link onClick={handleFeedback}>Feedback</Nav.Link>
                  <Nav.Link onClick={handleLogout}>Log out</Nav.Link>
                </Nav>
              </div>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <FeedbackModal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} />
    </>
  );
}

export default NavBar;
