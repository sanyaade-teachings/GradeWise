import React, { useState, useEffect } from 'react';
import { TourProvider, useTour } from '@reactour/tour';

const steps = [
  {
    selector: '.create-assignment-button',
    content: (
      <div>
        <strong>Welcome to GradeWise!</strong>
        <br />
        <br />
        GradeWise uses AI to read, grade, and provide feedback for written assignments.
        <br />
        <br />
        Click "Create Assignment" to get started.
      </div>
    ),
  },
  {
    selector: '.new-submission-button',
    content: (
      <div>
        Click here to <strong>add a submission</strong> to your assignment.
        <br />
        <br />
        It must be a .txt file, no other formats are accepted.
      </div>
    ),
  },
  {
    selector: '.grade-button',
    content: (
      <div>
        Click here to <strong>grade your submission</strong>. 
        <br />
        <br />
        Be patient, this may take a few seconds.
      </div>
    ),
  },
  {
    selector: '.congrats-message',
    content: (
      <div>
        <strong>Congratulations!</strong>
        <br />
        <br />
        You have completed your first assignment evaluation.
      </div>
    ),
  },
];

const Tutorial = ({ pauseTour, currentStep }) => {
  const { setIsOpen, setCurrentStep } = useTour();

  useEffect(() => {
    const hasCompletedTutorial = localStorage.getItem('hasCompletedTutorial');
    if (!hasCompletedTutorial) {
      setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(currentStep || 0);
      }, 500);
    }
  }, [setIsOpen, setCurrentStep, currentStep]);

  useEffect(() => {
    if (pauseTour) {
      setIsOpen(false);
    } else {
      setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(currentStep);
      }, 500);
    }
  }, [pauseTour, setIsOpen, setCurrentStep, currentStep]);

  return null;
};

const TutorialWrapper = ({ children, pauseTour, currentStep }) => {
  const initialStep = localStorage.getItem('hasCompletedTutorial') ? null : 0;

  return (
    <TourProvider
      steps={steps}
      initialStep={initialStep}
      afterClose={() => {
        console.log('Tutorial closed, should be set to complete');
        localStorage.setItem('hasCompletedTutorial', 'true');
      }}
      showNavigation={false} // Hide navigation buttons
      showDots={false} // Hide dots navigation
      showPrevNextButtons={false} // Hide prev & next buttons
    >
      {children}
      <Tutorial pauseTour={pauseTour} currentStep={currentStep || initialStep} />
    </TourProvider>
  );
};

export default TutorialWrapper;
