// client/src/components/StudyGroupList.jsx
import { useEffect, useState } from 'react';

function StudyGroupList() {
  const [studyGroups, setStudyGroups] = useState([]);

  useEffect(() => {
    // Fetch study groups from the backend when component mounts
    const fetchStudyGroups = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/study-groups');
        const data = await response.json();
        setStudyGroups(data); // Set the data once
      } catch (err) {
        console.error('Failed to fetch study groups:', err);
      }
    };

    fetchStudyGroups();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  return (
    <div>
      {studyGroups.length > 0 ? (
        studyGroups.map((group) => (
          <div key={group._id}>
            <p>📚 Course: {group.course} | Campus: {group.campus} | Time: {group.desiredTime}</p>
          </div>
        ))
      ) : (
        <p>No study groups available.</p>
      )}
    </div>
  );
}

export default StudyGroupList;
