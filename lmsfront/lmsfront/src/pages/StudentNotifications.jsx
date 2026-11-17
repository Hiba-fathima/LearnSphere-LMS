import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../css/StudentNotifications.css";

function timeAgo(date) {
  const now = new Date();
  const notificationDate = new Date(date);

  if (isNaN(notificationDate.getTime())) return "";

  const seconds = Math.floor((now - notificationDate) / 1000);

  if (seconds < 0) return "Just now";
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hrs ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return notificationDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StudentNotifications() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await API.get("/notifications");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Notification fetch error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Mark one notification as read
  const markAsRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await API.patch(`/notifications/${notification._id}/read`);

        setNotifications((previous) =>
          previous.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true }
              : item
          )
        );

        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      if (notification.link) {
        setIsOpen(false);
        navigate(notification.link);
      }
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);

      await API.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Unable to mark all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  // Notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "assignment":
        return "📝";
      case "quiz":
        return "📋";
      case "grade":
        return "🏆";
      case "course":
        return "📚";
      default:
        return "🔔";
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        type="button"
        className="notification-bell"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={`Notifications. ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <span className="notification-bell-icon">🔔</span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <h3>Notifications</h3>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "You're all caught up"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={markAllAsRead}
                disabled={loading}
              >
                {loading ? "Please wait..." : "Mark all as read"}
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span>🔔</span>
                <h4>No notifications</h4>
                <p>Important updates will appear here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${
                    notification.isRead ? "read" : "unread"
                  }`}
                  onClick={() => markAsRead(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      markAsRead(notification);
                    }
                  }}
                >
                  <div className="notification-item-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-title-row">
                      <h4>{notification.title}</h4>

                      {!notification.isRead && (
                        <span className="notification-new-dot"></span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <div className="notification-time">
                      <span>
                        {new Date(
                          notification.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      <span>•</span>

                      <span>
                        {new Date(
                          notification.createdAt
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <span>•</span>

                      <span className="notification-relative-time">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              Showing your latest notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentNotifications;