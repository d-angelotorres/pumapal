import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

function getTimeLabel(timeStr) {
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const isPM = timeStr.toUpperCase().includes('PM');

  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;

  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 300 && totalMinutes < 720) return 'Morning';    // 5:00 AM – 11:59 AM
  if (totalMinutes >= 720 && totalMinutes < 1080) return 'Afternoon'; // 12:00 PM – 5:59 PM
  if (totalMinutes >= 1080 && totalMinutes < 1260) return 'Evening';  // 6:00 PM – 8:59 PM
  return 'Night';                                                     // 9:00 PM – 4:59 AM
}

function formatTo12Hour(timeStr) {
  // 1. Input validation
  if (!timeStr || typeof timeStr !== 'string') return '';
  
  // 2. Safe splitting and parsing
  const timeParts = timeStr.split(':');
  if (timeParts.length < 2) return '';
  
  // 3. Numeric conversion with fallbacks
  const hour = parseInt(timeParts[0]) || 0;
  const minute = parseInt(timeParts[1]) || 0;
  
  // 4. Range validation
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';

  // 5. Safe formatting
  try {
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(/^0/, ''); // Remove leading zero if present
  } catch (e) {
    console.error('Time formatting failed:', e);
    return '';
  }
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinStatus, setJoinStatus] = useState({});
  const [showEmails, setShowEmails] = useState({});
  const [editingGroup, setEditingGroup] = useState(null);
  const [leaveStatus, setLeaveStatus] = useState({});
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
  const maxDate = `${currentYear}-12-31`;


  const handleEditGroupToggle = (group) => {
    setEditingGroup(editingGroup?._id === group._id ? null : group);
  };

  // Get state from navigation or redirect
  const { state } = location;
  if (!state?.course || !state?.email || !state?.name) {
    navigate('/');
    return null;
  }

// Count how many groups exist per course
  const courseCounts = groups.reduce((acc, group) => {
    const course = group.course;
    acc[course] = (acc[course] || 0) + 1;
    return acc;
  }, {});

// Track the current index for each course during rendering
  const courseIndices = {};
  
  // Filters
  const [filters, setFilters] = useState({
    campus: '',
    desiredTime: '',
    desiredDay: ''
  });
  
  const { course, name, email, campus } = state;

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/study-groups/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course }), // ✅ Only send what's actually needed
        });

        if (!response.ok) throw new Error('Failed to fetch groups');
        const data = await response.json();
        setGroups(data);
      } catch (err) {
        setError(err.message || 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

  fetchGroups();
}, [course]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && editingGroup) {
        setEditingGroup(null);
      }
    };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [editingGroup]); // Only re-run when editingGroup changes

