import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { AuthController } from './controllers/authController';
import { ApiController } from './controllers/apiController';
import { authenticate, requireRole } from './middleware/auth';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large resume payloads

// --- Routes ---

// Auth
app.post('/auth/register', AuthController.register);
app.post('/auth/login', AuthController.login);

// API (Protected)
app.use('/api', authenticate);

// Resume / Profile
app.post('/api/resume/upload', ApiController.uploadResume);
app.get('/api/profile/me', ApiController.getProfile);

// Jobs
app.get('/api/jobs', ApiController.getJobs);
app.post('/api/jobs', requireRole('B_SIDE'), ApiController.createJob);

// Matching
app.post('/api/match/run', ApiController.matchCandidateToJobs);

// Health
app.get('/health', (req, res) => res.send('OK'));

// Start
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});