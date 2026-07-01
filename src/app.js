import express from 'express';
import cors from 'cors';
import prdRoutes from './routes/prd.routes.js';

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/prd', prdRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TestGen backend is healthy.' });
});


app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
