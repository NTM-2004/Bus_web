import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import '../styles/MonthlyTicketsPage.css';

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getStatus(start, end) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (now < startDate) return 'Chưa đến ngày sử dụng';
  if (now > endDate) return 'Đã hết hạn';
  return 'Đang sử dụng';
}

const MonthlyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBuyForm, setShowBuyForm] = useState(false);

  useEffect(() => {
    userAPI.getUserTickets().then(tks => {
      setTickets(tks);
      setShowBuyForm(!tks || tks.length === 0);
    }).finally(() => setLoading(false));
  }, []);

  const handleBuyTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBuying(true);
    try {
      const endDate = addDays(startDate, 30);
      await userAPI.addMonthlyTicket({
        startDate,
        endDate,
        price: 200000
      });
      setSuccess('Mua vé thành công!');
      // Refresh tickets
      const updated = await userAPI.getUserTickets();
      setTickets(updated);
      setShowBuyForm(false);
      setStartDate('');
    } catch (err) {
      setError('Không thể mua vé. Vui lòng thử lại.');
    } finally {
      setBuying(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    setError('');
    setSuccess('');
    try {
      await userAPI.deleteMonthlyTicket(ticketId);
      setTickets([]);
      setShowBuyForm(true);
    } catch (err) {
      setError('Không thể xóa vé. Vui lòng thử lại.');
    }
  };

  const ticket = tickets && tickets.length > 0 ? tickets[0] : null;
  let status = '';
  let isExpired = false;
  if (ticket) {
    status = getStatus(ticket.start_date, ticket.end_date);
    isExpired = status === 'Đã hết hạn';
  }

  return (
    <div className="monthly-tickets-page" style={{ minHeight: '80vh', overflowY: 'auto' }}>
      <h2>Vé tháng của tôi</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : showBuyForm ? (
        <form onSubmit={handleBuyTicket} className="ticket-buy-form">
          <div>
            <label htmlFor="start-date">Ngày bắt đầu</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
          {startDate && (
            <div className="ticket-buy-summary">
              <div>Ngày bắt đầu: <b>{startDate}</b></div>
              <div>Ngày kết thúc: <b>{addDays(startDate, 30)}</b></div>
              <div>Giá vé: <b>200,000 VNĐ</b></div>
            </div>
          )}
          <button
            type="submit"
            className="ticket-buy-btn"
            disabled={buying || !startDate}
          >
            {buying ? 'Đang mua...' : 'Mua vé tháng'}
          </button>
          {error && <div className="ticket-buy-message error">{error}</div>}
          {success && <div className="ticket-buy-message success">{success}</div>}
        </form>
      ) : ticket ? (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <div className="ticket-header">
            Vé tháng
          </div>
          <div className="ticket-date">
            Ngày bắt đầu: {ticket.start_date}
          </div>
          <div className="ticket-date">
            Ngày kết thúc: {ticket.end_date}
          </div>
          <div className="ticket-price">
            Giá vé: {ticket.price} VNĐ
          </div>
          <div className={`ticket-status ${isExpired ? 'ticket-status-expired' : 'ticket-status-active'}`}>
            Trạng thái: {status}
          </div>
          {ticket.qr_code && (
            <div>
              <img src={ticket.qr_code} alt="QR vé tháng" className="ticket-qr" />
            </div>
          )}
          {isExpired && (
            <div className="ticket-expired-message">
              <div className="ticket-expired-title">
                Vé tháng đã qua hạn sử dụng.
              </div>
              <div className="ticket-expired-action">
                Bạn có muốn mua vé mới không?
                <button
                  className="ticket-expired-btn"
                  onClick={() => handleDeleteTicket(ticket.id)}
                >
                  Có
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default MonthlyTicketsPage;