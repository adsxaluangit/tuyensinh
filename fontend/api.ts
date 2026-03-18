
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

const fetchAPI = async (path: string, options?: RequestInit) => {
    const response = await fetch(`${STRAPI_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error?.message || 'API Error');
    }
    if (response.status === 204) return null;
    return await response.json();
};

export const fetchCampuses = async () => {
    const data = await fetchAPI('/api/campuses');
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
    const data = await fetchAPI('/api/education-levels');
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
    let url = `/api/occupations?populate=*&pagination[pageSize]=1000&sort[0]=id:desc`;
    if (campusName) url += `&filters[campus][name][$eq]=${campusName}`;
    if (levelName) url += `&filters[educationLevel][name][$eq]=${levelName}`;

    const data = await fetchAPI(url);
    return data.data;
};

export const createOccupation = async (occupationData: any) => {
    return await fetchAPI('/api/occupations', {
        method: 'POST',
        body: JSON.stringify({ data: occupationData }),
    });
};

export const updateOccupation = async (documentId: string, occupationData: any) => {
    return await fetchAPI(`/api/occupations/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: occupationData }),
    });
};

export const deleteOccupation = async (documentId: string) => {
    return await fetchAPI(`/api/occupations/${documentId}`, {
        method: 'DELETE',
    });
};

export const submitRegistration = async (formData: any) => {
    return await fetchAPI('/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ data: formData }),
    });
};

export const updateRegistration = async (documentId: string, formData: any) => {
    return await fetchAPI(`/api/registrations/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: formData }),
    });
};

export const findRegistrationByCCCD = async (cccd: string) => {
    const data = await fetchAPI(`/api/registrations?filters[idNumber][$eq]=${cccd}&populate=*`);
    return data.data[0];
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
    let url = `/api/registrations?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort[0]=createdAt:desc`;
    
    // Limit fields for list view performance
    url += `&fields[0]=fullName&fields[1]=dob&fields[2]=gender&fields[3]=idNumber&fields[4]=phone&fields[5]=email&fields[6]=campus&fields[7]=educationLevel&fields[8]=choice1Major&fields[9]=choice1Specialty&fields[10]=status&fields[11]=tuitionStatus&fields[12]=tuitionAmount&fields[13]=tuitionPaidAmount&fields[14]=submissionDate`;

    if (searchTerm) {
        url += `&filters[$or][0][fullName][$contains]=${searchTerm}&filters[$or][1][phone][$contains]=${searchTerm}&filters[$or][2][idNumber][$contains]=${searchTerm}`;
    }
    if (campus) url += `&filters[campus][name][$eq]=${campus}`;
    if (level) url += `&filters[educationLevel][name][$eq]=${level}`;
    if (major) url += `&filters[choice1Major][$eq]=${major}`;

    return await fetchAPI(url);
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
    const data = await fetchAPI('/api/health-insurances');
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
    const data = await fetchAPI('/api/comprehensive-insurances');
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
    const data = await fetchAPI('/api/uniforms');
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
export const fetchStaffs = async () => {
    const data = await fetchAPI('/api/staffs');
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
    const data = await fetchAPI('/api/admission-templates');
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
    const data = await fetchAPI('/api/system-settings');
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
