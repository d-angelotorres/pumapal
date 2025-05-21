const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');

// ✅ GET: All study groups
router.get('/', async (req, res) => {
  try {
    const now = new Date();

    // 🔥 Auto-delete expired study groups (based on date only)
    await StudyGroup.deleteMany({ date: { $lt: now } });

    // ✅ Fetch and return all active groups
    const groups = await StudyGroup.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get study groups' });
  }
});

// ✅ POST: Search ONLY by course (frontend handles additional filtering)
router.post('/search', async (req, res) => {
  let { course } = req.body;

  try {
    // Remove all whitespace from search term for matching
    const normalizedCourse = course.replace(/\s+/g, '').toUpperCase();

    // Use regex to match any course that has the same characters with or without spaces
    const courseRegex = new RegExp(`^${normalizedCourse.split('').join('\\s*')}$`, 'i');
    
    const query = { course: { $regex: courseRegex } };

    const groups = await StudyGroup.find(query);
    res.json(groups);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search study groups' });
  }
});

// ✅ POST: Create group with all fields
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      course, 
      campus, 
      meetingTime,
      location: customLocation,
      groupTitle,
      notes
    } = req.body;

    // Required field validation
    if (!course || !campus || !meetingTime || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newGroup = new StudyGroup({
      course: course.trim().toUpperCase(),
      campus,
      meetingTime: meetingTime || "",           // default to empty string
      location: customLocation || "",           // always set, even if empty
      groupTitle: groupTitle || "",             // always set, even if empty
      notes: notes || "",                       // always set, even if empty
      date: new Date(req.body.date),
      ownerEmail: email,
      createdBy: email,                         // Creator tracking
      updatedBy: email,                         // Also log who updated it
      showOwnerEmail: req.body.showOwnerEmail, // Defaults to true if undefined/null
      attendees: [{ name, email }]
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Failed to create study group' });
  }
});

// ✅ PUT: Update group with proper time handling
router.put('/:id', async (req, res) => {
  try {
    const { email } = req.body; // updater's email

    if (!email) {
      return res.status(400).json({ error: 'Email of updater is required' });
    }

    // Prepare updates
    const updates = {
      ...req.body,
      meetingTime: req.body.meetingTime,
      groupTitle: req.body.groupTitle || undefined,
      updatedBy: email, // track who updated
    };

    // Remove email field from updates (so it doesn't overwrite any unintended field)
    delete updates.email;
    delete updates.time; // since handled

    // Perform the update
    const updatedGroup = await StudyGroup.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    console.log('Group updated by:', email); // logging updater email

    res.json(updatedGroup);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update group' });
  }
});


// ✅ DELETE: Remove a study group by ID
router.delete('/:id', async (req, res) => {
  try {
    await StudyGroup.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete study group' });
  }
});

// ✅ POST: Join a group
router.post('/:id/join', async (req, res) => {
  const { name, email } = req.body;
  const { id } = req.params;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const group = await StudyGroup.findById(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const alreadyJoined = group.attendees.some((a) => a.email === email);
    if (!alreadyJoined) {
      group.attendees.push({ name, email });
      await group.save();
    }

    res.json(group);
  } catch (err) {
    console.error('Join error:', err);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// ✅ POST: Leave a group
router.post('/:id/leave', async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const userIndex = group.attendees.findIndex(a => a.email === email);
    if (userIndex === -1) {
      return res.status(400).json({ error: 'User is not in this group' });
    }

    const isOwner = group.ownerEmail === email;
    const remainingMembers = group.attendees.filter(a => a.email !== email);

    if (isOwner && remainingMembers.length > 0) {
      group.ownerEmail = remainingMembers[0].email;
    } else if (isOwner) {
      await StudyGroup.findByIdAndDelete(id);
      return res.json({ message: 'Group deleted as last member left' });
    }

    group.attendees = remainingMembers;
    
    if (remainingMembers.length > 0) {
      group = await group.save();
      return res.json(group);
    }

    await StudyGroup.findByIdAndDelete(id);
    return res.json({ message: 'Group deleted as last member left' });
  } catch (err) {
    console.error('Leave error:', err);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

module.exports = router;