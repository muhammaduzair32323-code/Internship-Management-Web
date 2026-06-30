import api from './api';

const internPortalService = {
  getMe: () => api.get('/intern/me'),
  completeTask: (taskId) => api.patch(`/intern/tasks/${taskId}/complete`),
  getFaceStatus: () => api.get('/intern/face/status'),
  setupFace: (descriptor) => api.post('/intern/face/setup', { descriptor }),
  checkInSelf: (descriptor, latitude, longitude) =>
    api.post('/intern/attendance/check-in', { descriptor, latitude, longitude }),
  checkOutSelf: (descriptor, latitude, longitude) =>
    api.post('/intern/attendance/check-out', { descriptor, latitude, longitude }),
};

export default internPortalService;