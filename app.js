const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./api-docs.yaml');

const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API de usuários',
        version: '1.0.0',
        description: 'API para gerenciar usuários',
        contact: {
          name: 'ilgner',
          email: 'ilgner.gui@gmail.com',
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT}`,
        },
      ],

    },
    components: {
        schemas: {
          Usuario: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              nome: { type: 'string' },
              telefone: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },

    apis: ['app.js'],
  };
  const swaggerSpec = swaggerJSDoc(swaggerOptions);


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
app.use(cors({
    origin: ['http://127.0.0.1:5500','http://localhost']
  }));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Retorna uma lista de todos os usuários
 *     tags:
 *       - Usuários
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */
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
      // Verifica se já existe algum registro com o mesmo email
      const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      if (result.rowCount > 0) {
        res.status(409).json({ error: 'Email já cadastrado' });
        return;
      }
      // Insere o registro na tabela usuarios
      const resultInsert = await pool.query(
        'INSERT INTO usuarios (nome, telefone, email) VALUES ($1, $2, $3) RETURNING id',
        [nome, telefone, email]
      );
      res.json({ id: resultInsert.rows[0].id });
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