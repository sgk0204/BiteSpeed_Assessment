import express, { Request, Response } from 'express';
import { identify } from './controllers/identity';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('BiteSpeed Identity Reconciliation API is running.');
});

app.post('/identify', identify);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
