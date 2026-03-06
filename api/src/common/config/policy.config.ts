export const getPolicyConfig = () => ({
  checkinOpenMinutes: parseInt(process.env.CHECKIN_OPEN_MINUTES || '10', 10),
  checkinCloseMinutes: parseInt(process.env.CHECKIN_CLOSE_MINUTES || '15', 10),
  lateGraceMinutes: parseInt(process.env.LATE_GRACE_MINUTES || '5', 10),
  enrollCloseMinutes: parseInt(process.env.ENROLL_CLOSE_MINUTES || '60', 10),
  jwtExpiration: process.env.JWT_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
});
