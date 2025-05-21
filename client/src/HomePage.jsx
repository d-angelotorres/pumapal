// client/src/HomePage.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const navigationType = useNavigationType(); // <- NEW

  // Only restore state if user came from Results AND this wasn't a fresh page load
  const cameFromResults = routeLocation.state?.fromResults === true && navigationType === 'PUSH';

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false); // For "create one?" modal

  // Prefill only if truly navigating back from Results (not refreshing)
  useEffect(() => {
    if (cameFromResults) {
      const state = routeLocation.state;
      if (state.name) setName(state.name);
      if (state.email) setEmail(state.email);
      if (state.course) setCourse(state.course);
    }
  }, [cameFromResults, routeLocation.state]);

  // Handle form submission (search)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!course) {
      setError("Course is required.");
      return;
    }

    if (!email.match(/^[a-zA-Z0-9._%+-]+@(mail\.)?valenciacollege\.edu$/)) {
      setError('Email must be a valid Valencia College email address.');
      return;
    }

    setError("");
    setMessage("Searching for study groups...");

    try {
      const response = await fetch(
        "http://localhost:3000/api/study-groups/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course }), // Only send course to match more broadly
        },
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.length > 0) {
        // Redirect to results page and pass ALL criteria as filters
        navigate("/results", {
          state: {
            name,
            email,
            course,
          },
        });
      } else {
        setMessage("😿 No study groups exist. Want to create one? 😸");
        setShowModal(true);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Failed to search for study groups");
    }
  };

  // Handle creation if user agrees after "no match"
  const handleCreateGroup = () => {
  // Simply navigate to the CreateGroup page
  navigate('/create-group', {
  state: {
    name,       // From form input
    email,      // From form input
    course,     // From form input
  }
})
};

  return (
    <>
      <h1>Puma Pal</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Purrcy Puma"
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="purrcy@valenciacollege.edu"
            required
          />
        </div>

        <div>
          <label htmlFor="course">Course</label>
          <input
            type="text"
            id="course"
            value={course}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z]{0,3}\d{0,4}[A-Z]{0,1}$/.test(value)) {
                setCourse(value);
              }
            }}
            pattern="[A-Z]{2,3}\d{3,4}[A-Z]?"
            title="Format: 2-3 letters, 3-4 numbers, optional letter (e.g. CHM1045C)"
            placeholder="e.g. CHM1045C"
            required
          />
        </div>

        <button type="submit">Find Puma Pals</button>
      </form>
      {/* Modal if no matches */}
      {showModal && (
        <div className="modal">
          <p>😿 No groups exist for that course. <br/> Create one? 😸</p>
          <button onClick={handleCreateGroup}>Yes</button>
          <button onClick={() => setShowModal(false)}>No</button>
        </div>
      )}
    </>
  );
}

export default App;
