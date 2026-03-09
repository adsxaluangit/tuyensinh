
export default async ({ strapi }) => {
    try {
        const occupations = await strapi.documents('api::occupation.occupation').findMany({
            populate: ['campus', 'educationLevel']
        });
        console.log('--- ALL OCCUPATIONS ---');
        console.log(`Total count: ${occupations.length}`);
        occupations.forEach(o => {
            console.log(`[${o.id}] Code: ${o.code}, Name: ${o.name}, Campus: ${o.campus?.name || 'N/A'}, Level: ${o.educationLevel?.name || 'N/A'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
