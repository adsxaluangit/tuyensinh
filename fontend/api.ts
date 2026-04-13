
const STRAPI_URL = (import.meta.env.PROD && !window.location.hostname.includes('localhost')) 
    ? '' 
    : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

const fetchAPI = async (path: string, options?: RequestInit) => {
    // Ensure path doesn't have a leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // If STRAPI_URL is empty (production), use a relative path without a leading slash
    // If it's not empty, combine with a slash
    const url = STRAPI_URL ? `${STRAPI_URL}/${cleanPath}` : cleanPath;
    
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!response.ok) {
        let errorMessage = 'API Error';
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                errorMessage = error?.error?.message || errorMessage;
            } else {
                const text = await response.text();
                errorMessage = `Server Error: ${response.status} ${response.statusText}. ${text.slice(0, 100)}...`;
            }
        } catch (e) {
            errorMessage = `Network or Parsing Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    if (response.status === 204) return null;
    return await response.json();
};

export const fetchCampuses = async () => {
    const data = await fetchAPI('/api/campuses?pagination[pageSize]=1000');
    return data.data;
};

export const createCampus = async (campusData: any) => {
    return await fetchAPI('/api/campuses', {
        method: 'POST',
        body: JSON.stringify({ data: campusData }),
    });
};

export const updateCampus = async (documentId: string, campusData: any) => {
    return await fetchAPI(`/api/campuses/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: campusData }),
    });
};

export const deleteCampus = async (documentId: string) => {
    return await fetchAPI(`/api/campuses/${documentId}`, {
        method: 'DELETE',
    });
};

export const fetchEducationLevels = async () => {
    const data = await fetchAPI('/api/education-levels?pagination[pageSize]=1000');
    return data.data;
};

export const createEducationLevel = async (levelData: any) => {
    return await fetchAPI('/api/education-levels', {
        method: 'POST',
        body: JSON.stringify({ data: levelData }),
    });
};

