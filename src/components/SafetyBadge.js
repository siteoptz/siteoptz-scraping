import React from 'react';

const SafetyBadge = ({ type = 'coppa' }) => {
  const badges = {
    coppa: {
      text: 'COPPA Safe',
      tooltip: 'COPPA Compliant - Verified safe for children under 13',
      color: '#4caf50',
      icon: '🛡️'
    },
    safetyCertified: {
      text: 'Safety Verified',
      tooltip: 'Safety verified and certified by SiteOptz Kids',
      color: '#2196f3',
      icon: '✓'
    },
    teacherApproved: {
      text: 'Teacher Approved',
      tooltip: 'Approved by certified educators',
      color: '#ff9800',
      icon: '👩‍🏫'
    },
    whiteLabelSafe: {
      text: 'SiteOptz Safe',
      tooltip: 'Our proprietary app - no third-party data collection',
      color: '#9c27b0',
      icon: '🏠'
    },
    noAds: {
      text: 'Ad-Free',
      tooltip: 'No advertisements or external marketing',
      color: '#607d8b',
      icon: '🚫'
    }
  };

  const badge = badges[type] || badges.coppa;

  return (
    <span 
      className="safety-badge" 
      style={{ 
        backgroundColor: badge.color,
        color: 'white',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.75em',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        margin: '2px'
      }}
      title={badge.tooltip}
    >
      <span>{badge.icon}</span>
      {badge.text}
    </span>
  );
};

export default SafetyBadge;