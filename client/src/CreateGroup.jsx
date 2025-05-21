import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function CreateGroup() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
  const maxDate = `${currentYear}-12-31`;

  // Debug state transfer
  useEffect(() => {
    console.log("Received navigation state:", {
      name: state?.name,
      email: state?.email,
      course: state?.course,
      campus: state?.campus,
      meetingTime: state?.meetingTime,
      notes: state?.notes,
      location: state?.location,
      groupTitle: state?.groupTitle,
      date: state?.date
    });
  }, [state]);

  // Form state - only editable fields
  const [formData, setFormData] = useState({
    course: state?.course || "",
    campus: state?.campus || "West",
    meetingTime: '', // Default time
    location: "",
    notes: "",
    groupTitle: state?.groupTitle || "", // Default title
    showOwnerEmail: true
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async () => {
    if (!formData.course.trim()) {
      setError("Course name is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        name: state.name, // From navigation state
        email: state.email, // From navigation state
        groupTitle: formData.groupTitle || undefined,
        course: formData.course.trim().toUpperCase(),
        campus: formData.campus,
        date: formData.date,
        meetingTime: formData.meetingTime, // Maps to backend
        location: formData.location || undefined,
        notes: formData.notes || undefined,      
        showOwnerEmail: formData.showOwnerEmail
      };

      console.log("API Payload:", payload);

      const response = await fetch("http://localhost:3000/api/study-groups", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create group");
      }

      setSuccess("Study group created successfully!");
      setTimeout(() => navigate('/results', { 
        state: {
          ...state,
          course: formData.course // Use the created course
        }
      }), 1500);
    } catch (err) {
      console.error("Creation error:", err);
      setError(err.message || "Failed to create study group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-group-container">
      <button onClick={() => navigate(-1)} 
      className="back-button">
        ← Back
      </button>

      <h2>Create a Study Group</h2>
    
      {/* Display user info (read-only) 
      <div className="user-info">
        <p><strong>Name:</strong> {state?.name}</p>
        <p><strong>Email:</strong> {state?.email}</p>
      </div> */}

        {/* TODO */}
      <div className="form-group">
        <label>Group Name (optional)</label>
        <input
          type="text"
          name="groupTitle"
          value={formData.groupTitle}
          onChange={handleChange}
          placeholder="e.g. My Study Group"
        />
      </div>

      <div className="form-group">
        <label>Course</label>
        <input
          type="text"
          name="course"
          value={formData.course}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            if (/^[A-Z]{0,3}\d{0,4}[A-Z]{0,1}$/.test(value)) {
              handleChange({
                target: {
                  name: e.target.name,
                  value: value
                }
                });
              }
            }}
            pattern="[A-Z]{2,3}\d{3,4}[A-Z]?"
            title="Format: 2-3 letters, 3-4 numbers, optional letter (e.g. CHM1045C)"
            placeholder="e.g. CHM1045C"
            required
        />
      </div>

      <div className="form-group">
        <label>Campus</label>
        <select
          name="campus"
          value={formData.campus}
          onChange={handleChange}
          required
        >
          <option value="West">West</option>
          <option value="East">East</option>
          <option value="Winter Park">Winter Park</option>
          <option value="Osceola">Osceola</option>
          <option value="Poinciana">Poinciana</option>
          <option value="Lake Nona">Lake Nona</option>
          <option value="Downtown">Downtown</option>
          <option value="Online">Online</option>
        </select>
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          min={today}
          max={maxDate}
          required
        />
      </div>

      <div className="form-group">
        <label>Meeting Time</label>
        <input
          type="time"
          name="meetingTime"
          value={formData.meetingTime}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Location (optional)</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g. UCF building, 2nd floor"
        />
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Reviewing study guide for midterm..."
          rows="4"
          style={{ width: '100%' }}
        />
      </div>
   
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id="showOwnerEmail"
          name="showOwnerEmail"
          checked={formData.showOwnerEmail !== false} // Default to true (checked)
          onChange={handleChange}
        />
        <label htmlFor="showOwnerEmail" style={{ marginBottom: 0 }}>
          Allow group members to view your email
        </label>
      </div>

      {error && (
        <div className="error-message">
          {error}
          {error.includes("required") && (
            <span style={{ display: "block", fontSize: "0.8rem" }}>
              Please fill in all required fields
            </span>
          )}
        </div>
      )}

      {success && <div className="success-message">{success}</div>}

      <button 
        onClick={handleCreate} 
        disabled={isLoading}
        className="create-button"
      >
        {isLoading ? "Creating..." : "Create Group"}
      </button>
    </div>
  );
}

export default CreateGroup;