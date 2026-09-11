/**
 * Course Service
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const db = require('../config/db');

class CourseService {
  async getAllCourses(filters = {}) {
    let query = `
      SELECT c.id, c.title, c.description, c.category, c.level, c.trainer_id, c.is_published,
             c.created_at, c.updated_at,
             u.name as trainer_name
      FROM courses c
      LEFT JOIN users u ON c.trainer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.category) {
      params.push(filters.category);
      query += ` AND c.category = $${params.length}`;
    }

    if (filters.level) {
      params.push(filters.level);
      query += ` AND c.level = $${params.length}`;
    }

    if (filters.trainerId) {
      params.push(filters.trainerId);
      query += ` AND c.trainer_id = $${params.length}`;
    }

    query += ' ORDER BY c.created_at DESC';

    const res = await db.query(query, params);
    const courses = res.rows;

    // Attach counts
    const moduleCountsRes = await db.query('SELECT course_id, COUNT(*) as count FROM modules GROUP BY course_id');
    const enrollmentCountsRes = await db.query('SELECT course_id, COUNT(*) as count FROM enrollments GROUP BY course_id');

    const modMap = {};
    moduleCountsRes.rows.forEach(r => { modMap[r.course_id] = parseInt(r.count, 10); });
    const enrollMap = {};
    enrollmentCountsRes.rows.forEach(r => { enrollMap[r.course_id] = parseInt(r.count, 10); });

    return courses.map(c => ({
      ...c,
      module_count: modMap[c.id] || 0,
      enrollment_count: enrollMap[c.id] || 0
    }));
  }

  async getCourseById(courseId) {
    const courseRes = await db.query(`
      SELECT c.id, c.title, c.description, c.category, c.level, c.trainer_id, c.is_published,
             c.created_at, c.updated_at,
             u.name as trainer_name, u.email as trainer_email, u.bio as trainer_bio
      FROM courses c
      LEFT JOIN users u ON c.trainer_id = u.id
      WHERE c.id = $1
    `, [courseId]);

    if (courseRes.rows.length === 0) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    const course = courseRes.rows[0];

    // Fetch modules with their contents
    const modulesRes = await db.query(`
      SELECT id, title, description, order_index
      FROM modules
      WHERE course_id = $1
      ORDER BY order_index ASC
    `, [courseId]);

    const moduleIds = modulesRes.rows.map(m => parseInt(m.id, 10));
    let contents = [];
    if (moduleIds.length > 0) {
      const placeholders = moduleIds.map((_, i) => `$${i + 1}`).join(', ');
      const contentsRes = await db.query(`
        SELECT id, module_id, title, content_type, content_url, content_data, order_index
        FROM module_contents
        WHERE module_id IN (${placeholders})
        ORDER BY order_index ASC
      `, moduleIds);
      contents = contentsRes.rows;
    }

    // Attach contents to modules
    course.modules = modulesRes.rows.map(m => ({
      ...m,
      contents: contents.filter(c => c.module_id === m.id)
    }));

    // Fetch mapped competencies
    const compRes = await db.query(`
      SELECT cc.id, cc.competency_id, cc.required_level, comp.name, comp.description, comp.category
      FROM course_competencies cc
      JOIN competencies comp ON cc.competency_id = comp.id
      WHERE cc.course_id = $1
    `, [courseId]);

    course.competencies = compRes.rows;

    return course;
  }

  async createCourse({ title, description, category, level = 'BEGINNER', trainerId, isPublished = true }) {
    if (!title || !category) {
      const error = new Error('Title and category are required');
      error.statusCode = 400;
      throw error;
    }

    const res = await db.query(`
      INSERT INTO courses (title, description, category, level, trainer_id, is_published)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title.trim(), description, category.trim(), level, trainerId, isPublished]);

    return res.rows[0];
  }

  async updateCourse(courseId, updates, userId, userRole) {
    const existing = await db.query('SELECT trainer_id FROM courses WHERE id = $1', [courseId]);
    if (existing.rows.length === 0) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && existing.rows[0].trainer_id !== userId) {
      const error = new Error('Forbidden: You can only edit your own courses');
      error.statusCode = 403;
      throw error;
    }

    const { title, description, category, level, is_published } = updates;

    const res = await db.query(`
      UPDATE courses
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          level = COALESCE($4, level),
          is_published = COALESCE($5, is_published),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [title, description, category, level, is_published, courseId]);

    return res.rows[0];
  }

  async deleteCourse(courseId, userId, userRole) {
    const existing = await db.query('SELECT trainer_id FROM courses WHERE id = $1', [courseId]);
    if (existing.rows.length === 0) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && existing.rows[0].trainer_id !== userId) {
      const error = new Error('Forbidden: You can only delete your own courses');
      error.statusCode = 403;
      throw error;
    }

    await db.query('DELETE FROM courses WHERE id = $1', [courseId]);
    return { success: true, message: 'Course deleted successfully' };
  }
}

module.exports = new CourseService();
