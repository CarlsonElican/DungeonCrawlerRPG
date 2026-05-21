import { useState } from 'react'
import './App.css'
import LoginRegister from './LoginRegister';
import Game from './Game';

interface User {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <>
      <section id="center">
        {currentUser ? (
          <Game currentUser={currentUser} onLogout={handleLogout} />
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
