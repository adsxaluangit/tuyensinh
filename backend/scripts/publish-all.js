
const publishAll = async () => {
  try {
    const registrations = await strapi.documents('api::registration.registration').findMany({
      status: 'draft',
      limit: -1,
    });

    console.log(`Found ${registrations.length} draft registrations. Publishing...`);

    for (const reg of registrations) {
      await strapi.documents('api::registration.registration').publish({
        documentId: reg.documentId,
      });
      console.log(`Published: ${reg.idNumber} - ${reg.fullName}`);
    }

    console.log('All registrations published successfully.');
  } catch (error) {
    console.error('Error during bulk publishing:', error);
  }
};

module.exports = publishAll;
