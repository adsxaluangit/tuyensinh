
export default {
  register() { },

  async bootstrap({ strapi }: { strapi: any }) {
    console.log('Hệ thống đang kiểm tra và cấp quyền truy cập Public cho các API...');

    try {
      const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
        populate: ['permissions'],
      });

      if (publicRole) {
        const apis = [
          'health-insurance',
          'comprehensive-insurance',
          'uniform',
          'registration',
          'campus',
          'education-level',
          'occupation',
          'staff',
          'admission-template',
          'system-setting'
        ];

        const actions = ['find', 'findOne', 'create', 'update', 'delete'];

        for (const api of apis) {
          for (const action of actions) {
            const apiUid = `api::${api}.${api}`;
            const permissionAction = `${apiUid}.${action}`;

            const hasPermission = publicRole.permissions.some(p => p.action === permissionAction);
            if (!hasPermission) {
              await strapi.query('plugin::users-permissions.permission').create({
                data: {
                  action: permissionAction,
                  role: publicRole.id,
                },
              });
            }
          }
        }
        console.log('Cấp quyền thành công!');
      }
    } catch (error) {
      console.error('Lỗi cấp quyền bootstrap:', error);
    }
  },
};
