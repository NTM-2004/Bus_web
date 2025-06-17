import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/AuthPage.css';

const AuthPage = ({ type }) => {
  const { login, register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'login') {
        await login(username, password);
        window.location.href = '/map'; 
      } else if (type === 'register') {
        await register({ name, mail, username, password });
        window.location.href = '/map';
      }
    } catch (err) {
      if (type === 'login') {
        setError('Sai tên đăng nhập hoặc mật khẩu');
      } else {
        setError(err?.message || 'Không thể đăng ký');
      }
    }
  };

  return (
    <div className="auth-page">
      <h2>{type === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
      <form onSubmit={handleSubmit}>
        {type === 'register' && (
          <>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
            />
          </>
        )}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">
          {type === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      <p>
        {type === 'login' ? (
          <Link to="/register">Chưa có tài khoản? Đăng ký</Link>
        ) : (
          <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
        )}
      </p>
    </div>
  );
};

export default AuthPage;
