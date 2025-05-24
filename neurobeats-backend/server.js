const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// POST route to handle audio remixing
app.post('/remix', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const effect = req.body.effect;
  const inputPath = req.file.path;
  const outputFilename = `output_${Date.now()}.mp3`;
  const outputPath = path.join(uploadsDir, outputFilename);

  let ffmpegCommand;

  // Select ffmpeg command based on effect
  switch (effect) {
    case 'Slowed + Reverb':
      ffmpegCommand = `ffmpeg -y -i "${inputPath}" -filter_complex "asetrate=44100*0.9,aresample=44100" "${outputPath}"`;
      break;
    case '8D Audio':
      ffmpegCommand = `ffmpeg -y -i "${inputPath}" -filter_complex "apulsator=hz=0.3" "${outputPath}"`;
      break;
    case 'Lo-fi Remix':
      ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "asetrate=44100*0.8,atempo=1.1,lowpass=f=3000" "${outputPath}"`;
      break;
    default:
      // Delete uploaded file if effect invalid
      fs.unlink(inputPath, () => {});
      return res.status(400).json({ error: 'Invalid remix effect specified' });
  }

  // Run ffmpeg command
  exec(ffmpegCommand, (error) => {
    // Remove original uploaded file
    fs.unlink(inputPath, () => {});

    if (error) {
      // Remove output file if it exists
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      return res.status(500).json({ error: 'Failed to process audio remix' });
    }

    // Respond with public URL to the processed file
    const host = req.get('host');
    const protocol = req.protocol;
    const audioUrl = `${protocol}://${host}/uploads/${outputFilename}`;
    res.json({ audioUrl });
  });
});

// Serve React frontend build folder (or static files)
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route to serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
