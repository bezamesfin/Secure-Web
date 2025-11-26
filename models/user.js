const orders = [
  { id: 1, userId: 3, item: "Laptop" },
  { id: 2, userId: 3, item: "Phone" },
  { id: 3, userId: 2, item: "Tablet" }
];

module.exports = {
  findAll: () => orders,
  findById: (id) => orders.find(o => o.id == id)
};