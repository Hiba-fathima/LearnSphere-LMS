import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

import "../css/InstructorQuizzes.css";
import "../css/StudentDashboard.css";
import "../css/InstructorDashboard.css";

function InstructorQuizzes() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [dueDate, setDueDate] = useState("");

  const [questions, setQuestions] = useState([
    {
      questionText: "",
      questionType: "mcq",
      options: ["", "", "", ""],
      correctAnswer: "0",
      marks: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch instructor courses and quizzes
  const fetchData = async () => {
    try {
      setPageLoading(true);

      const [courseResponse, quizResponse] = await Promise.all([
        API.get("/instructor/courses"),
        API.get("/quizzes/instructor"),
      ]);

      const courseList = Array.isArray(courseResponse.data)
        ? courseResponse.data
        : courseResponse.data.courses || [];

      const quizList = Array.isArray(quizResponse.data)
        ? quizResponse.data
        : quizResponse.data.quizzes || [];

      setCourses(courseList);
      setQuizzes(quizList);
    } catch (error) {
      console.error("Fetch quiz data error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to load courses or quizzes."
      );
    } finally {
      setPageLoading(false);
    }
  };

  // Selected course
  const selectedCourseData = courses.find(
    (course) => course._id === selectedCourse
  );

  const sections = selectedCourseData?.sections || [];

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedSection("");
  };

  // Add question
  const addQuestion = () => {
    setQuestions((previous) => [
      ...previous,
      {
        questionText: "",
        questionType: "mcq",
        options: ["", "", "", ""],
        correctAnswer: "0",
        marks: 1,
      },
    ]);
  };

  // Remove question
  const removeQuestion = (index) => {
    if (questions.length === 1) {
      alert("At least one question is required.");
      return;
    }

    setQuestions((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // Update question
  const updateQuestion = (index, field, value) => {
    setQuestions((previous) =>
      previous.map((question, i) =>
        i === index
          ? { ...question, [field]: value }
          : question
      )
    );
  };

  // Change question type
  const changeQuestionType = (index, type) => {
    setQuestions((previous) =>
      previous.map((question, i) =>
        i === index
          ? {
              ...question,
              questionType: type,
              options: type === "mcq" ? ["", "", "", ""] : [],
              correctAnswer:
                type === "mcq"
                  ? "0"
                  : type === "true_false"
                  ? "true"
                  : "",
            }
          : question
      )
    );
  };

  // Update option
  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) =>
      previous.map((question, i) =>
        i === questionIndex
          ? {
              ...question,
              options: question.options.map((option, j) =>
                j === optionIndex ? value : option
              ),
            }
          : question
      )
    );
  };

  // Add option
  const addOption = (questionIndex) => {
    setQuestions((previous) =>
      previous.map((question, i) => {
        if (i !== questionIndex) return question;

        if (question.options.length >= 6) {
          alert("Maximum 6 options allowed.");
          return question;
        }

        return {
          ...question,
          options: [...question.options, ""],
        };
      })
    );
  };

  // Remove option
  const removeOption = (questionIndex, optionIndex) => {
    setQuestions((previous) =>
      previous.map((question, i) => {
        if (i !== questionIndex) return question;

        if (question.options.length <= 2) {
          alert("At least two options are required.");
          return question;
        }

        const updatedOptions = question.options.filter(
          (_, j) => j !== optionIndex
        );

        return {
          ...question,
          options: updatedOptions,
          correctAnswer: "0",
        };
      })
    );
  };

  // Create quiz
  const handleSubmit = async (status) => {
    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter a quiz title.");
      return;
    }

    if (!selectedCourse || !selectedSection) {
      setMessage("Please select a course and section.");
      return;
    }

    if (Number(duration) < 1) {
      setMessage("Duration must be at least 1 minute.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.questionText.trim()) {
        setMessage(`Please enter Question ${i + 1}.`);
        return;
      }

      if (Number(question.marks) < 1) {
        setMessage(`Question ${i + 1} must have at least 1 mark.`);
        return;
      }

      if (question.questionType === "mcq") {
        if (
          question.options.length < 2 ||
          question.options.some((option) => !option.trim())
        ) {
          setMessage(
            `Please complete all options in Question ${i + 1}.`
          );
          return;
        }

        if (
          Number(question.correctAnswer) < 0 ||
          Number(question.correctAnswer) >= question.options.length
        ) {
          setMessage(
            `Select the correct answer for Question ${i + 1}.`
          );
          return;
        }
      }

      if (
        question.questionType === "true_false" &&
        !["true", "false"].includes(question.correctAnswer)
      ) {
        setMessage(
          `Select the correct answer for Question ${i + 1}.`
        );
        return;
      }
    }

    const formattedQuestions = questions.map((question) => ({
      ...question,
      marks: Number(question.marks),
      options:
        question.questionType === "mcq"
          ? question.options
          : [],
      correctAnswer:
        question.questionType === "mcq"
          ? Number(question.correctAnswer)
          : question.correctAnswer,
    }));

    try {
      setLoading(true);

      const response = await API.post(
        `/quizzes/instructor/${selectedCourse}/${selectedSection}`,
        {
          title,
          description,
          questions: formattedQuestions,
          duration: Number(duration),
          dueDate: dueDate || null,
          status,
        }
      );

      setMessage(
        response.data.message || "Quiz created successfully."
      );

      setTitle("");
      setDescription("");
      setSelectedCourse("");
      setSelectedSection("");
      setDuration(30);
      setDueDate("");

      setQuestions([
        {
          questionText: "",
          questionType: "mcq",
          options: ["", "", "", ""],
          correctAnswer: "0",
          marks: 1,
        },
      ]);

      await fetchData();
    } catch (error) {
      console.error("Create quiz error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to create quiz."
      );
    } finally {
      setLoading(false);
    }
  };

  // Navigate to student attempts
  const viewAttempts = (quizId) => {
    navigate(`/instructor/quizzes/${quizId}/attempts`);
  };

  return (
    <div className="instructor-quiz-page">

      <div className="quiz-page-header">
        <div>
          <h2>Quiz Management</h2>
          <p>Create quizzes and evaluate student performance.</p>
        </div>
      </div>

      {message && (
        <div className="quiz-message">
          {message}
        </div>
      )}

      {/* Create Quiz */}

      <div className="quiz-create-card">

        <h3>Create New Quiz</h3>

        <div className="quiz-form-grid">

          <div className="quiz-field">
            <label>Quiz Title</label>

            <input
              type="text"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="quiz-field">
            <label>Duration (minutes)</label>

            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="quiz-field">
            <label>Select Course</label>

            <select
              value={selectedCourse}
              onChange={handleCourseChange}
            >
              <option value="">Select Course</option>

              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="quiz-field">
            <label>Select Section</label>

            <select
              value={selectedSection}
              onChange={(e) =>
                setSelectedSection(e.target.value)
              }
              disabled={!selectedCourse}
            >
              <option value="">Select Section</option>

              {sections.map((section) => (
                <option key={section._id} value={section._id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          <div className="quiz-field">
            <label>Due Date (Optional)</label>

            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

        </div>

        <div className="quiz-field">
          <label>Description</label>

          <textarea
            placeholder="Enter quiz description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          />
        </div>

        {/* Questions */}

        <div className="quiz-questions-heading">
          <h3>Questions</h3>
          <span>{questions.length} Questions</span>
        </div>

        {questions.map((question, index) => (

          <div className="quiz-question-card" key={index}>

            <div className="quiz-question-top">
              <h4>Question {index + 1}</h4>

              <button
                type="button"
                className="quiz-remove-btn"
                onClick={() => removeQuestion(index)}
              >
                Remove
              </button>
            </div>

            <div className="quiz-field">
              <label>Question</label>

              <textarea
                placeholder="Enter your question"
                value={question.questionText}
                onChange={(e) =>
                  updateQuestion(
                    index,
                    "questionText",
                    e.target.value
                  )
                }
                rows="2"
              />
            </div>

            <div className="quiz-form-grid">

              <div className="quiz-field">
                <label>Question Type</label>

                <select
                  value={question.questionType}
                  onChange={(e) =>
                    changeQuestionType(index, e.target.value)
                  }
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="written">Written Answer</option>
                </select>
              </div>

              <div className="quiz-field">
                <label>Marks</label>

                <input
                  type="number"
                  min="1"
                  value={question.marks}
                  onChange={(e) =>
                    updateQuestion(index, "marks", e.target.value)
                  }
                />
              </div>

            </div>

            {/* MCQ */}

            {question.questionType === "mcq" && (

              <div className="quiz-options-area">

                <label>Options</label>

                {question.options.map((option, optionIndex) => (

                  <div className="quiz-option-row" key={optionIndex}>

                    <input
                      type="text"
                      placeholder={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) =>
                        updateOption(
                          index,
                          optionIndex,
                          e.target.value
                        )
                      }
                    />

                    <label className="quiz-correct-option">

                      <input
                        type="radio"
                        name={`correct-${index}`}
                        checked={
                          String(question.correctAnswer) ===
                          String(optionIndex)
                        }
                        onChange={() =>
                          updateQuestion(
                            index,
                            "correctAnswer",
                            String(optionIndex)
                          )
                        }
                      />

                      Correct

                    </label>

                    <button
                      type="button"
                      className="quiz-option-remove"
                      onClick={() =>
                        removeOption(index, optionIndex)
                      }
                    >
                      ×
                    </button>

                  </div>

                ))}

                <button
                  type="button"
                  className="quiz-add-option"
                  onClick={() => addOption(index)}
                >
                  + Add Option
                </button>

              </div>

            )}

            {/* TRUE / FALSE */}

            {question.questionType === "true_false" && (

              <div className="quiz-field">
                <label>Correct Answer</label>

                <select
                  value={question.correctAnswer}
                  onChange={(e) =>
                    updateQuestion(
                      index,
                      "correctAnswer",
                      e.target.value
                    )
                  }
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>

            )}

            {/* WRITTEN */}

            {question.questionType === "written" && (

              <p className="quiz-written-note">
                Students will type their answers. You will grade
                them manually.
              </p>

            )}

          </div>

        ))}

        <button
          type="button"
          className="quiz-add-question"
          onClick={addQuestion}
        >
          + Add Question
        </button>

        <div className="quiz-submit-actions">

          <button
            type="button"
            className="quiz-draft-btn"
            disabled={loading}
            onClick={() => handleSubmit("Draft")}
          >
            Save Draft
          </button>

          <button
            type="button"
            className="quiz-publish-btn"
            disabled={loading}
            onClick={() => handleSubmit("Published")}
          >
            {loading ? "Saving..." : "Publish Quiz"}
          </button>

        </div>

      </div>

      {/* Existing Quizzes */}

      <div className="quiz-list-card">

        <h3>My Quizzes</h3>

        {pageLoading ? (

          <p>Loading quizzes...</p>

        ) : quizzes.length === 0 ? (

          <p>No quizzes created yet.</p>

        ) : (

          <div className="quiz-table-wrapper">

            <table className="quiz-table">

              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Course</th>
                  <th>Questions</th>
                  <th>Total Marks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {quizzes.map((quiz) => (

                  <tr key={quiz._id}>

                    <td>{quiz.title}</td>

                    <td>{quiz.courseId?.title || "Course"}</td>

                    <td>{quiz.questions?.length || 0}</td>

                    <td>{quiz.totalMarks}</td>

                    <td>
                      <span
                        className={`quiz-status ${quiz.status?.toLowerCase()}`}
                      >
                        {quiz.status}
                      </span>
                    </td>

                    <td>

                      <button
                        type="button"
                        className="quiz-view-attempts-btn"
                        disabled={quiz.status !== "Published"}
                        onClick={() => viewAttempts(quiz._id)}
                      >
                        View Attempts →
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default InstructorQuizzes;