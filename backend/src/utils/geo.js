const SINES_LAT = 33.646115;
const SINES_LNG = 72.997455;
const MAX_DISTANCE_METERS = 80;

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isWithinSines = (lat, lng) => {
  const distance = haversineDistance(lat, lng, SINES_LAT, SINES_LNG);
  return { valid: distance <= MAX_DISTANCE_METERS, distance: Math.round(distance) };
};

module.exports = { isWithinSines, SINES_LAT, SINES_LNG, MAX_DISTANCE_METERS };