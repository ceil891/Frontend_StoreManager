# AI Agent Server Sample

Mẫu Node/Express server để kết nối Ollama và PostgreSQL.

## Cài đặt

1. Cài dependencies:

```bash
npm install express body-parser pg axios
```

2. Khởi tạo biến môi trường (ví dụ):

```bash
export DATABASE_URL='postgresql://user:password@localhost:5432/retailhub'
export OLLAMA_MODEL='llama2'
export PORT=4000
```

3. Chạy server:

```bash
node backend/ai-agent/aiAgentServer.js
```

## API

- `POST /api/ai/chat`
- Body JSON: `{ "question": "Câu hỏi của bạn" }`
- Trả về: `{ "answer": "...", "sourceCount": 2 }

## Chú ý

- File mẫu dùng truy vấn `documents` từ PostgreSQL.
- Bạn có thể mở rộng bằng embedding vector hoặc thêm bảng `user_queries`.
- Ollama ở local mặc định lắng nghe `http://localhost:11434`.
