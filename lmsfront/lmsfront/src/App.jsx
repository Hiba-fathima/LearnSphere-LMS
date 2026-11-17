import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";

// Student pages
import StudentLayout from "./pages/StudentLayout";
import StudentDashboard from "./pages/StudentDashboard";
import CourseDetails from "./pages/CourseDetails";
import StudentProfile from "./pages/StudentProfile";
import MyLearning from "./pages/MyLearning";
import MyLearningDetails from "./pages/MyLearningDetailes";
import Favorites from "./pages/Favorites";
import StudentAssignments from "./pages/StudentAssignments";
import StudentQuizzes from "./pages/StudentQuizzes";
import StudentQuizAttempt from "./pages/StudentQuizAttempt";

// Instructor pages
import InstructorLayout from "./pages/InstructorLayout";
import InstructorDashboard from "./pages/InstructorDashboard";
import MyCourses from "./pages/MyCourses";
import InstructorStudents from "./pages/InstructorStudents";
import InstructorProfile from "./pages/InstructorProfile";
import InstructorAssignments from "./pages/InstructorAssignments";
import InstructorSubmissions from "./pages/InstructorSubmissions";
import InstructorQuizzes from "./pages/InstructorQuizzes";
import InstructorQuizAttempts from "./pages/InstructorQuizzAttempts";
import StudentReminders from "./pages/StudentReminders";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Student Layout */}
        <Route path="/student" element={<StudentLayout />}>

          <Route path="dashboard" element={<StudentDashboard />} />

          <Route path="course/:id" element={<CourseDetails />} />

          <Route path="my-learning" element={<MyLearning />} />

          <Route
            path="my-learning/:courseId"
            element={<MyLearningDetails />}
          />

          <Route path="favorites" element={<Favorites />} />

          <Route path="profile" element={<StudentProfile />} />

          <Route path="assignments" element={<StudentAssignments />} />

          <Route path="quizzes" element={<StudentQuizzes />} />

          <Route
            path="quizzes/:quizId"
            element={<StudentQuizAttempt />}
          />
                    <Route path="reminders" element={<StudentReminders />} />


        </Route>

        {/* Instructor Layout - Shared Sidebar */}
        <Route path="/instructor" element={<InstructorLayout />}>

          <Route
            path="dashboard"
            element={<InstructorDashboard />}
          />

          <Route
            path="courses"
            element={<MyCourses />}
          />

          <Route
            path="students"
            element={<InstructorStudents />}
          />

          <Route
            path="profile"
            element={<InstructorProfile />}
          />

          <Route
            path="assignments"
            element={<InstructorAssignments />}
          />

          <Route
            path="assignments/:assignmentId/submissions"
            element={<InstructorSubmissions />}
          />

          <Route
            path="quizzes"
            element={<InstructorQuizzes />}
          />

          <Route
            path="quizzes/:quizId/attempts"
            element={<InstructorQuizAttempts />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;