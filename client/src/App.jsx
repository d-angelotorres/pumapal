import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import CreateGroup from './CreateGroup';
import Results from './Results';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-group" element={<CreateGroup />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  );
}

export default App;