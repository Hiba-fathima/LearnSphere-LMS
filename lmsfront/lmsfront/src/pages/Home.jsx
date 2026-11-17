import React from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";

function Home() {
return ( <div className="home-page">

  {/* Navbar */}
  <nav className="home-navbar">
    <Link to="/" className="home-logo">
      Learn<span>Sphere</span>
    </Link>

    <div className="home-nav-links">
      <Link to="/login" className="login-btn">
        Login
      </Link>

      <Link to="/signup" className="signup-btn">
        Sign Up
      </Link>
    </div>
  </nav>

  {/* Main Hero Section */}
  <section className="home-hero">

    <div className="hero-content">
      <span className="hero-tag">
        YOUR LEARNING JOURNEY STARTS HERE
      </span>

      <h1>
        Learn Today.
        <br />
        <span>Lead Tomorrow.</span>
      </h1>

      <p>
        Discover new skills, explore exciting courses, and learn at
        your own pace. Your next opportunity starts with the right
        knowledge.
      </p>

      <div className="hero-buttons">
        <Link to="/signup" className="hero-primary-btn">
          Get Started <span>→</span>
        </Link>

        <Link to="/login" className="hero-secondary-btn">
          Login to Continue
        </Link>
      </div>

      <div className="hero-note">
        <span className="note-dot"></span>
        Learn at your own pace, anytime and anywhere.
      </div>
    </div>

    {/* Decorative Visual */}
    <div className="hero-visual">
      <div className="visual-circle circle-one"></div>
      <div className="visual-circle circle-two"></div>

      <div className="learning-card">
        <div className="learning-icon">✦</div>

        <span className="card-label">YOUR FUTURE STARTS NOW</span>

        <h2>Knowledge is your superpower.</h2>

        <p>
          Every new skill takes you one step closer to your goals.
        </p>

        <div className="learning-progress">
          <span></span>
        </div>

        <div className="progress-text">
          <span>Keep learning</span>
          <span>Keep growing</span>
        </div>
      </div>

      <div className="floating-badge badge-top">
        <span>✧</span> Explore your potential
      </div>

      <div className="floating-badge badge-bottom">
        <span>✓</span> Your journey, your pace
      </div>
    </div>

  </section>

  {/* Bottom Highlight */}
  <section className="home-highlight">
    <div className="highlight-item">
      <span className="highlight-icon">◎</span>
      <div>
        <h3>Learn Your Way</h3>
        <p>Study at your own pace</p>
      </div>
    </div>

    <div className="highlight-divider"></div>

    <div className="highlight-item">
      <span className="highlight-icon">◇</span>
      <div>
        <h3>Explore New Skills</h3>
        <p>Discover learning opportunities</p>
      </div>
    </div>

    <div className="highlight-divider"></div>

    <div className="highlight-item">
      <span className="highlight-icon">↗</span>
      <div>
        <h3>Grow Your Future</h3>
        <p>Take the next step forward</p>
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="home-footer">
    <p>
      © 2026 LearnSphere. <span>Learn something new every day.</span>
    </p>
  </footer>

</div>

);
}

export default Home;
