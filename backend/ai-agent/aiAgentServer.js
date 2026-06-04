const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/retailhub',
});

async function fetchRelevantDocs(question) {
  const sql = `
    SELECT id, source, title, content
    FROM documents
    WHERE content ILIKE $1 OR title ILIKE $1
    ORDER BY updated_at DESC
    LIMIT 5
  `;
  const values = [`%${question}%`];
  const { rows } = await pool.query(sql, values);
  return rows;
}

async function callOllama(prompt) {
  const model = process.env.OLLAMA_MODEL || 'llama2';
  const url = `http://localhost:11434/v1/chat/completions`;

  const payload = {
    model,
    messages: [
      { role: 'system', content: 'Bạn là trợ lý AI cho hệ thống RetailHub. Hãy trả lời rõ ràng và chỉ dùng dữ liệu trong ngữ cảnh.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data?.choices?.[0]?.message?.content || 'Không nhận được phản hồi từ Ollama.';
}

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required' });
    }

    const docs = await fetchRelevantDocs(question);
    const contextText = docs.map((doc, index) => `Nguồn ${index + 1}: [${doc.source}] ${doc.title}\n${doc.content}`).join('\n\n');

    const prompt = `Dưới đây là dữ liệu liên quan từ PostgreSQL:\n${contextText}\n\nCâu hỏi: ${question}\n\nHãy trả lời ngắn gọn, chính xác, và chỉ dùng thông tin đã có.`;

    const answer = await callOllama(prompt);

    res.json({ answer, sourceCount: docs.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi gọi Ollama' });
  }
});

app.listen(port, () => {
  console.log(`AI agent server listening on http://localhost:${port}`);
});
