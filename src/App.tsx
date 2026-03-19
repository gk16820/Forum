import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Trending } from './pages/Trending';
import { Tags } from './pages/Tags';
import { Bookmarks } from './pages/Bookmarks';
import { Communities } from './pages/Communities';
import { MyProfile } from './pages/MyProfile';
import { UserProfile } from './pages/UserProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/user/:id" element={<UserProfile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
