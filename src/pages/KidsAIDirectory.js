import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { kidsAIToolsDatabase, searchTools, getWhiteLabelTools, getCOPPACompliantTools } from '../data/kids-ai-tools-database';
import KidsAIToolCard from '../components/KidsAIToolCard';
import AgeFilter from '../components/AgeFilter';
import SafetyBadge from '../components/SafetyBadge';
import './KidsAIDirectory.css';

const KidsAIDirectory = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWhiteLabelOnly, setShowWhiteLabelOnly] = useState(true);
  const [filteredTools, setFilteredTools] = useState([]);
  const [userTier] = useState('free'); // This would come from user context in real app

  const ageRanges = {
    '3-6': { min: 3, max: 6 },
    '7-11': { min: 7, max: 11 },
    '12-15': { min: 12, max: 15 },
    '16-18': { min: 16, max: 18 }
  };

  useEffect(() => {
    const filters = {
      category: selectedCategory,
      ageRange: selectedAge !== 'all' ? ageRanges[selectedAge] : null,
      coppaOnly: true, // Always show COPPA compliant for kids
      whiteLabelOnly: showWhiteLabelOnly
    };

    const results = searchTools(searchTerm, filters);
    setFilteredTools(results);
  }, [selectedCategory, selectedAge, searchTerm, showWhiteLabelOnly]);

  const handleLaunchApp = (tool) => {
    // Navigate to the specific white-label app
    switch (tool.id) {
      case 'siteoptz-story-creator':
        navigate('/kids-ai/apps/story-creator');
        break;
      case 'siteoptz-math-wizard':
        navigate('/kids-ai/apps/math-wizard');
        break;
      case 'siteoptz-art-studio':
        navigate('/kids-ai/apps/art-studio');
        break;
      case 'siteoptz-code-academy':
        navigate('/kids-ai/apps/code-academy');
        break;
      default:
        console.log('Launching app:', tool.name);
        // For demo, show an alert
        alert(`🚀 Launching ${tool.name}!\n\nThis would open the full white-label app in a new tab or window.`);
    }
  };

  const handleViewDetails = (tool) => {
    navigate(`/kids-ai/tool/${tool.id}`);
  };

  const getTotalWhiteLabelApps = () => {
    return getWhiteLabelTools().length;
  };

  const getTotalSafeApps = () => {
    return getCOPPACompliantTools().length;
  };

  return (
    <div className="kids-ai-directory">
      {/* Hero Header */}
      <header className="directory-hero">
        <div className="hero-content">
          <div className="hero-badges">
            <SafetyBadge type="coppa" />
            <SafetyBadge type="whiteLabelSafe" />
            <SafetyBadge type="noAds" />
            <SafetyBadge type="safetyCertified" />
          </div>
          
          <h1>🧒 SiteOptz Kids AI Hub</h1>
          <h2>Safe, Educational AI Apps Built Just for Children</h2>
          <p>Discover our collection of proprietary, white-label AI tools designed specifically for kids' safety and learning</p>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-number">{getTotalWhiteLabelApps()}</div>
              <div className="stat-label">Our Safe Apps</div>
            </div>
            <div className="hero-stat">
              <div className="stat-number">{getTotalSafeApps()}</div>
              <div className="stat-label">COPPA Compliant</div>
            </div>
            <div className="hero-stat">
              <div className="stat-number">100%</div>
              <div className="stat-label">Ad-Free</div>
            </div>
          </div>

          <div className="white-label-highlight">
            <div className="highlight-icon">🏠</div>
            <div className="highlight-content">
              <h3>Why Our White-Label Apps Are Better</h3>
              <ul>
                <li>✅ <strong>No Third-Party Data Collection</strong> - Your child's data stays safe</li>
                <li>✅ <strong>No External Links or Ads</strong> - Completely controlled environment</li>
                <li>✅ <strong>Educational Focus</strong> - Designed by educators, not marketers</li>
                <li>✅ <strong>Parent Controls</strong> - Full visibility and control over usage</li>
                <li>✅ <strong>COPPA Compliant by Design</strong> - Built from the ground up for children's safety</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="directory-filters">
        <div className="filters-header">
          <h3>🔍 Find the Perfect App for Your Child</h3>
        </div>
        
        <div className="filter-row">
          <div className="search-container">
            <input
              type="search"
              placeholder="Search for learning apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">All Subject Areas</option>
            {kidsAIToolsDatabase.categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <AgeFilter selectedAge={selectedAge} onAgeChange={setSelectedAge} />
        
        <div className="filter-toggles">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showWhiteLabelOnly}
              onChange={(e) => setShowWhiteLabelOnly(e.target.checked)}
            />
            <span className="toggle-text">🏠 Show only our proprietary apps</span>
            <span className="toggle-note">(Recommended for maximum safety)</span>
          </label>
        </div>
      </div>

      {/* Results Header */}
      <div className="results-header">
        <div className="results-info">
          <h3>
            {filteredTools.length} Safe Learning Apps Found
            {showWhiteLabelOnly && <span className="white-label-tag"> (Our Apps Only)</span>}
          </h3>
          
          {userTier === 'free' && (
            <div className="upgrade-prompt">
              <div className="upgrade-icon">🔓</div>
              <div className="upgrade-content">
                <strong>Want full access?</strong> Create a parent account to unlock detailed progress tracking, 
                advanced safety controls, and premium learning features.
                <a href="/kids-ai/pricing" className="upgrade-link">Learn More →</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Featured Apps Section */}
      <div className="featured-apps">
        <h3>⭐ Featured White-Label Apps</h3>
        <div className="featured-grid">
          {filteredTools
            .filter(tool => tool.appType === 'white-label')
            .slice(0, 4)
            .map(tool => (
              <div key={tool.id} className="featured-app-card">
                <div className="featured-badge">🏆 Featured</div>
                <KidsAIToolCard
                  tool={tool}
                  userTier={userTier}
                  onLaunchApp={handleLaunchApp}
                  onViewDetails={handleViewDetails}
                />
              </div>
            ))}
        </div>
      </div>

      {/* All Apps Grid */}
      <div className="apps-section">
        <h3>📚 All Available Apps</h3>
        <div className="apps-grid">
          {filteredTools.map(tool => (
            <KidsAIToolCard
              key={tool.id}
              tool={tool}
              userTier={userTier}
              onLaunchApp={handleLaunchApp}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No apps found matching your criteria</h3>
            <p>Try adjusting your filters or search terms to find more learning apps.</p>
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedAge('all');
                setSearchTerm('');
                setShowWhiteLabelOnly(true);
              }}
            >
              🔄 Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Safety Information Section */}
      <div className="safety-section">
        <h3>🛡️ Your Child's Safety is Our Priority</h3>
        <div className="safety-features">
          <div className="safety-feature">
            <div className="safety-feature-icon">🔒</div>
            <h4>Data Protection</h4>
            <p>No personal data collection, no external tracking, complete privacy protection</p>
          </div>
          <div className="safety-feature">
            <div className="safety-feature-icon">👨‍👩‍👧‍👦</div>
            <h4>Parent Controls</h4>
            <p>Full visibility into your child's learning progress with comprehensive parent dashboards</p>
          </div>
          <div className="safety-feature">
            <div className="safety-feature-icon">🎓</div>
            <h4>Educational Content</h4>
            <p>All content reviewed by certified educators and child development experts</p>
          </div>
          <div className="safety-feature">
            <div className="safety-feature-icon">🚫</div>
            <h4>Ad-Free Experience</h4>
            <p>No advertisements, no external links, no distractions from learning</p>
          </div>
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h3>Ready to Give Your Child Safe AI Learning?</h3>
          <p>Join thousands of parents who trust SiteOptz Kids for their children's digital education</p>
          <div className="cta-buttons">
            <button className="cta-btn primary" onClick={() => navigate('/kids-ai/signup')}>
              🔐 Create Parent Account (Free)
            </button>
            <button className="cta-btn secondary" onClick={() => navigate('/kids-ai/safety-guide')}>
              📋 Download Safety Guide
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="directory-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🏠 SiteOptz Kids</h4>
            <p>Safe, educational AI tools built specifically for children. 
            Our white-label approach ensures your child's digital safety and privacy.</p>
          </div>
          <div className="footer-section">
            <h4>🛡️ Safety Resources</h4>
            <ul>
              <li><a href="/kids-ai/safety-guide">Children's Digital Safety Guide</a></li>
              <li><a href="/kids-ai/parent-controls">Parent Control Features</a></li>
              <li><a href="/kids-ai/coppa-compliance">COPPA Compliance Info</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>👨‍👩‍👧‍👦 For Parents</h4>
            <ul>
              <li><a href="/kids-ai/how-it-works">How Our Apps Work</a></li>
              <li><a href="/kids-ai/educational-benefits">Educational Benefits</a></li>
              <li><a href="/kids-ai/pricing">Pricing & Features</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 SiteOptz Kids. Committed to safe, educational AI for children.</p>
        </div>
      </footer>
    </div>
  );
};

export default KidsAIDirectory;