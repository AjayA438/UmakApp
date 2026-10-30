const { Router } = require('express');

const courseService = require('../services/course.service');
const { authenticate } = require('../middleware/auth');
const { normalizeSchedules } = require('../utils/validators');

const router = Router();

router.use(authenticate);

/** GET /api/courses — includes each course's weekly schedule. */
router.get('/', async (req, res, next) => {
  try {
    res.json({ success: true, courses: await courseService.list(req.user.id) });
  } catch (error) {
    next(error);
  }
});

/** GET /api/courses/:id */
router.get('/:id', async (req, res, next) => {
  try {
    res.json({ success: true, course: await courseService.get(req.user.id, req.params.id) });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/courses
 * Body: { name, code?, instructor?, room?, color?, schedules?: [{ dayOfWeek, startTime, endTime }] }
 * The client sends camelCase; schedules are normalised before hitting Postgres.
 */
router.post('/', async (req, res, next) => {
  try {
    const body = { ...req.body, schedules: normalizeSchedules(toSnakeSchedules(req.body?.schedules)) };
    const course = await courseService.create(req.user.id, body);
    res.status(201).json({ success: true, message: 'Course added.', course });
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/courses/:id — schedules (when provided) replace the existing list. */
router.patch('/:id', async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.schedules !== undefined) body.schedules = normalizeSchedules(toSnakeSchedules(body.schedules));
    const course = await courseService.update(req.user.id, req.params.id, body);
    res.json({ success: true, message: 'Course updated.', course });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/courses/:id — schedules cascade. */
router.delete('/:id', async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Course deleted.', ...(await courseService.remove(req.user.id, req.params.id)) });
  } catch (error) {
    next(error);
  }
});

/** Accepts both {dayOfWeek,startTime,endTime} and {day_of_week,start_time,end_time}. */
function toSnakeSchedules(schedules) {
  if (!Array.isArray(schedules)) return schedules;
  return schedules.map((s) => ({
    day_of_week: s.day_of_week ?? s.dayOfWeek,
    start_time: s.start_time ?? s.startTime,
    end_time: s.end_time ?? s.endTime,
  }));
}

module.exports = router;
