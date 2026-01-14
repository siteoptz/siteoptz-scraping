import React from 'react';
import './AgeFilter.css';

const AgeFilter = ({ selectedAge, onAgeChange }) => {
  const ageGroups = [
    { id: 'all', label: 'All Ages', range: null },
    { id: '3-6', label: 'Ages 3-6 (Preschool)', range: { min: 3, max: 6 } },
    { id: '7-11', label: 'Ages 7-11 (Elementary)', range: { min: 7, max: 11 } },
    { id: '12-15', label: 'Ages 12-15 (Middle School)', range: { min: 12, max: 15 } },
    { id: '16-18', label: 'Ages 16-18 (High School)', range: { min: 16, max: 18 } }
  ];

  return (
    <div className="age-filter">
      <label>Filter by Age Group:</label>
      <div className="age-buttons">
        {ageGroups.map(group => (
          <button
            key={group.id}
            className={`age-button ${selectedAge === group.id ? 'active' : ''}`}
            onClick={() => onAgeChange(group.id)}
          >
            {group.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AgeFilter;