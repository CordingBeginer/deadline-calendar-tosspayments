// lib/store.js
// 데모용 인메모리 저장소. 실서비스는 DB(예: Prisma + Postgres)로 교체 필요.
const users = new Map(); // userId -> { premium: boolean, email: string, events: [] }
const orderToUser = new Map(); // orderId -> userId 매핑 (취소 웹훅이 왔을 때 어느 유저인지 찾기 위함)

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

// 결제 승인 성공 시점에 주문번호 <-> 유저를 연결해둔다.
function linkOrder(orderId, userId) {
  orderToUser.set(orderId, userId);
}

// 웹훅(취소 등)이 왔을 때 주문번호로 유저를 찾는다. 못 찾으면 데모 유저로 폴백.
function getUserIdByOrder(orderId) {
  return orderToUser.get(orderId) || 'demo-user';
}

export { users, orderToUser, getUser, setPremium, linkOrder, getUserIdByOrder };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { users, getUser, setPremium, linkOrder, getUserIdByOrder };
}
