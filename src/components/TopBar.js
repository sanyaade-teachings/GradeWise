import React from 'react';

function TopBar({ showNav }) {
  return (
    <header className="top-bar">
      <span className="grade-wise-title">GradeWise</span>
      {showNav && (
        <nav>
          {/* Navigation Links Here */}
        </nav>
      )}
    </header>
  );
}

export default TopBar;
