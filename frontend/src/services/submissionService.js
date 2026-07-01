import api from './api';

const submissionService = {
  getAll: (params) => api.get('/submissions', { params }),
  getOne: (id) => api.get(`/submissions/${id}`),
  create: (formData) => api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  review: (id, data) => api.post(`/submissions/${id}/review`, data),
  // Auth here is a Bearer token (not a cookie), so a plain <a href> can't
  // carry it — fetch as a blob through axios instead and trigger the save.
  download: async (id, fileId, fileName) => {
    const res = await api.get(`/submissions/${id}/files/${fileId}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default submissionService;