// ✅ Filter groups by frontend-only fields
const filteredGroups = groups.filter(group => {
  const campusMatch = !filters.campus || group.campus === filters.campus;
  const timeMatch = !filters.desiredTime || getTimeLabel(group.meetingTime) === filters.desiredTime;
  
  // Extract weekday once and compare
  let dayMatch = true;
  if (filters.desiredDay && group.date) {
    const groupDay = new Date(group.date).toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'UTC' // Add this if you want to avoid timezone offsets affecting the day
    });
    dayMatch = groupDay === filters.desiredDay;
  }

  return campusMatch && timeMatch && dayMatch;
});

  const handleJoin = async (groupId) => {
    setJoinStatus(prev => ({ ...prev, [groupId]: 'joining' }));
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/study-groups/${groupId}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        }
      );

      if (!response.ok) throw new Error('Join failed');
      
      const updatedGroup = await response.json();
        // Handle group deletion case
      if (updatedGroup === null || updatedGroup.deleted) {
        setGroups(groups.filter(g => g._id !== groupId));
        return; // Exit early since group no longer exists
      }
      
      setGroups(groups.map(g => g._id === groupId ? updatedGroup : g));
      setJoinStatus(prev => ({ ...prev, [groupId]: 'joined' }));
      
      setTimeout(() => {
        setJoinStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[groupId];
          return newStatus;
        });
      }, 3000);
    } catch (err) {
      setJoinStatus(prev => ({ ...prev, [groupId]: 'error' }));
      setTimeout(() => {
        setJoinStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[groupId];
          return newStatus;
        });
      }, 3000);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    setLeaveStatus(prev => ({ ...prev, [groupId]: 'leaving' }));
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/study-groups/${groupId}/leave`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) throw new Error('Leave failed');
      
      const updatedGroup = await response.json();
      setGroups(groups.map(g => g._id === groupId ? updatedGroup : g));
      setLeaveStatus(prev => ({ ...prev, [groupId]: 'left' }));
      
      setTimeout(() => {
        setLeaveStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[groupId];
          return newStatus;
        });
      }, 3000);
    } catch (err) {
      setLeaveStatus(prev => ({ ...prev, [groupId]: 'error' }));
      setTimeout(() => {
        setLeaveStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[groupId];
          return newStatus;
        });
      }, 3000);
    }
  };

  const toggleEmails = (groupId) => {
    setShowEmails(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
  };

  const handleUpdateGroup = async (updatedData) => {
  try {
    // ✅ Don’t overwrite meetingTime with .time — just log actual data
    console.log("Sending update with:", {
      ...updatedData,
      email: editingGroup.attendees[0]?.email,
    });

    const response = await fetch(
      `http://localhost:3000/api/study-groups/${editingGroup._id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedData,
          email: editingGroup.attendees[0]?.email, // ✅ leave meetingTime as-is from form
        }),
      }
    );

    if (!response.ok) throw new Error('Update failed');

    const updatedGroup = await response.json();
    setGroups(groups.map(g => g._id === updatedGroup._id ? updatedGroup : g));
    setEditingGroup(null);
  } catch (err) {
    console.error('Update error:', err);
    setError('Failed to update group');
  }
};


  if (loading) return <div className="loading">Loading groups...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="results-container">
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="campus-filter">Filter by Campus:</label>
          <select
            id="campus-filter"
            value={filters.campus}
            onChange={(e) => setFilters({...filters, campus: e.target.value})}
          >
            <option value="">All Campuses</option>
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

        <div className="filter-group">
          <label htmlFor="time-filter">
            Filter by Time:
            <span 
              className="time-filter-tooltip" 
              data-tooltip="Morning: 5AM – 11:59AM&#10;Afternoon: 12PM – 5:59PM&#10;Evening: 6PM – 8:59PM&#10;Night: 9PM – 4:59AM"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                fill="#3b82f6"  // Blue-500 color
                className="bi bi-question-circle" 
                viewBox="0 0 16 16"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
              </svg>
            </span>
          </label>
          <select
            id="time-filter"
            value={filters.desiredTime}
            onChange={(e) => setFilters({...filters, desiredTime: e.target.value})}
          >
            <option value="">All Times</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="day-filter">Filter by Day:</label>
          <select
            id="day-filter"
            value={filters.desiredDay}
            onChange={(e) => setFilters({...filters, desiredDay: e.target.value})}
          >
            <option value="">All Days</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>            
          </select>
        </div>

        <button 
          onClick={() => setFilters({ campus: '', desiredTime: '', desiredDay: '' })}
          className="clear-filters"
        >
          Clear Filters
        </button>
      </div>

      <h2>Available Study Groups for {course}</h2>
      
      <button 
        onClick={() => navigate('/', { 
          state: { 
            name, 
            email, 
            course, 
            fromResults: true,
           } 
          })
        } 
        className="back-button"
      >
        ← Back to Search
      </button>
      
      {filteredGroups.length === 0 ? (
        <p>No study groups match your filters.</p>
      ) : (
        <div className="groups-list">
          {filteredGroups.map(group => {
            const isOwner = group.ownerEmail === email;
            const isMember = group.attendees?.some(a => a.email === email) || isOwner;
            const status = joinStatus[group._id];
            const leaveState = leaveStatus[group._id];

            return (
              <div key={group._id} className="group-card">
                <h3>
                  {group.groupTitle || `${group.course} Study Group 
                  ${(courseIndices[group.course] = (courseIndices[group.course] || 0) + 1)}`}
                </h3>
                <p><strong>Course:</strong> {group.course}</p>                
                <p><strong>Campus:</strong> {group.campus}</p>
                <p>
                  <strong>Date:</strong>{" "}
                  {group.date ? (() => {
                    const [year, month, day] = group.date.split('T')[0].split('-').map(Number);
                    const date = new Date(year, month - 1, day); // months are 0-indexed in JS
                    return new Intl.DateTimeFormat("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(date);
                  })() : "N/A"}
                </p>
                <p><strong>Time:</strong> {formatTo12Hour(group.meetingTime)}</p>
                <p><strong>Pals:</strong> {group.attendees?.length || 0}</p>
                {isMember && (
                <p><strong>Location:</strong> {group.location || 'TBD'}</p>
            )}   
                <p><strong>Notes:</strong> {group.notes || 'No notes provided'}</p>
                           
                {isOwner && (
                  <div className="owner-badge">
                    <span>⭐ You own this group</span>
                  </div>
                )}

                {isMember ? (
                  <div className="member-actions">
                    {isOwner && (   
                      <button
                        onClick={() => handleEditGroupToggle(group)}
                        className="edit-button"
                        aria-expanded={editingGroup?._id === group._id}
                      >
                        Edit Group
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleEmails(group._id)}
                      className="contact-button"
                    >
                      {showEmails[group._id] ? 'Hide Pals' : 'Show Pals'}
                    </button>

                    <button
                      onClick={() => handleLeaveGroup(group._id)}
                      disabled={leaveState === 'leaving'}
                      className="leave-button"
                    >
                      {leaveState === 'leaving' ? 'Leaving...' : 'Leave Group'}
                    </button>

                    {showEmails[group._id] && (
                      <div className="contact-list">
                        <h4>Pals:</h4>
                        <ul>
                          {group.attendees?.map((attendee, index) => {
                            const isCurrentUser = attendee.email === email;
                            const isOwnerEmailVisible = 
                              (!isCurrentUser && isOwner) || // Owners see all except their own
                              (attendee.email === email) ||  // Users always see their own (but we'll hide it)
                              (group.showOwnerEmail && group.ownerEmail === attendee.email);

                            const isOwnerTag = attendee.email === group.ownerEmail ? ' (Owner)' : '';
                            const shouldShowEmail = isOwnerEmailVisible && !isCurrentUser; // Hide current user's email
                            const emailLink = shouldShowEmail ? (
                              <a href={`mailto:${attendee.email}`}>{attendee.email}</a>
                            ) : null;

                            const hasExtra = emailLink || isOwnerTag;

                            return (
                              <li key={index}>
                                <span style={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                                  {attendee.name}
                                  {isCurrentUser && <span style={{ marginLeft: 4 }}>(you)</span>}
                                </span>
                                {hasExtra && ' - '}
                                {emailLink}
                                {isOwnerTag}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="join-actions">
                    {isOwner ? (
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="edit-button"
                      >
                        Edit Group
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(group._id)}
                        disabled={status === 'joining'}
                      >
                        {status === 'joining' ? 'Joining...' : 'Join Group'}
                      </button>
                    )}
                  </div>
                )}

                {status === 'joined' && (
                  <p className="success-message">Successfully joined!</p>
                )}
                {status === 'error' && (
                  <p className="error-message">Failed to join group</p>
                )}
                {leaveState === 'left' && (
                  <p className="success-message">You have left the group</p>
                )}
                {leaveState === 'error' && (
                  <p className="error-message">Failed to leave group</p>
                )}

                {editingGroup?._id === group._id && (
                  <div className="edit-modal">
                    <h4>Edit Group Details</h4>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      handleUpdateGroup({
                        groupTitle: formData.get('groupTitle'),
                        campus: formData.get('campus'),
                        location: formData.get('location'),
                        date: formData.get('date'),
                        meetingTime: formData.get('meetingTime'),
                        notes: formData.get('notes'),
                        email: editingGroup.ownerEmail || editingGroup.attendees[0]?.email
                      });
                    }}>
                      <div className="form-group">
                        <label>Group Name (optional)</label>
                        <input
                          type="text"
                          name="groupTitle"
                          defaultValue={group.groupTitle || ''}
                          placeholder={
                            group.groupTitle && typeof group.groupTitle === 'string' && group.groupTitle.includes("Study Group")
                              ? group.groupTitle 
                              : `${group.course} Study Group`
                          }
                          onBlur={(e) => {
                            if (!e.target.value.trim()) {
                              e.target.value = `${group.course} Study Group ${
                                (courseIndices[group.course] = (courseIndices[group.course] || 0) + 1)
                              }`;
                            }
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Campus</label>
                        <select
                          name="campus"
                          defaultValue={group.campus}
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
                          defaultValue={group.date ? new Date(group.date).toISOString().split("T")[0] : ''}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Meeting Time</label>
                        <input
                          type="time"
                          name="meetingTime"
                          defaultValue={group.meetingTime || ''}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Location (optional)</label>
                        <input
                          type="text"
                          name="location"
                          defaultValue={group.location || ''}
                          placeholder="e.g. Library 2nd floor"
                        />
                      </div>

                      <div className="form-group">
                        <label>Notes (optional)</label>
                        <textarea
                          name="notes"
                          defaultValue={group.notes || ''}
                          rows="3"
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit">Save Changes</button>
                        <button
                          type="button"
                          onClick={() => setEditingGroup(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="create-option">
        <p>Don't see a group that works for you?</p>
        <button 
          onClick={() => navigate('/create-group', { state })}
          className="create-alt-button"
        >
          Create New Group
        </button>
      </div>
    </div>
  );
}

export default Results;