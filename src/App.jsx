import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);  // <--- novo stanje
  const navigate = useNavigate();

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Greška pri učitavanju korisnika:", error.message);
      }
      setUser(user);
      setLoadingUser(false); // korisnik učitan (ili null)
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (loadingUser) return; // dok se ne učita user, ne navigiraj

    if (user) {
      if (user.email === "admin@npr.hr") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } else {
      navigate("/");
    }
  }, [user, loadingUser, navigate]);

  if (loadingUser) {
    return <p>Učitavanje korisnika...</p>;  // ili spinner/loading ekran
  }

  return (
    <Routes>
      <Route path="/" element={<AuthForm onLogin={handleLogin} />} />
      <Route path="/admin" element={<AdminDashboard user={user} />} />
      <Route path="/student" element={<StudentDashboard user={user} />} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
