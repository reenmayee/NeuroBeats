import React, { useState } from 'react';
import './App.css';

function App() {
  // State to hold uploaded audio file
  const [audioFile, setAudioFile] = useState(null);
  // The chosen remix effect type
  const [remixType, setRemixType] = useState(null);
  // URL for the remixed audio returned from backend
  const [remixedAudioURL, setRemixedAudioURL] = useState(null);
  // Display name for the remix audio
  const [remixName, setRemixName] = useState('');
  // Loading state during remix processing
  const [loading, setLoading] = useState(false);

  // Handle audio file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Reset previous remix state
      setAudioFile(file);
      setRemixType(null);
      setRemixedAudioURL(null);
      setRemixName('');
    }
  };

  // Send audio file and chosen effect to backend for remix processing
  const handleRemix = async (type) => {
    if (!audioFile) {
      alert('Please upload an audio file before selecting a remix effect.');
      return;
    }

    setRemixType(type);
    setRemixedAudioURL(null);
    setRemixName('');
    setLoading(true);

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('effect', type);

    try {
      const response = await fetch('https://neurobeats.onrender.com/remix', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Remix processing failed.');

      const data = await response.json();
      // Format remix name nicely
      setRemixName(`${type} - NeuroBeats Remix`);
      setRemixedAudioURL(data.audioUrl);
    } catch (error) {
      console.error('Error during remix:', error);
      alert('Sorry, there was an error processing your remix. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      {/* Upload Section */}
      <section className="step">
        <h2>🎧 NeuroBeats</h2>
        <p>Where neural networks meet beats and filters!</p>

        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          aria-label="Upload audio file"
        />

        {/* Preview original audio if uploaded */}
        {audioFile && (
          <div className="preview">
            <h3>Original Audio Preview:</h3>
            <audio controls src={URL.createObjectURL(audioFile)} />
          </div>
        )}
      </section>

      {/* Remix Options Section */}
      <section className="step">
        <h2>Select a Remix Effect</h2>
        <div className="remix-options">
          {['Slowed + Reverb', '8D Audio', 'Lo-fi Remix'].map((effect) => (
            <button
              key={effect}
              onClick={() => handleRemix(effect)}
              disabled={loading}
              aria-pressed={remixType === effect}
            >
              {effect}
            </button>
          ))}
        </div>

        {/* Display remix processing status or result */}
        {remixType && (
          <div className="remix-result">
            <h3>{remixName || `Generating ${remixType}...`}</h3>
            {loading && <p className="loading">Processing your remix, please wait...</p>}
            {remixedAudioURL && (
              <>
                <audio controls src={remixedAudioURL} />
                <a
                  href={remixedAudioURL}
                  download={`neurobeats_${remixType.replace(/\s+/g, '_').toLowerCase()}.mp3`}
                  className="download-link"
                >
                  Download Remix
                </a>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
