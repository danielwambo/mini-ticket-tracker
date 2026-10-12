
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db.js';

let createdIds = [];

async function createTicket(overrides = {}) {
  const response = await request(app)
    .post('/tickets')
    .send({
      title: `Test ticket ${Date.now()} ${Math.random()}`,
      priority: 'medium',
      ...overrides,
    });

  if (response.body.id) {
    createdIds.push(response.body.id);
  }

  return response;
}

beforeAll(async () => {
  await pool.query('SELECT 1');
});

afterEach(async () => {
  if (createdIds.length > 0) {
    await pool.query(
      'DELETE FROM tickets WHERE id = ANY($1::int[])',
      [createdIds],
    );
    createdIds = [];
  }
});

afterAll(async () => {
  await pool.end();
});

describe('Ticket API integration tests', () => {
  it('creates a ticket with the expected defaults', async () => {
    const response = await createTicket({
      title: 'Integration test ticket',
      priority: 'high',
    });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Integration test ticket');
    expect(response.body.status).toBe('open');
    expect(response.body.priority).toBe('high');
    expect(response.body.id).toBeDefined();
    expect(response.body.created_at).toBeDefined();
  });

  it('filters tickets by status and supports pagination', async () => {
    await createTicket({ status: 'open' });
    await createTicket({ status: 'open' });

    const response = await request(app)
      .get('/tickets')
      .query({ status: 'open', page: 1, limit: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].status).toBe('open');
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(1);
    expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it('returns counts grouped by ticket status', async () => {
    const response = await request(app).get('/tickets/stats');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('open');
    expect(response.body).toHaveProperty('in_progress');
    expect(response.body).toHaveProperty('closed');

    for (const status of ['open', 'in_progress', 'closed']) {
      expect(typeof response.body[status]).toBe('number');
    }
  });
});
