import { factories } from '@strapi/strapi';
import bcrypt from 'bcryptjs';

export default factories.createCoreController('api::staff.staff', ({ strapi }) => ({
  async login(ctx) {
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      return ctx.badRequest('Username and password are required');
    }

    try {
      const staff = await strapi.db.query('api::staff.staff').findOne({
        where: { username, status: 'Hoạt động' },
      });

      if (!staff) {
        return ctx.unauthorized('Invalid username or password');
      }

      // Check password hash
      const isMatch = await bcrypt.compare(password, staff.password);
      if (!isMatch) {
         // Fallback for current plain text passwords if we just migrated
         if (staff.password === password) {
            // Self-correction for plain text passwords - we'll hash them next time or now.
            return { data: staff };
         }
         return ctx.unauthorized('Invalid username or password');
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = staff;
      return { data: userWithoutPassword };
    } catch (error) {
      return ctx.internalServerError('An error occurred during login');
    }
  },
}));