export const updateEducationLevel = async (documentId: string, levelData: any) => {
    return await fetchAPI(`/api/education-levels/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: levelData }),
    });
};

export const deleteEducationLevel = async (documentId: string) => {
    return await fetchAPI(`/api/education-levels/${documentId}`, {
        method: 'DELETE',
    });
};

export const fetchOccupations = async (campusName?: string, levelName?: string) => {
    let baseUrl = `/api/occupations?populate=*&pagination[pageSize]=500&sort[0]=id:desc`;
    if (campusName) baseUrl += `&filters[campus][name][$eq]=${campusName}`;
    if (levelName) baseUrl += `&filters[educationLevel][name][$eq]=${levelName}`;

    // Lấy trang đầu để biết tổng số
    const firstPage = await fetchAPI(baseUrl + `&pagination[page]=1`);
    const allData = [...firstPage.data];

    const total = firstPage.meta?.pagination?.total || 0;
    const pageSize = firstPage.meta?.pagination?.pageSize || 500;
    const totalPages = Math.ceil(total / pageSize);

    // Lấy các trang còn lại nếu có
    if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
            promises.push(fetchAPI(baseUrl + `&pagination[page]=${page}`));
        }
        const results = await Promise.all(promises);
        results.forEach(r => allData.push(...r.data));
    }

    return allData;
};

export const createOccupation = async (occupationData: any) => {
    return await fetchAPI('/api/occupations', {
        method: 'POST',
        body: JSON.stringify({ data: occupationData }),
    });
};

export const updateOccupation = async (documentId: string, occupationData: any) => {
    return await fetchAPI('api/occupations/' + documentId, {
        method: 'PUT',
        body: JSON.stringify({ data: occupationData }),
    });
};

export const deleteOccupation = async (documentId: string) => {
    return await fetchAPI('api/occupations/' + documentId, {
        method: 'DELETE',
    });
};

export const submitRegistration = async (formData: any) => {
    return await fetchAPI('api/registrations', {
        method: 'POST',
        body: JSON.stringify({ data: formData }),
    });
};

export const updateRegistration = async (documentId: string, formData: any) => {
    return await fetchAPI('api/registrations/' + documentId, {
        method: 'PUT',
        body: JSON.stringify({ data: formData }),
    });
};

export const findRegistrationByCCCD = async (cccd: string) => {
    const data = await fetchAPI(`api/registrations?filters[idNumber][$eq]=${cccd}&populate=*`);
    return data && data.data ? data.data[0] : null;
};

export const fetchAllRegistrations = async (params: { 
    page?: number, 
    pageSize?: number, 
    searchTerm?: string,
    campus?: string,
    level?: string,
    major?: string
} = {}) => {
    const { page = 1, pageSize = 25, searchTerm, campus, level, major } = params;
    
    // Base URL with essential fields only (avoiding large base64 strings in list view)
    let url = `api/registrations?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort[0]=createdAt:desc`;
    
    // Fetch all scalar fields but exclude large base64 strings (frontId, backId, diploma, tempCert)
    const fieldNames = [
        'fullName', 'dob', 'pob', 'gender', 'ethnicity', 'idNumber', 'issueDate', 'issuePlace',
        'phone', 'email', 'addressDetails', 'province', 'district',
        'parentName', 'parentPhone', 
        'choice1Major', 'choice1Specialty', 'choice2Major', 'choice2Specialty',
        'gradSchool', 'gradYear', 'diplomaNumber', 'grades',
        'recipient', 'deliveryAddress', 'deliveryAddressDetails',
        'status', 'tuitionStatus', 'tuitionAmount', 'healthAmount', 'comprehensiveAmount', 'uniformAmount', 
        'tuitionPaidAmount', 'isHealthSelected', 'isComprehensiveSelected', 'isUniformSelected', 
        'docSeq', 'paymentMethod', 'collectorAccount', 'collectedDate', 'createdAt'
    ];
    url += fieldNames.map((f, i) => `&fields[${i}]=${f}`).join('') + '&populate[campus][fields][0]=name&populate[educationLevel][fields][0]=name';

    if (searchTerm) {
        url += `&filters[$or][0][fullName][$contains]=${searchTerm}&filters[$or][1][phone][$contains]=${searchTerm}&filters[$or][2][idNumber][$contains]=${searchTerm}`;
    }
    if (campus) url += `&filters[campus][name][$eq]=${campus}`;
    if (level) url += `&filters[educationLevel][name][$eq]=${level}`;
    if (major) url += `&filters[choice1Major][$eq]=${major}`;

    return await fetchAPI(url);
};

export const fetchAllApprovedRegistrations = async (params: { 
    page?: number, 
    pageSize?: number, 
    searchTerm?: string 
} = {}) => {
    const { page = 1, pageSize = 25, searchTerm } = params;
    const fieldNames = [
        'fullName', 'dob', 'pob', 'gender', 'ethnicity', 'idNumber', 'issueDate', 'issuePlace',
        'phone', 'email', 'addressDetails', 'province', 'district',
        'parentName', 'parentPhone', 
        'choice1Major', 'choice1Specialty', 'choice2Major', 'choice2Specialty',
        'gradSchool', 'gradYear', 'diplomaNumber',
        'recipient', 'deliveryAddress', 'deliveryAddressDetails',
        'status', 'tuitionStatus', 'tuitionAmount', 'healthAmount', 'comprehensiveAmount', 'uniformAmount', 
        'tuitionPaidAmount', 'isHealthSelected', 'isComprehensiveSelected', 'isUniformSelected', 
        'docSeq', 'paymentMethod', 'collectorAccount', 'collectedDate', 'createdAt'
    ];
    const fieldStr = fieldNames.map((f, i) => `&fields[${i}]=${f}`).join('') +
        '&populate[campus][fields][0]=name&populate[educationLevel][fields][0]=name';

    let baseUrl = `api/registrations?pagination[page]=${page}&pagination[pageSize]=${pageSize}&filters[status][$eq]=Trúng tuyển&sort[0]=createdAt:desc${fieldStr}`;

    if (searchTerm) {
        baseUrl += `&filters[$or][0][fullName][$contains]=${searchTerm}&filters[$or][1][phone][$contains]=${searchTerm}&filters[$or][2][idNumber][$contains]=${searchTerm}`;
    }

    return await fetchAPI(baseUrl);
};


export const getRegistrationById = async (documentId: string) => {
    return await fetchAPI(`/api/registrations/${documentId}?populate=*`);
};

export const deleteRegistration = async (documentId: string) => {
    return await fetchAPI(`/api/registrations/${documentId}`, {
        method: 'DELETE',
    });
};

// Health Insurance
export const fetchHealthInsurances = async () => {
    const data = await fetchAPI('/api/health-insurances?pagination[pageSize]=1000');
    return data.data;
};

export const createHealthInsurance = async (data: any) => {
    return await fetchAPI('/api/health-insurances', {
        method: 'POST',
        body: JSON.stringify({ data }),
    });
};

export const updateHealthInsurance = async (documentId: string, data: any) => {
    return await fetchAPI(`/api/health-insurances/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
    });
};

