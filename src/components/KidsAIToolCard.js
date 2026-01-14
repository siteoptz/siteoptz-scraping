import React from 'react';
import './KidsAIToolCard.css';
import SafetyBadge from './SafetyBadge';

const KidsAIToolCard = ({ tool, userTier = 'free', onLaunchApp, onViewDetails }) => {
  const isWhiteLabel = tool.appType === 'white-label';
  const isPremiumRequired = userTier === 'free' && tool.detailsRequiresPremium;
  
  return (
    <div className={`kids-ai-tool-card ${isPremiumRequired ? 'locked' : ''} ${isWhiteLabel ? 'white-label' : ''}`}>
      {/* Safety Badges - Always visible and prominent for kids' apps */}
      <div className="safety-badges-container">
        {tool.coppaCompliant && <SafetyBadge type="coppa" />}
        {tool.safetyCertified && <SafetyBadge type="safetyCertified" />}
        {isWhiteLabel && <SafetyBadge type="whiteLabelSafe" />}
        <SafetyBadge type="noAds" />
      </div>
      
      {/* Tool Header */}
      <div className="tool-header">
        <h3>{tool.name}</h3>
        <span className="provider">{tool.provider}</span>
        {isWhiteLabel && <span className="white-label-badge">Our App</span>}
      </div>
      
      {/* Age Range Badge */}
      <div className="age-badge">
        Ages {tool.ageRange.min}-{tool.ageRange.max}
      </div>
      
      {/* Metrics Grid */}
      <div className="tool-metrics">
        <div className="metric">
          <span className="label">Educational Value</span>
          <span className="value">{tool.educationalValue}/10</span>
          <div className="stars">
            {'★'.repeat(Math.floor(tool.educationalValue / 2))}
          </div>
        </div>
        <div className="metric">
          <span className="label">Parent Rating</span>
          <span className="value">{tool.parentRating}/5</span>
          <div className="stars">
            {'★'.repeat(Math.floor(tool.parentRating))}
          </div>
        </div>
        <div className="metric">
          <span className="label">Price</span>
          <span className="value price-free">{tool.pricing}</span>
        </div>
      </div>
      
      {/* Description */}
      <p className="tool-description">{tool.description}</p>
      
      {/* Features/Tags */}
      <div className="tool-features">
        {tool.features.slice(0, 3).map((feature, idx) => (
          <span key={idx} className="feature-tag">{feature}</span>
        ))}
        {tool.features.length > 3 && (
          <span className="feature-tag more">+{tool.features.length - 3} more</span>
        )}
      </div>
      
      {/* Safety Notes - Very important for kids' apps */}
      <div className="safety-notes">
        <div className="safety-icon">🛡️</div>
        <small>{tool.safetyNotes}</small>
      </div>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        {isPremiumRequired ? (
          <button className="upgrade-btn" onClick={() => window.location.href = '/kids-ai/pricing'}>
            🔓 Unlock with Parent Account
          </button>
        ) : (
          <>
            {isWhiteLabel ? (
              <button className="launch-app-btn" onClick={() => onLaunchApp(tool)}>
                🚀 Launch {tool.name.split(' ')[1]} {tool.name.split(' ')[2]}
              </button>
            ) : (
              <button className="view-btn" onClick={() => onViewDetails(tool)}>
                👀 View Details →
              </button>
            )}
            <button className="details-btn" onClick={() => onViewDetails(tool)}>
              📋 More Info
            </button>
          </>
        )}
      </div>
      
      {/* White Label Indicator */}
      {isWhiteLabel && (
        <div className="white-label-footer">
          <span>🏠 Made by SiteOptz Kids - Safe & Secure</span>
        </div>
      )}
    </div>
  );
};

export default KidsAIToolCard;