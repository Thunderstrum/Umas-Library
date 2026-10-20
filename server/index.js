import http from 'http';
import {
    databaseConfig
} from './config.js';
import { createDatabaseConnection } from './database.js';
import { listBooks } from './books.js';

const port = Number(process.env.PORT) || 3000;
const database = await createDatabaseConnection(databaseConfig);

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://${req.headers.host}');

    if (req.method == 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Library Books</title>
</head>
<body>
  <h1>Library Books</h1>
  <p id="status">Loading books…</p>
  <ul id="book-list"></ul>

  <script>
    async function loadBooks() {
      const status = document.getElementById('status');
      const list = document.getElementById('book-list');

      try {
        const response = await fetch('/books');
        if (!response.ok) throw new Error('Request failed');

        const books = await response.json();
        list.replaceChildren();

        for (const book of books) {
          const item = document.createElement('li');
          item.textContent =
            book.title + ' — ' + (book.author_name || 'Author unknown');
          list.appendChild(item);
        }

        status.textContent = books.length
          ? ''
          : 'No books found.';
      } catch (error) {
        console.error(error);
        status.textContent = 'Could not load books.';
      }
    }

    loadBooks();
  </script>
</body>
</html>`);

            return;
    }
    
    if (req.method === 'GET' && url.pathname === '/books') {
        try {
            const books = await listBooks(database, url.searchParams.get('search') || '');
            res.writeHead(200, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify(books));
        } catch (error) {
            const status = error.statusCode || 500;
            console.error('Error fetching books:', error);
            res.writeHead(status, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify({ 
                error: status === 400
                    ? error.message
                    : 'An error occurred while fetching books.'
             }));
        }
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
