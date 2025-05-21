# 📚 Puma Pal

A full-stack web app that helps students at Valencia College connect and collaborate by creating or joining study groups based on course, campus, and time.

---

## 🚀 Features

- 🧠 **Create & Join Study Groups**  
  Students can form new study groups or browse and join existing ones.

- 🔎 **Filter by Course, Campus, and Time**  
  Narrow down search results to what’s most relevant to you.

- ⏰ **Future-Only Scheduling**  
  Groups can only be created with a date in the future. Expired groups are automatically removed.

- 📧 **Private Email Sharing**  
  Group creators can choose whether or not their email is visible to other members.

- 🔄 **Edit & Leave Groups**  
  Members can update group details or leave at any time. Groups are auto-deleted when no members remain.

---

## 🛠 Tech Stack

- **Frontend**: React (with hooks and conditional rendering)
- **Backend**: Express.js + MongoDB (Mongoose)
- **Styling**: CSS + utility classes
- **API**: Custom RESTful endpoints for study group management

---

## ⚙️ Setup Instructions

### 🔧 Prerequisites

- Node.js + npm
- MongoDB (local or Atlas)

### 📦 Install Dependencies

```bash
cd your-project-directory
npm install
```

### 🌐 Environment Variables

Create a `.env` file in the root and add:

```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

### ▶️ Run the App

```bash
# Start the backend server
npm run server

# In a new terminal, start the frontend
npm start
```

---

## 📁 Project Structure

```
pumapal/
├── client/                   # React frontend
│   ├── src/
│   │   ├── CreateGroup.jsx
│   │   ├── HomePage.jsx
│   │   ├── Results.jsx
│   └── App.jsx
├── server/                   # Express backend
│   ├── models/
│   │   └── StudyGroup.js
│   ├── routes/
│   │   └── studyGroups.js
│   └── index.js
├── .env
└── README.md
```

---

## 💡 Developer Notes

- Backend auto-cleans expired groups (`date < now`) on every GET request.
- All date inputs are validated to ensure they’re not in the past.
- Email visibility is user-controlled via a checkbox on create/edit screens.
- Group deletion logic kicks in when no members remain.

---

## 🧪 Potential Future Features

These are feature ideas we may explore in future versions of Puma Pal:

1. **Automated Meeting Reminders**
   Send emails to group members with meeting details like location, time, and notes set by the group creator.

2. ~~**Auto-Delete Past Groups**
   Automatically remove groups once the scheduled date has passed.~~ (Added!)

3. **Smart Group Duplication Check**
   If a user tries to create a group with the same course, campus, and time as an existing one, suggest joining the existing group with a message like:
   _“A similar group already exists. Want to join instead?”_

4. **MyVC Integration**
   Instead of traditional signups, explore integration with Valencia’s MyVC portal and account database to streamline user authentication using existing student credentials.

5. **Group Size Limits**
   Allow group creators to set a max number of members (e.g., “Max Pals”). Could be optional depending on use case. May defeat the purpose of Puma Pal.

6. **Pinned Groups**
   Pin joined groups to the top of the results page for quicker access. Owned groups would appear first in the pinned list.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 👨‍🎓 Made With ❤️ for Valencia College
