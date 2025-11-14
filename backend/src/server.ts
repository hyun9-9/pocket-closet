// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 라우트
import apiRoutes from './routes/index';

// 미들웨어
import { errorHandler } from './middleware/error.middleware';

// 설정
import { connectDatabase } from './config/database';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ================================
// 미들웨어 설정
// ================================

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body 파서
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 로깅
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ================================
// 라우트 설정
// ================================

// API 라우트
app.use('/api', apiRoutes);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// 에러 핸들러 (마지막에!)
app.use(errorHandler);

// ================================
// 서버 시작
// ================================

const startServer = async () => {
  try {
    // 데이터베이스 연결
    await connectDatabase();
    console.log('✅ Database connected');

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔧 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;