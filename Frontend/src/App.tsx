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
import { CommunityDetail } from './pages/CommunityDetail';
import { MyProfile } from './pages/MyProfile';
import { MyProfileEdit } from './pages/MyProfileEdit';
import { UserProfile } from './pages/UserProfile';
import { Search } from './pages/Search';
import { PostDetail } from './pages/PostDetail';
import { Notifications } from './pages/Notifications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/community/:id" element={<CommunityDetail />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/my-profile/edit" element={<MyProfileEdit />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
