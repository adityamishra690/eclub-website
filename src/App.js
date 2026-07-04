import './App.css';
import Navbar from './Components/Navbar';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Team from './Components/Team';
import Projects from './Components/Projects';
import Database from './Components/Database';
import Comp from './Components/Comp';
import Footer from './Components/Footer';
import CyberHome from './Components/cyber/CyberHome';
import Challenge from './Components/Challenge';
import Leaderboard from './Components/Leaderboard';
import Articles from './Components/Articles';  
import Gallery from './Components/Gallery';
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";


function RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");

    if (redirectPath) {
      sessionStorage.removeItem("redirected");
      navigate(redirectPath, { replace: true });
    }
  }, [location.search, navigate]);

  return null;
}

function App() {
  return (
    <div className="App">
      <Router>
        <RedirectHandler /> {/* Handles redirects on refresh/direct URL */}
        <Navbar />
        <Routes>
          <Route path="/" element={<CyberHome />} />
          <Route path="/Projects" element={<Projects />} />
          <Route path="/Database" element={<Database />} />
          <Route path="/Articles" element={<Articles />} />
          <Route path="/Team" element={<Team />} />
          <Route path="/Comp" element={<Comp />} />
          <Route path="/Challenge" element={<Challenge />} />
          <Route path="/Leaderboard" element={<Leaderboard />} />
          <Route path="/Gallery" element={<Gallery />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
