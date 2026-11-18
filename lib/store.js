// 데모용 인메모리 저장소. 실서비스는 DB(예: Prisma + Postgres)로 교체 필요.
const users = new Map();
const orderToUser = new Map(); // orderId -> userId 매핑

// 데모 유저 기본 데이터
users.set('demo-user', {
  premium: false,
  email: process.env.DEMO_NOTIFY_EMAIL || 'student@univ.ac.kr',
  events: [
    { courseName: '디지털신호처리', title: '중간고사', dueDate: '2026-11-20' },
    { courseName: '디지털신호처리', title: '과제 2 제출', dueDate: '2026-11-25' },
  ],
});

function getUser(userId) {
  if (!users.has(userId)) {
    users.set(userId, { premium: false, email: '', events: [] });
  }
  return users.get(userId);
}

function setPremium(userId, value) {
  const u = getUser(userId);
  u.premium = value;
  return u;
}

function linkOrder(orderId, userId) {
  orderToUser.set(orderId, userId);
}

function getUserIdByOrder(orderId) {
  return orderToUser.get(orderId) || 'demo-user'; // 못 찾으면 데모 유저로 폴백
}

export { users, orderToUser, getUser, setPremium, linkOrder, getUserIdByOrder };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { users, orderToUser, getUser, setPremium, linkOrder, getUserIdByOrder };
}
