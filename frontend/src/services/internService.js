import api from './api';

const internService = {
  getAll: (params) => api.get('/interns', { params }),
  getOne: (id) => api.get(`/interns/${id}`),
  getProfile: (id) => api.get(`/interns/${id}/profile`),
  create: (data) => api.post('/interns', data),
  update: (id, data) => api.put(`/interns/${id}`, data),
  delete: (id) => api.delete(`/interns/${id}`),
  toggleStatus: (id) => api.patch(`/interns/${id}/status`),
};

export default internService;