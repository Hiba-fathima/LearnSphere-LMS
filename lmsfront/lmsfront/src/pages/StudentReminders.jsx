import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../css/StudentReminders.css";

function StudentReminders() {
  const navigate = useNavigate();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch assignment and quiz reminders
  const fetchReminders = async () => {
    try {
      const response = await API.get("/notifications");

      const allNotifications =
        response.data.notifications || [];

      const newReminders = allNotifications.filter(
        (item) =>
          !item.isRead &&
          ["assignment", "quiz"].includes(item.type)
      );

      setReminders(newReminders);
    } catch (error) {
      console.error("Reminder fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();

    const interval = setInterval(fetchReminders, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle reminder click
  const handleReminderClick = async (reminder) => {
    try {
      await API.patch(
        `/notifications/${reminder._id}/read`
      );

      setReminders((previous) =>
        previous.filter(
          (item) => item._id !== reminder._id
        )
      );

      if (reminder.link) {
        navigate(reminder.link);
      }
    } catch (error) {
      console.error("Unable to open reminder:", error);
    }
  };

  return (
    <section className="student-reminders">

      <div className="reminder-heading">
        <div>
          <span className="reminder-subtitle">
            STAY ON TRACK
          </span>

          <h2>Activity Reminders</h2>

          <p>
            Keep track of your new assignments and quizzes.
          </p>
        </div>

        <div className="reminder-calendar-icon">
          📅
        </div>
      </div>

      {loading ? (
        <div className="reminder-empty">
          Loading reminders...
        </div>
      ) : reminders.length === 0 ? (
        <div className="reminder-empty">
          <span className="reminder-empty-icon">✓</span>
          <h3>You're all caught up!</h3>
          <p>
            New assignments and quizzes will appear here.
          </p>
        </div>
      ) : (
        <div className="reminder-list">

          {reminders.map((reminder) => (
            <div
              className="reminder-item"
              key={reminder._id}
              onClick={() =>
                handleReminderClick(reminder)
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  handleReminderClick(reminder);
                }
              }}
            >

              <div
                className={`reminder-type-icon ${
                  reminder.type === "assignment"
                    ? "assignment-reminder-icon"
                    : "quiz-reminder-icon"
                }`}
              >
                {reminder.type === "assignment"
                  ? "📌"
                  : "📖"}
              </div>

              <div className="reminder-content">
                <div className="reminder-title-row">
                  <h4>{reminder.title}</h4>
                  <span className="reminder-new-badge">
                    NEW
                  </span>
                </div>

                <p>{reminder.message}</p>

                <span className="reminder-action">
                  View details →
                </span>
              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  );
}

export default StudentReminders;