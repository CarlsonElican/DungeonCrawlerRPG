import { useEffect, useState } from 'react'
import './App.css'
import LoginRegister from './LoginRegister';
import Game from './Game';
import { api } from './api';

interface User {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    document.title = "Dungeon Crawler RPG";
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    api.get<User>('/users/me')
      .then(response => setCurrentUser(response.data))
      .catch(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
      });
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  return (
    <>
      <section id="center">
        {currentUser ? (
          <Game onLogout={handleLogout} />
        ) : (
          <LoginRegister onLoginSuccess={handleLoginSuccess} />
        )}
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        {/* You can keep or remove the original Vite/React documentation links here */}
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
