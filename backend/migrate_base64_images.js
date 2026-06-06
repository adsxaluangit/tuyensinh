const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function migrateImages() {
    const client = new Client({
        host: '127.0.0.1',
        port: 5435,
        database: 'tuyensinh_db',
        user: 'tuyensinh',
        password: 'tuyensinh_password',
    });

    try {
        await client.connect();
        
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const res = await client.query('SELECT id, front_id, back_id, electronic_id, diploma, temp_cert FROM registrations');
        
        const fields = [
            { key: 'front_id', name: 'frontId' },
            { key: 'back_id', name: 'backId' },
            { key: 'electronic_id', name: 'electronicId' },
            { key: 'diploma', name: 'diploma' },
            { key: 'temp_cert', name: 'tempCert' }
        ];

        let updatedCount = 0;

        for (const row of res.rows) {
            let updates = [];
            let values = [];
            let valIdx = 1;

            for (const field of fields) {
                const val = row[field.key];
                if (val && val.startsWith('data:image/')) {
                    // Trích xuất base64
                    const matches = val.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                        const base64Data = matches[2];
                        const buffer = Buffer.from(base64Data, 'base64');
                        
                        const fileName = `migrated_${field.name}_${row.id}_${uuidv4().substring(0,6)}.${ext}`;
                        const filePath = path.join(uploadDir, fileName);
                        
                        fs.writeFileSync(filePath, buffer);
                        
                        const newUrl = `/uploads/${fileName}`;
                        updates.push(`${field.key} = $${valIdx}`);
                        values.push(newUrl);
                        valIdx++;
                        console.log(`Đã chuyển đổi ảnh ${field.name} của HS ID ${row.id} -> ${newUrl}`);
                    }
                }
            }

            if (updates.length > 0) {
                values.push(row.id);
                const query = `UPDATE registrations SET ${updates.join(', ')} WHERE id = $${valIdx}`;
                await client.query(query, values);
                updatedCount++;
            }
        }

        console.log(`Đã xử lý xong. Chuyển đổi thành công ảnh của ${updatedCount} học sinh có ảnh dạng text Base64.`);

    } catch (err) {
        console.error('Lỗi khi migrate:', err);
    } finally {
        await client.end();
    }
}

migrateImages();
