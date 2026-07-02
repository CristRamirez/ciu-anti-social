import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { UsersPanel } from "./components/UsersPanel";
import { SettingsFab } from "./components/SettingsFab";
import { AuthGate } from "./components/AuthGate";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { PostDetail } from "./pages/PostDetail";
import { Profile } from "./pages/Profile";
import { NewPost } from "./pages/NewPost";
import { Users } from "./pages/Users";
import "./styles.css";

function Layout() {
  const { user } = useAuth();
  const mainClass = user ? "app-main" : "app-main app-main-public";
  const footerClass = user ? "app-footer" : "app-footer app-footer-public";

  return (
    <>
      <Navbar />
      <Sidebar />
      <MobileNav />
      <UsersPanel />
      <main className={mainClass}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/users" element={<Users />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/u/:id" element={<Profile />} />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <NewPost />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className={footerClass}>
        UnaHur Anti-Social Net · TP Construcción de Interfaces
      </footer>
      <SettingsFab />
      <AuthGate />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Layout />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
