import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import Navbar from './components/Navbar';
import './services/axiosConfig'; // Import axios config to initialize it
import 'bootstrap/dist/css/bootstrap.min.css';
import './theme.css'; // Import our custom theme
import './App.css';

function App() {
  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <Navbar />
        <main className="flex-grow-1">
          <AppRouter />
        </main>
      </div>
    </Router>
  );
}

export default App;