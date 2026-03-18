
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

      // Bulk publish existing draft registrations in background
      setTimeout(async () => {
        try {
          const drafts = await strapi.documents('api::registration.registration').findMany({
            status: 'draft',
            fields: ['id'],
          });

          if (drafts.length > 0) {
            console.log(`[Background] Đang tự động xuất bản ${drafts.length} hồ sơ nháp...`);
            for (const draft of drafts) {
              await strapi.documents('api::registration.registration').publish({
                documentId: draft.documentId,
              });
              // Small pause to avoid overwhelming the system
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            console.log('[Background] Xuất bản thành công!');
          }
        } catch (err) {
          console.error('[Background] Lỗi xuất bản hồ sơ:', err);
        }
      }, 5000);

    } catch (error) {
      console.error('Lỗi bootstrap:', error);
    }
  },
};
