const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');

app.use(cors({
    origin: 'http://127.0.0.1:5500'
  }));


dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const app = express();
app.use(express.json());

app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.post('/usuarios', async (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome || !telefone || !email) {
    res.status(400).json({ error: 'Dados incompletos' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, telefone, email) VALUES ($1, $2, $3) RETURNING id',
      [nome, telefone, email]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, email } = req.body;
  if (!nome || !telefone || !email) {
    res.status(400).json({ error: 'Dados incompletos' });
    return;
  }
  try {
    const result = await pool.query(
      'UPDATE usuarios SET nome = $1, telefone = $2, email = $3 WHERE id = $4',
      [nome, telefone, email, id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return
    }
    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor iniciado na porta ${process.env.PORT}`);
});