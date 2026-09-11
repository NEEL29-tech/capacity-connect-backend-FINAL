/**
 * Capacity Connect LMS (SIH26075) - Express App
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const quizRoutes = require('./routes/quizRoutes');
const competencyRoutes = require('./routes/competencyRoutes');
const skillGapRoutes = require('./routes/skillGapRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Capacity Connect LMS Backend',
    sihCode: 'SIH26075',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/skill-gaps', skillGapRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);

// Global 404 Handler for API routes
// Express 5 compatible wildcard syntax
app.use('/api/{*splat}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('[GlobalErrorHandler]', err);

  const statusCode =
    err.statusCode ||
    (err.name === 'ValidationError' ? 400 : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development'
      ? { stack: err.stack }
      : {})
  });
});

module.exports = app;