export default {
    routes: [
      {
        method: 'POST',
        path: '/staffs/login',
        handler: 'api::staff.staff.login',
        config: {
          auth: false, // In Strapi 5, we use false to mark as public if not using the default auth
        },
      },
      // Keep other core routes (but using standard crud)
      {
        method: 'GET',
        path: '/staffs',
        handler: 'api::staff.staff.find',
      },
      {
        method: 'GET',
        path: '/staffs/:id',
        handler: 'api::staff.staff.findOne',
      },
      {
        method: 'POST',
        path: '/staffs',
        handler: 'api::staff.staff.create',
      },
      {
        method: 'PUT',
        path: '/staffs/:id',
        handler: 'api::staff.staff.update',
      },
      {
        method: 'DELETE',
        path: '/staffs/:id',
        handler: 'api::staff.staff.delete',
      },
    ],
  };
