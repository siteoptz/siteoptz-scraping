import React, { useState } from 'react';
import './StoryCreator.css';
import SafetyBadge from '../../components/SafetyBadge';

const StoryCreator = () => {
  const [storyPrompt, setStoryPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('adventure');
  const [selectedAge, setSelectedAge] = useState('8-12');
  const [characters, setCharacters] = useState([]);
  const [generatedStory, setGeneratedStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const genres = [
    { id: 'adventure', name: 'Adventure', emoji: '🏴‍☠️' },
    { id: 'fantasy', name: 'Fantasy', emoji: '🧙‍♀️' },
    { id: 'mystery', name: 'Mystery', emoji: '🔍' },
    { id: 'friendship', name: 'Friendship', emoji: '👫' },
    { id: 'animals', name: 'Animals', emoji: '🦁' },
    { id: 'space', name: 'Space', emoji: '🚀' },
    { id: 'fairy-tale', name: 'Fairy Tale', emoji: '🏰' },
    { id: 'silly', name: 'Silly & Fun', emoji: '🤪' }
  ];

  const ageGroups = [
    { id: '5-7', name: 'Ages 5-7 (Simple words)' },
    { id: '8-12', name: 'Ages 8-12 (Adventure level)' },
    { id: '13-16', name: 'Ages 13-16 (Complex stories)' }
  ];

  const sampleCharacters = [
    { id: 'brave-knight', name: 'Brave Knight', emoji: '⚔️' },
    { id: 'wise-owl', name: 'Wise Owl', emoji: '🦉' },
    { id: 'friendly-dragon', name: 'Friendly Dragon', emoji: '🐉' },
    { id: 'clever-fox', name: 'Clever Fox', emoji: '🦊' },
    { id: 'magic-fairy', name: 'Magic Fairy', emoji: '🧚‍♀️' },
    { id: 'robot-friend', name: 'Robot Friend', emoji: '🤖' },
    { id: 'talking-cat', name: 'Talking Cat', emoji: '🐱' },
    { id: 'superhero-kid', name: 'Superhero Kid', emoji: '🦸‍♀️' }
  ];

  const handleCharacterToggle = (character) => {
    setCharacters(prev => {
      if (prev.find(c => c.id === character.id)) {
        return prev.filter(c => c.id !== character.id);
      } else if (prev.length < 3) {
        return [...prev, character];
      }
      return prev;
    });
  };

  const generateStory = async () => {
    if (!storyPrompt.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI story generation (replace with actual AI API call)
    setTimeout(() => {
      const sampleStory = `Once upon a time, in a magical land far away, there lived a ${characters[0]?.name || 'young hero'}. 

This ${storyPrompt} adventure began when they discovered a mysterious map hidden in an old oak tree. The map showed the way to a secret treasure that could help save their village from a terrible drought.

Along the way, they met a ${characters[1]?.name || 'helpful friend'} who offered to join the quest. Together, they faced many challenges, including crossing a rickety bridge over a deep canyon and solving riddles posed by an ancient guardian.

${characters[2] ? `They were also helped by a ${characters[2].name} who provided them with magical tools for their journey.` : ''}

After many adventures and acts of bravery, they finally found the treasure - not gold or jewels, but a magical spring that could bring water back to their village. They had learned that the greatest treasure was their friendship and courage to help others.

The village celebrated their heroes, and they lived happily ever after, always ready for their next adventure!

The End.`;

      setGeneratedStory(sampleStory);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="story-creator">
      {/* Header with Safety Info */}
      <header className="app-header">
        <div className="safety-info">
          <SafetyBadge type="coppa" />
          <SafetyBadge type="whiteLabelSafe" />
          <SafetyBadge type="noAds" />
        </div>
        <h1>📚 SiteOptz Story Creator</h1>
        <p>Create magical stories with our safe AI storyteller!</p>
        <div className="safety-note">
          🛡️ <strong>Safe for Kids:</strong> All stories are reviewed for age-appropriate content
        </div>
      </header>

      <div className="creator-container">
        {/* Story Setup Panel */}
        <div className="setup-panel">
          <h2>✨ Create Your Story</h2>
          
          {/* Age Group Selection */}
          <div className="setting-group">
            <label>👶 Choose Age Group:</label>
            <select value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)}>
              {ageGroups.map(age => (
                <option key={age.id} value={age.id}>{age.name}</option>
              ))}
            </select>
          </div>

          {/* Genre Selection */}
          <div className="setting-group">
            <label>🎭 Pick a Story Type:</label>
            <div className="genre-grid">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  className={`genre-btn ${selectedGenre === genre.id ? 'active' : ''}`}
                  onClick={() => setSelectedGenre(genre.id)}
                >
                  <span className="genre-emoji">{genre.emoji}</span>
                  <span>{genre.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Character Selection */}
          <div className="setting-group">
            <label>👥 Choose Characters (up to 3):</label>
            <div className="character-grid">
              {sampleCharacters.map(character => (
                <button
                  key={character.id}
                  className={`character-btn ${characters.find(c => c.id === character.id) ? 'selected' : ''}`}
                  onClick={() => handleCharacterToggle(character)}
                  disabled={characters.length >= 3 && !characters.find(c => c.id === character.id)}
                >
                  <span className="character-emoji">{character.emoji}</span>
                  <span>{character.name}</span>
                </button>
              ))}
            </div>
            <div className="selected-characters">
              <strong>Selected:</strong> {characters.map(c => c.name).join(', ') || 'None'}
            </div>
          </div>

          {/* Story Prompt */}
          <div className="setting-group">
            <label>💭 What should your story be about?</label>
            <textarea
              value={storyPrompt}
              onChange={(e) => setStoryPrompt(e.target.value)}
              placeholder="Example: A magical adventure to find a lost treasure..."
              className="story-input"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button 
            className="generate-btn"
            onClick={generateStory}
            disabled={!storyPrompt.trim() || isGenerating}
          >
            {isGenerating ? '✨ Creating Your Story...' : '🪄 Create My Story!'}
          </button>
        </div>

        {/* Story Display Panel */}
        <div className="story-panel">
          <h2>📖 Your Story</h2>
          
          {isGenerating ? (
            <div className="loading-story">
              <div className="loading-spinner">✨</div>
              <p>Creating your magical story...</p>
              <div className="loading-steps">
                <div>🎭 Choosing the perfect adventure...</div>
                <div>👥 Bringing your characters to life...</div>
                <div>📝 Writing your unique tale...</div>
              </div>
            </div>
          ) : generatedStory ? (
            <div className="generated-story">
              <div className="story-content">
                {generatedStory.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index}>{paragraph}</p>
                ))}
              </div>
              
              <div className="story-actions">
                <button className="action-btn primary">🎯 Read Aloud</button>
                <button className="action-btn secondary">🖼️ Add Pictures</button>
                <button className="action-btn secondary">📤 Share with Parents</button>
                <button className="action-btn secondary">📚 Save to Library</button>
              </div>
              
              <div className="story-stats">
                <div className="stat">
                  <span className="stat-label">Reading Time:</span>
                  <span className="stat-value">3-5 minutes</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Reading Level:</span>
                  <span className="stat-value">Grade 3-4</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Words:</span>
                  <span className="stat-value">{generatedStory.split(' ').length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-story">
              <div className="empty-icon">📝</div>
              <h3>Ready to Create!</h3>
              <p>Fill out the form on the left and click "Create My Story" to see your magical tale appear here!</p>
              
              <div className="story-tips">
                <h4>💡 Story Tips:</h4>
                <ul>
                  <li>Be creative with your story ideas!</li>
                  <li>Choose characters that work well together</li>
                  <li>Think about what lesson your story might teach</li>
                  <li>Have fun and let your imagination run wild!</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Parent Info */}
      <footer className="app-footer">
        <div className="parent-info">
          <h4>👨‍👩‍👧‍👦 For Parents:</h4>
          <p>All stories are generated with age-appropriate content and reviewed for safety. 
          No personal information is collected, and all stories remain private to your family.</p>
        </div>
      </footer>
    </div>
  );
};

export default StoryCreator;