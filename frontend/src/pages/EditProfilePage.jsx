import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/ProfilePage.css';

const EditProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    authAPI.getProfile().then((data) => {
      setProfile(data);
      setName(data.name || '');
      setMail(data.mail || '');
      setUsername(data.username || '');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await authAPI.updateProfile({ name, mail, username, password });
      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể cập nhật thông tin.');
    }
  };

  if (!profile) return <div>Đang tải...</div>;

  return (
    <div className="profile-page">
      <div className="user-info">
        <h2>Chỉnh sửa thông tin</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Tên:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={mail}
              onChange={e => setMail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Mật khẩu mới (ít nhất 8 ký tự, để trống nếu không đổi):</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Để trống nếu không đổi"
              minLength={8}
            />
          </div>
          <button type="submit" style={{ marginTop: 16 }}>Lưu thay đổi</button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      </div>
    </div>
  );
};

export default EditProfilePage;