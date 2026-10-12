import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const STATUSES = ['open', 'in_progress', 'closed'];
const PRIORITIES = ['low', 'medium', 'high'];

// GET /tickets/stats
// Keep this route before /:id.
router.get('/stats', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM tickets
      GROUP BY status
    `);

    const stats = {
      open: 0,
      in_progress: 0,
      closed: 0,
    };

    for (const row of result.rows) {
      stats[row.status] = row.count;
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// POST /tickets
router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority = 'medium' } = req.body;

    if (
      typeof title !== 'string' ||
      title.trim().length === 0 ||
      title.trim().length > 200
    ) {
      return res.status(400).json({
        error: 'Title is required and must be at most 200 characters.',
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      return res.status(400).json({
        error: 'Description must be a string.',
      });
    }

    if (description && description.length > 10000) {
      return res.status(400).json({
        error: 'Description must be at most 10000 characters.',
      });
    }

    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: 'Priority must be low, medium, or high.',
      });
    }

    const result = await pool.query(
      `INSERT INTO tickets (title, description, priority)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, status, priority, created_at`,
      [title.trim(), description?.trim() || null, priority]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// GET /tickets?status=open&page=1&limit=10
router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const { status } = req.query;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        error: 'Page must be positive and limit must be between 1 and 100.',
      });
    }

    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Status must be open, in_progress, or closed.',
      });
    }

    const offset = (page - 1) * limit;
    const filter = status ? 'WHERE status = $1' : '';
    const filterValues = status ? [status] : [];

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM tickets ${filter}`,
      filterValues
    );

    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT id, title, description, status, priority, created_at
       FROM tickets
       ${filter}
       ORDER BY created_at DESC, id DESC
       LIMIT $${filterValues.length + 1}
       OFFSET $${filterValues.length + 2}`,
      [...filterValues, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /tickets/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const fields = Object.keys(req.body);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid ticket ID.' });
    }

    if (
      fields.length === 0 ||
      fields.some((field) => !['status', 'priority'].includes(field))
    ) {
      return res.status(400).json({
        error: 'Provide status and/or priority only.',
      });
    }

    const { status, priority } = req.body;

    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority.' });
    }

    const updates = [];
    const values = [];

    if (status !== undefined) {
      values.push(status);
      updates.push(`status = $${values.length}`);
    }

    if (priority !== undefined) {
      values.push(priority);
      updates.push(`priority = $${values.length}`);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE tickets
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, title, description, status, priority, created_at`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
