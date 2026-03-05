import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('BiteSpeed Identity Reconciliation API is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
