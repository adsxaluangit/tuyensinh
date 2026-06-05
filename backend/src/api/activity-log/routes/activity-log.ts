export default {
  routes: [
    {
      method: 'POST',
      path: '/activity-logs',
      handler: 'api::activity-log.activity-log.create',
      config: { auth: false }, // Frontend ghi log không cần auth
    },
    {
      method: 'GET',
      path: '/activity-logs',
      handler: 'api::activity-log.activity-log.find',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/activity-logs/:id',
      handler: 'api::activity-log.activity-log.delete',
      config: { auth: false },
    },
  ],
};
