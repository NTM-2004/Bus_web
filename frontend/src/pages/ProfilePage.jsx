import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { authAPI, userAPI } from '../services/api';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    authAPI.getProfile().then(setProfile);
  }, []);

  return (
    <div className="profile-page">
      {profile && (
        <div className="user-info">
          <h2>Thông tin người dùng</h2>
          <p><strong>Tên:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.mail}</p>
          <p><strong>Tên đăng nhập:</strong> {profile.username}</p>
          <p><strong>Vai trò:</strong> {profile.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</p>
          <Link to="/edit-profile" className="edit-profile-link">Chỉnh sửa thông tin</Link>
          {profile.role === 'client' && (
            <div style={{ marginTop: 16 }}>
              <Link to="/monthly-tickets" className="edit-profile-link">
                Quản lý vé tháng
              </Link>
            </div>
          )}
          {profile.role === 'admin' && (
          <div style={{ marginTop: 16 }}>
            <Link to="/admin/full-stats" className="edit-profile-link">
              Trang thống kê quản trị viên
            </Link>
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
