const { Router } = require('express');

const taskService = require('../services/task.service');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/** GET /api/tasks?status=pending|done */
router.get('/', async (req, res, next) => {
  try {
    const tasks = await taskService.list(req.user.id, { status: req.query.status });
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
});

/** GET /api/tasks/:id */
router.get('/:id', async (req, res, next) => {
  try {
    res.json({ success: true, task: await taskService.get(req.user.id, req.params.id) });
  } catch (error) {
    next(error);
  }
});

/** POST /api/tasks — { title, description?, dueDate?, status?, courseId? } */
router.post('/', async (req, res, next) => {
  try {
    const task = await taskService.create(req.user.id, req.body || {});
    res.status(201).json({ success: true, message: 'Task added.', task });
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/tasks/:id — partial update */
router.patch('/:id', async (req, res, next) => {
  try {
    const task = await taskService.update(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, message: 'Task updated.', task });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/tasks/:id */
router.delete('/:id', async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Task deleted.', ...(await taskService.remove(req.user.id, req.params.id)) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
