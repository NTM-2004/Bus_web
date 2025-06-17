import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/map">BusPer</Link>
      </div>
      <div className="auth-buttons">
        {user ? (
          <>
            <Link to="/profile" className="profile-btn">Tài khoản</Link>
            <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-btn">Đăng nhập</Link>
            <Link to="/register" className="register-btn">Đăng ký</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

