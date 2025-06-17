import React, { useEffect, useState, useContext } from 'react';
import { routeAPI, userAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import '../styles/AdminFullStatsPage.css';

const AdminFullStatsPage = () => {
  const { user } = useContext(AuthContext);
  const [routes, setRoutes] = useState([]);
  const [clients, setClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    routeAPI.getAllRoutes().then(setRoutes);
    userAPI.getAllClientsWithTickets().then(setClients);
    userAPI.getAllClients().then(setAllUsers);
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (!user || user.role !== 'admin') {
    return <div className="access-denied">Access denied.</div>;
  }

  const sortedRoutes = getSortedData(routes);
  const sortedUsers = getSortedData(allUsers);
  const sortedClients = getSortedData(clients);

  return (
    <div className="admin-full-stats-container">
      <h2>Thống kê quản trị viên</h2>
      <div className="admin-full-stats-flex">
        <div className="table-section">
          <h3>Danh sách tuyến xe buýt</h3>
          <div className="admin-full-stats-table-wrapper">
            <table className="admin-full-stats-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')} className="sortable">
                    ID {getSortIcon('id')}
                  </th>
                  <th onClick={() => requestSort('number')} className="sortable">
                    Số tuyến {getSortIcon('number')}
                  </th>
                  <th onClick={() => requestSort('name')} className="sortable">
                    Tên tuyến {getSortIcon('name')}
                  </th>
                  <th onClick={() => requestSort('direction')} className="sortable">
                    Chiều {getSortIcon('direction')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRoutes.map(route => (
                  <tr key={route.id}>
                    <td>{route.id}</td>
                    <td>{route.number}</td>
                    <td>{route.name}</td>
                    <td>{route.direction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="table-section">
          <h3>Danh sách tài khoản người dùng</h3>
          <div className="admin-full-stats-table-wrapper">
            <table className="admin-full-stats-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')} className="sortable">
                    ID {getSortIcon('id')}
                  </th>
                  <th onClick={() => requestSort('name')} className="sortable">
                    Tên {getSortIcon('name')}
                  </th>
                  <th onClick={() => requestSort('mail')} className="sortable">
                    Email {getSortIcon('mail')}
                  </th>
                  <th onClick={() => requestSort('username')} className="sortable">
                    Tài khoản {getSortIcon('username')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.mail}</td>
                    <td>{user.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* <div className="table-section">
        <h3>Danh sách tài khoản khách hàng & vé tháng</h3>
        <div className="admin-full-stats-table-wrapper full-width">
          <table className="admin-full-stats-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('id')} className="sortable">
                  ID {getSortIcon('id')}
                </th>
                <th onClick={() => requestSort('name')} className="sortable">
                  Tên {getSortIcon('name')}
                </th>
                <th>Ngày bắt đầu vé tháng</th>
                <th>Hạn vé tháng</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map(client =>
                client.tickets.length > 0 ? (
                  client.tickets.map((ticket, idx) => (
                    <tr key={client.id + '-' + ticket.ticketId}>
                      {idx === 0 && <td rowSpan={client.tickets.length}>{client.id}</td>}
                      {idx === 0 && <td rowSpan={client.tickets.length}>{client.name}</td>}
                      <td>{ticket.startDate ? new Date(ticket.startDate).toLocaleDateString() : ''}</td>
                      <td>{ticket.endDate ? new Date(ticket.endDate).toLocaleDateString() : ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr key={client.id}>
                    <td>{client.id}</td>
                    <td>{client.name}</td>
                    <td colSpan={2} className="no-ticket">Chưa có vé tháng</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div> */}
      <button 
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Cuộn lên đầu trang"
      >
        ↑
      </button>
    </div>
  );
};

export default AdminFullStatsPage;