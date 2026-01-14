import React, { useState, useEffect } from 'react';
import './MathWizard.css';
import SafetyBadge from '../../components/SafetyBadge';

const MathWizard = () => {
  const [selectedGrade, setSelectedGrade] = useState('3-4');
  const [selectedTopic, setSelectedTopic] = useState('addition');
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState('');
  const [streak, setStreak] = useState(0);

  const gradeOptions = [
    { id: '1-2', name: 'Grades 1-2 (Ages 6-8)', level: 'beginner' },
    { id: '3-4', name: 'Grades 3-4 (Ages 8-10)', level: 'intermediate' },
    { id: '5-6', name: 'Grades 5-6 (Ages 10-12)', level: 'advanced' },
    { id: '7-8', name: 'Grades 7-8 (Ages 12-14)', level: 'expert' }
  ];

  const topicsByGrade = {
    '1-2': [
      { id: 'addition', name: 'Addition (1-20)', emoji: '➕' },
      { id: 'subtraction', name: 'Subtraction (1-20)', emoji: '➖' },
      { id: 'counting', name: 'Counting', emoji: '🔢' },
      { id: 'shapes', name: 'Shapes', emoji: '🔴' }
    ],
    '3-4': [
      { id: 'addition', name: 'Addition (Multi-digit)', emoji: '➕' },
      { id: 'subtraction', name: 'Subtraction (Multi-digit)', emoji: '➖' },
      { id: 'multiplication', name: 'Multiplication Tables', emoji: '✖️' },
      { id: 'division', name: 'Division', emoji: '➗' },
      { id: 'fractions', name: 'Simple Fractions', emoji: '🍕' }
    ],
    '5-6': [
      { id: 'fractions', name: 'Fractions & Decimals', emoji: '🍕' },
      { id: 'percentages', name: 'Percentages', emoji: '💯' },
      { id: 'geometry', name: 'Geometry', emoji: '📐' },
      { id: 'word-problems', name: 'Word Problems', emoji: '📚' },
      { id: 'algebra-basics', name: 'Pre-Algebra', emoji: '🔢' }
    ],
    '7-8': [
      { id: 'algebra', name: 'Algebra', emoji: '📈' },
      { id: 'geometry', name: 'Advanced Geometry', emoji: '📐' },
      { id: 'statistics', name: 'Statistics', emoji: '📊' },
      { id: 'probability', name: 'Probability', emoji: '🎲' },
      { id: 'equations', name: 'Equations', emoji: '⚖️' }
    ]
  };

  // Generate a new problem based on grade and topic
  const generateProblem = () => {
    setUserAnswer('');
    setShowSolution(false);
    setFeedback('');

    let problem = {};

    if (selectedTopic === 'addition') {
      if (selectedGrade === '1-2') {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * (20 - a)) + 1;
        problem = {
          question: `${a} + ${b} = ?`,
          answer: a + b,
          explanation: `Count ${a} objects, then add ${b} more objects. ${a} + ${b} = ${a + b}`,
          hint: `Try counting on your fingers! Start at ${a} and count up ${b} more.`
        };
      } else {
        const a = Math.floor(Math.random() * 900) + 100;
        const b = Math.floor(Math.random() * 900) + 100;
        problem = {
          question: `${a} + ${b} = ?`,
          answer: a + b,
          explanation: `Line up the numbers by place value and add column by column: ${a} + ${b} = ${a + b}`,
          hint: `Remember to line up the ones, tens, and hundreds places!`
        };
      }
    } else if (selectedTopic === 'multiplication') {
      const table = Math.floor(Math.random() * 9) + 2;
      const multiplier = Math.floor(Math.random() * 10) + 1;
      problem = {
        question: `${table} × ${multiplier} = ?`,
        answer: table * multiplier,
        explanation: `${table} groups of ${multiplier} equals ${table * multiplier}. You can also think of it as adding ${table} together ${multiplier} times!`,
        hint: `Try skip counting! Count by ${table}s, ${multiplier} times.`
      };
    } else if (selectedTopic === 'fractions') {
      if (selectedGrade === '3-4') {
        const numerator = Math.floor(Math.random() * 3) + 1;
        const denominator = Math.floor(Math.random() * 4) + 3;
        problem = {
          question: `What fraction is shaded? (${numerator} out of ${denominator} parts)`,
          answer: `${numerator}/${denominator}`,
          explanation: `When ${numerator} out of ${denominator} equal parts are shaded, we write it as ${numerator}/${denominator}`,
          hint: `The bottom number shows how many equal parts in total, the top shows how many are selected.`
        };
      } else {
        const num1 = Math.floor(Math.random() * 4) + 1;
        const den1 = Math.floor(Math.random() * 6) + 4;
        const num2 = Math.floor(Math.random() * 3) + 1;
        const den2 = den1; // Same denominator for easier addition
        problem = {
          question: `${num1}/${den1} + ${num2}/${den2} = ?`,
          answer: `${num1 + num2}/${den1}`,
          explanation: `When fractions have the same denominator, add the numerators: ${num1} + ${num2} = ${num1 + num2}, so ${num1}/${den1} + ${num2}/${den2} = ${num1 + num2}/${den1}`,
          hint: `The denominators stay the same, just add the top numbers!`
        };
      }
    }

    setCurrentProblem(problem);
  };

  const checkAnswer = () => {
    if (!currentProblem || !userAnswer.trim()) return;

    const isCorrect = userAnswer.toLowerCase().trim() === currentProblem.answer.toString().toLowerCase();
    
    if (isCorrect) {
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      setStreak(prev => prev + 1);
      setFeedback('🎉 Excellent! You got it right!');
      
      setTimeout(() => {
        generateProblem();
      }, 2000);
    } else {
      setScore(prev => ({ correct: prev.correct, total: prev.total + 1 }));
      setStreak(0);
      setFeedback('🤔 Not quite right. Want to try again or see the solution?');
    }
  };

  const showSolutionStep = () => {
    setShowSolution(true);
    setFeedback('💡 Here\'s how to solve it step by step!');
  };

  useEffect(() => {
    generateProblem();
  }, [selectedGrade, selectedTopic]);

  const getEncouragement = () => {
    if (streak >= 5) return '🔥 You\'re on fire! Amazing streak!';
    if (streak >= 3) return '⭐ Great job! Keep it going!';
    if (score.total > 0 && (score.correct / score.total) > 0.7) return '👍 You\'re doing really well!';
    return '🚀 Keep practicing! You\'re learning!';
  };

  return (
    <div className="math-wizard">
      {/* Header */}
      <header className="app-header">
        <div className="safety-info">
          <SafetyBadge type="coppa" />
          <SafetyBadge type="whiteLabelSafe" />
          <SafetyBadge type="noAds" />
        </div>
        <h1>🧙‍♂️ SiteOptz Math Wizard</h1>
        <p>Master math with your personal AI tutor!</p>
        <div className="safety-note">
          🛡️ <strong>Safe Learning:</strong> No data collection, just pure math fun!
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-emoji">📊</div>
          <div className="stat-label">Score</div>
          <div className="stat-value">{score.correct}/{score.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-emoji">🔥</div>
          <div className="stat-label">Streak</div>
          <div className="stat-value">{streak}</div>
        </div>
        <div className="stat-card">
          <div className="stat-emoji">💯</div>
          <div className="stat-label">Accuracy</div>
          <div className="stat-value">
            {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
          </div>
        </div>
        <div className="encouragement">
          {getEncouragement()}
        </div>
      </div>

      <div className="math-container">
        {/* Settings Panel */}
        <div className="settings-panel">
          <h2>⚙️ Settings</h2>
          
          <div className="setting-group">
            <label>👶 Grade Level:</label>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
              {gradeOptions.map(grade => (
                <option key={grade.id} value={grade.id}>{grade.name}</option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>📚 Topic:</label>
            <div className="topic-grid">
              {topicsByGrade[selectedGrade].map(topic => (
                <button
                  key={topic.id}
                  className={`topic-btn ${selectedTopic === topic.id ? 'active' : ''}`}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <span className="topic-emoji">{topic.emoji}</span>
                  <span>{topic.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="new-problem-btn" onClick={generateProblem}>
            🎲 New Problem
          </button>
        </div>

        {/* Problem Panel */}
        <div className="problem-panel">
          <h2>🧮 Solve This Problem</h2>
          
          {currentProblem && (
            <>
              <div className="problem-display">
                <div className="problem-question">
                  {currentProblem.question}
                </div>
                
                <div className="answer-input-container">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="answer-input"
                    onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                  />
                  <button className="check-btn" onClick={checkAnswer}>
                    ✅ Check Answer
                  </button>
                </div>

                {feedback && (
                  <div className={`feedback ${feedback.includes('right') ? 'correct' : 'incorrect'}`}>
                    {feedback}
                  </div>
                )}

                {!showSolution && feedback.includes('Not quite') && (
                  <div className="help-buttons">
                    <button className="hint-btn" onClick={() => setFeedback(currentProblem.hint)}>
                      💡 Get Hint
                    </button>
                    <button className="solution-btn" onClick={showSolutionStep}>
                      📚 Show Solution
                    </button>
                  </div>
                )}

                {showSolution && (
                  <div className="solution-display">
                    <h3>📖 Step-by-Step Solution:</h3>
                    <div className="solution-content">
                      <strong>Answer:</strong> {currentProblem.answer}<br/>
                      <strong>Explanation:</strong> {currentProblem.explanation}
                    </div>
                    <button className="next-btn" onClick={generateProblem}>
                      ➡️ Next Problem
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Learning Tips */}
      <div className="learning-tips">
        <h3>🎓 Math Learning Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-emoji">🧠</div>
            <h4>Think Step by Step</h4>
            <p>Break big problems into smaller, easier steps</p>
          </div>
          <div className="tip-card">
            <div className="tip-emoji">✍️</div>
            <h4>Show Your Work</h4>
            <p>Write down each step to avoid making mistakes</p>
          </div>
          <div className="tip-card">
            <div className="tip-emoji">🔄</div>
            <h4>Practice Regularly</h4>
            <p>A little practice every day is better than a lot once in a while</p>
          </div>
          <div className="tip-card">
            <div className="tip-emoji">❓</div>
            <h4>Ask Questions</h4>
            <p>If you don't understand, use hints or ask for help</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="parent-info">
          <h4>👨‍👩‍👧‍👦 For Parents:</h4>
          <p>Math Wizard adapts to your child's grade level and provides step-by-step explanations. 
          All problems are educationally appropriate and no personal data is collected.</p>
        </div>
      </footer>
    </div>
  );
};

export default MathWizard;