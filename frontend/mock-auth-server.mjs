/**
 * Мок-бэкенд для локального тестирования фичи авторизации.
 * не нужен npm install, это только для модулей Node!!!!
 * Данные только в процессе
 * Запуск:
 *   node mock-auth-server.mjs
 */
import { createServer } from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';

const PORT = Number(process.env.PORT || 8000);
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const ACCESS_TTL_SECONDS = Number(process.env.ACCESS_TTL_SECONDS || 900);

const usersByEmail = new Map();
const refreshTokenToUserId = new Map();

const base64url = (obj) =>
  Buffer.from(JSON.stringify(obj)).toString('base64url');

/** Не настоящий JWT (подпись фиктивна) — но exp/sub в payload реальные, этого хватает фронтенду. */
function issueAccessToken(userId) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'none', typ: 'JWT' });
  const payload = base64url({ sub: userId, iat: now, exp: now + ACCESS_TTL_SECONDS });
  return `${header}.${payload}.mock-signature`;
}

function issueTokens(userId) {
  const refreshToken = randomBytes(24).toString('hex');
  refreshTokenToUserId.set(refreshToken, userId);
  return { accessToken: issueAccessToken(userId), refreshToken };
}

const toPublicUser = (user) => ({ id: user.id, email: user.email, name: user.name });

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function findUserByBearerToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const [, payloadPart] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return [...usersByEmail.values()].find((u) => u.id === payload.sub) ?? null;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    return res.end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const { name, email, password } = await readJsonBody(req);
      if (!email || !password) return send(res, 400, { message: 'Email и пароль обязательны' });
      if (usersByEmail.has(email)) {
        return send(res, 409, { message: 'Пользователь с таким email уже существует' });
      }
      const user = { id: randomUUID(), email, name, password };
      usersByEmail.set(email, user);
      return send(res, 200, { user: toPublicUser(user), tokens: issueTokens(user.id) });
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const { email, password } = await readJsonBody(req);
      const user = usersByEmail.get(email);
      if (!user || user.password !== password) {
        return send(res, 401, { message: 'Неверный email или пароль' });
      }
      return send(res, 200, { user: toPublicUser(user), tokens: issueTokens(user.id) });
    }

    if (req.method === 'POST' && pathname === '/api/auth/refresh') {
      const { refreshToken } = await readJsonBody(req);
      const userId = refreshTokenToUserId.get(refreshToken);
      if (!userId) return send(res, 401, { message: 'Сессия истекла, войдите заново' });
      refreshTokenToUserId.delete(refreshToken); // ротация: старый refresh больше не годится
      return send(res, 200, issueTokens(userId));
    }

    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      //чистка локальнойй сессии
      return send(res, 204, undefined);
    }

    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const user = findUserByBearerToken(req);
      if (!user) return send(res, 401, { message: 'Не авторизован' });
      return send(res, 200, toPublicUser(user));
    }

    send(res, 404, { message: 'Not found' });
  } catch (err) {
    send(res, 500, { message: 'Внутренняя ошибка мок-сервера', detail: String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`Мок auth-сервер: http://localhost:${PORT}/api`);
  console.log(`Access token TTL: ${ACCESS_TTL_SECONDS}s · разрешённый origin: ${ORIGIN}`);
});