export const deleteHealthInsurance = async (documentId: string) => {
    return await fetchAPI(`/api/health-insurances/${documentId}`, {
        method: 'DELETE',
    });
};

// Comprehensive Insurance
export const fetchComprehensiveInsurances = async () => {
    const data = await fetchAPI('/api/comprehensive-insurances?pagination[pageSize]=1000');
    return data.data;
};

export const createComprehensiveInsurance = async (data: any) => {
    return await fetchAPI('/api/comprehensive-insurances', {
        method: 'POST',
        body: JSON.stringify({ data }),
    });
};

export const updateComprehensiveInsurance = async (documentId: string, data: any) => {
    return await fetchAPI(`/api/comprehensive-insurances/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
    });
};

export const deleteComprehensiveInsurance = async (documentId: string) => {
    return await fetchAPI(`/api/comprehensive-insurances/${documentId}`, {
        method: 'DELETE',
    });
};

// Uniform
export const fetchUniforms = async () => {
    const data = await fetchAPI('/api/uniforms?pagination[pageSize]=1000');
    return data.data;
};

export const createUniform = async (data: any) => {
    return await fetchAPI('/api/uniforms', {
        method: 'POST',
        body: JSON.stringify({ data }),
    });
};

export const updateUniform = async (documentId: string, data: any) => {
    return await fetchAPI(`/api/uniforms/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
    });
};

export const deleteUniform = async (documentId: string) => {
    return await fetchAPI(`/api/uniforms/${documentId}`, {
        method: 'DELETE',
    });
};

// Staff
export const loginStaff = async (username: string, password: string) => {
    return await fetchAPI('/api/staffs/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
};

export const fetchStaffs = async () => {
    const data = await fetchAPI('/api/staffs?pagination[pageSize]=1000');
    return data.data;
};

export const createStaff = async (data: any) => {
    return await fetchAPI('/api/staffs', {
        method: 'POST',
        body: JSON.stringify({ data }),
    });
};

export const updateStaff = async (documentId: string, data: any) => {
    return await fetchAPI(`/api/staffs/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
    });
};

export const deleteStaff = async (documentId: string) => {
    return await fetchAPI(`/api/staffs/${documentId}`, {
        method: 'DELETE',
    });
};

// Admission Template
export const fetchAdmissionTemplates = async () => {
    const data = await fetchAPI('/api/admission-templates?pagination[pageSize]=1000');
    return data.data;
};

export const createAdmissionTemplate = async (data: any) => {
    return await fetchAPI('/api/admission-templates', {
        method: 'POST',
        body: JSON.stringify({ data }),
    });
};

export const updateAdmissionTemplate = async (documentId: string, data: any) => {
    return await fetchAPI(`/api/admission-templates/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
    });
};

// System Settings
export const fetchSystemSettings = async () => {
    const data = await fetchAPI('/api/system-settings?pagination[pageSize]=1000');
    return data.data;
};

export const updateSystemSetting = async (documentId: string, data: any) => {
    return await fetchAPI(`/api/system-settings/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
    });
};

export const createSystemSetting = async (data: any) => {
    return await fetchAPI('/api/system-settings', {
        method: 'POST',
        body: JSON.stringify({ data }),
    });
};
