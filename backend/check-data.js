
export default async ({ strapi }) => {
    try {
        const levels = await strapi.documents('api::education-level.education-level').findMany();
        console.log('--- EDUCATION LEVEL DATA ---');
        levels.forEach(l => {
            console.log(`ID: ${l.id}, Name: ${l.name}, Code: ${l.code}, Description: ${l.description}`);
        });

        const campuses = await strapi.documents('api::campus.campus').findMany();
        console.log('--- CAMPUS DATA ---');
        campuses.forEach(c => {
            console.log(`ID: ${c.id}, Name: ${c.name}, Code: ${c.code}, Address: ${c.address}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
