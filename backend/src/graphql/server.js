const { buildSchema } = require('graphql');
const { createHandler } = require('graphql-http/lib/use/express');
const { verifyToken } = require('../utils/tokens');
const userService = require('../services/user.service');
const taskService = require('../services/task.service');
const courseService = require('../services/course.service');
const { normalizeSchedules } = require('../utils/validators');
const { unauthorized } = require('../utils/errors');
const { graphqlLimiter } = require('../middleware/rateLimiter');

/**
 * GraphQL schema for tasks / courses / schedules.
 * Auth uses the same JWT as the REST API:
 *   POST /graphql   Authorization: Bearer <token>
 */
const typeDefs = /* GraphQL */ `
  type Schedule {
    id: ID!
    dayOfWeek: Int!
    dayName: String!
    startTime: String!
    endTime: String!
  }

  type Course {
    id: ID!
    name: String!
    code: String
    instructor: String
    room: String
    color: String!
    schedules: [Schedule!]!
    createdAt: String
    updatedAt: String
  }

  type Task {
    id: ID!
    title: String!
    description: String
    dueDate: String
    status: String!
    course: Course
    createdAt: String
    updatedAt: String
  }

  type User {
    id: ID!
    email: String!
    fullName: String!
    studentId: String
    schoolName: String
    avatarUrl: String
    language: String
  }

  type Stats {
    pending: Int!
    done: Int!
    courses: Int!
  }

  type Query {
    me: User!
    stats: Stats!
    tasks(status: String): [Task!]!
    task(id: ID!): Task!
    courses: [Course!]!
    course(id: ID!): Course!
  }

  input ScheduleInput {
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
  }

  input TaskInput {
    title: String!
    description: String
    dueDate: String
    status: String
    courseId: ID
  }

  input CourseInput {
    name: String!
    code: String
    instructor: String
    room: String
    color: String
    schedules: [ScheduleInput!]
  }

  type Mutation {
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    createCourse(input: CourseInput!): Course!
    updateCourse(id: ID!, input: CourseInput!): Course!
    deleteCourse(id: ID!): Boolean!
    updateProfile(fullName: String, schoolName: String, language: String): User!
  }
`;

/** camelCase → snake_case for the schedule rows the services expect. */
const toSnakeSchedules = (schedules) =>
  (schedules || []).map((s) => ({ day_of_week: s.dayOfWeek, start_time: s.startTime, end_time: s.endTime }));

const requireUser = (ctx) => {
  if (!ctx?.user) throw unauthorized('Sign in to use the Campus OS API.');
  return ctx.user;
};

const rootValue = {
  // ── Queries ─────────────────────────────────────────────
  me: (args, ctx) => requireUser(ctx),
  stats: (args, ctx) => userService.getStats(requireUser(ctx).id),
  tasks: (args, ctx) => taskService.list(requireUser(ctx).id, { status: args.status }),
  task: (args, ctx) => taskService.get(requireUser(ctx).id, args.id),
  courses: (args, ctx) => courseService.list(requireUser(ctx).id),
  course: (args, ctx) => courseService.get(requireUser(ctx).id, args.id),

  // ── Mutations ───────────────────────────────────────────
  createTask: ({ input }, ctx) => taskService.create(requireUser(ctx).id, input),
  updateTask: ({ id, input }, ctx) => taskService.update(requireUser(ctx).id, id, input),
  deleteTask: async ({ id }, ctx) => {
    await taskService.remove(requireUser(ctx).id, id);
    return true;
  },
  createCourse: ({ input }, ctx) =>
    courseService.create(requireUser(ctx).id, { ...input, schedules: normalizeSchedules(toSnakeSchedules(input.schedules)) }),
  updateCourse: ({ id, input }, ctx) =>
    courseService.update(requireUser(ctx).id, id, {
      ...input,
      schedules: input.schedules === undefined ? undefined : normalizeSchedules(toSnakeSchedules(input.schedules)),
    }),
  deleteCourse: async ({ id }, ctx) => {
    await courseService.remove(requireUser(ctx).id, id);
    return true;
  },
  updateProfile: (args, ctx) => userService.updateProfile(requireUser(ctx).id, args),
};

const schema = buildSchema(typeDefs);

/** Extracts the Bearer token and resolves the user for the request context. */
async function buildContext(req) {
  const header = req?.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { user: null };

  try {
    const payload = verifyToken(token);
    return { user: await userService.findPublicById(payload.sub) };
  } catch (error) {
    return { user: null };
  }
}

const graphqlHandler = createHandler({
  schema,
  rootValue,
  context: buildContext,
  formatError: (error) => {
    if (process.env.NODE_ENV !== 'production') return error;
    return new Error('Something went wrong while handling that request.');
  },
});

module.exports = { graphqlHandler: [graphqlLimiter, graphqlHandler], schema, rootValue };
