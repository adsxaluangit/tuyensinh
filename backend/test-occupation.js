const http = require('http');

const get = (path) => new Promise((resolve, reject) => {
  const options = {
    hostname: 'localhost', port: 1338, path, method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
      catch(e) { resolve({ status: res.statusCode, body: data }); }
    });
  });
  req.on('error', reject);
  req.end();
});

const post = (path, payload) => new Promise((resolve, reject) => {
  const body = JSON.stringify(payload);
  const options = {
    hostname: 'localhost', port: 1338, path, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  };
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
      catch(e) { resolve({ status: res.statusCode, body: data }); }
    });
  });
  req.on('error', reject);
  req.write(body);
  req.end();
});

async function test() {
  const campuses = await get('/api/campuses?pagination[pageSize]=100');
  const campusItem = campuses.body?.data?.[0];
  // Try numeric id instead of documentId
  const campusId = campusItem?.id;
  const campusDocId = campusItem?.documentId;
  console.log('Campus numeric id:', campusId, 'documentId:', campusDocId);

  const levels = await get('/api/education-levels?pagination[pageSize]=100');
  const levelItem = levels.body?.data?.[0];
  const levelId = levelItem?.id;
  console.log('Level numeric id:', levelId, 'documentId:', levelItem?.documentId);

  console.log('\n--- Test with NUMERIC id ---');
  const r1 = await post('/api/occupations', {
    data: { code: 'TEST001', name: 'Test1', amount: 10000000, campus: campusId, educationLevel: levelId }
  });
  console.log('Status:', r1.status, '| Response:', JSON.stringify(r1.body?.error || r1.body?.data?.id || 'OK'));

  if (r1.status === 200 || r1.status === 201) {
    const delId = r1.body?.data?.documentId || r1.body?.data?.id;
    console.log('Success! Created with id:', delId);
  } else {
    console.log('\n--- Test with connect syntax ---');
    const r2 = await post('/api/occupations', {
      data: {
        code: 'TEST002', name: 'Test2', amount: 10000000,
        campus: { connect: [campusDocId] },
        educationLevel: { connect: [levelItem?.documentId] }
      }
    });
    console.log('Status:', r2.status, '| Response:', JSON.stringify(r2.body?.error || r2.body?.data?.id || 'OK'));
  }
}

test().catch(console.error);
