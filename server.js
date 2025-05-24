const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

// Absolute path to ffmpeg executable (Windows example with quotes for spaces)
const ffmpegPath = '"C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe"';

// Middleware setup
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// POST /remix endpoint: handles audio upload and applies remix effect using FFmpeg
app.post('/remix', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const effect = req.body.effect;
  const inputPath = req.file.path;
  const outputFilename = `output_${Date.now()}.mp3`;
  const outputPath = path.join(uploadsDir, outputFilename);

  console.log(`Processing remix: effect="${effect}", input="${inputPath}"`);

  let ffmpegCommand;

  switch (effect) {
    case 'Slowed + Reverb':
      ffmpegCommand = `${ffmpegPath} -y -i "${inputPath}" -filter_complex "asetrate=44100*0.9,aresample=44100" "${outputPath}"`;
      break;
    case '8D Audio':
      ffmpegCommand = `${ffmpegPath} -y -i "${inputPath}" -filter_complex "apulsator=hz=0.3" "${outputPath}"`;
      break;
    case 'Lo-fi Remix':
      ffmpegCommand = `${ffmpegPath} -y -i "${inputPath}" -af "asetrate=44100*0.8,atempo=1.1,lowpass=f=3000" "${outputPath}"`;
      break;
    default:
      // Cleanup uploaded file on invalid effect request
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Failed to delete file after invalid effect:', err);
      });
      return res.status(400).json({ error: 'Invalid remix effect specified' });
  }

  console.log('Executing FFmpeg command:', ffmpegCommand);

  exec(ffmpegCommand, (error, stdout, stderr) => {
    // Delete input file regardless of success/failure to save space
    fs.unlink(inputPath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting input file:', unlinkErr);
      else console.log(`Deleted input file: ${inputPath}`);
    });

    if (error) {
      console.error('FFmpeg processing error:', stderr);
      
      // Clean up partial output file if exists
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, (delErr) => {
          if (delErr) console.error('Error deleting incomplete output:', delErr);
          else console.log('Deleted incomplete output file due to error:', outputPath);
        });
      }

      return res.status(500).json({ error: 'Failed to process audio remix' });
    }

    console.log(`FFmpeg processing completed successfully. Output: ${outputPath}`);

    // Optional: log current uploads for debugging
    fs.readdir(uploadsDir, (readErr, files) => {
      if (readErr) console.error('Failed to read uploads directory:', readErr);
      else console.log('Current uploads:', files);
    });

    res.json({ audioUrl: `http://localhost:${PORT}/uploads/${outputFilename}` });
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`Working directory: ${__dirname}`);
});
