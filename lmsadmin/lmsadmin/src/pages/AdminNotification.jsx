import { useEffect, useState } from "react";
import API from "../api";
import "../css/AdminNotifications.css";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await API.get("/notifications");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.patch("/notifications/read-all");
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="admin-notification-container">
      <button
        className="admin-notification-bell"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        🔔

        {unreadCount > 0 && (
          <span className="admin-notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="admin-notification-dropdown">
          <div className="admin-notification-header">
            <h3>Notifications</h3>

            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="admin-no-notifications">
              No notifications yet
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`admin-notification-item ${
                  !notification.isRead ? "unread" : ""
                }`}
                onClick={() => markAsRead(notification._id)}
              >
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>

                <small>
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;