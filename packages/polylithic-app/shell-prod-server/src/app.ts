import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;

const angularDistPath = path.join(__dirname, '../dist/angular-shell-app/browser');
app.use(express.static(angularDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(angularDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
