export default {
  routes: [
    // Core CRUD routes
    {
      method: 'GET',
      path: '/registrations',
      handler: 'api::registration.registration.find',
    },
    {
      method: 'GET',
      path: '/registrations/:id',
      handler: 'api::registration.registration.findOne',
    },
    {
      method: 'POST',
      path: '/registrations',
      handler: 'api::registration.registration.create',
    },
    {
      method: 'PUT',
      path: '/registrations/:id',
      handler: 'api::registration.registration.update',
    },
    {
      method: 'DELETE',
      path: '/registrations/:id',
      handler: 'api::registration.registration.delete',
    },
    // Custom: Gửi email hàng loạt giấy trúng tuyển
    {
      method: 'POST',
      path: '/registrations/send-bulk-email',
      handler: 'api::registration.registration.sendBulkEmail',
      config: {
        auth: false,
      },
    },
  ],
};
