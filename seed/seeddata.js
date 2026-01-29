const seedDatabase = async () => {
  await Worker.deleteMany({});
  await Station.deleteMany({});
  
  const workers = [
    { id: 'W1', name: 'Alice' }, { id: 'W2', name: 'Bob' }, { id: 'W3', name: 'Charlie' },
    { id: 'W4', name: 'David' }, { id: 'W5', name: 'Eve' }, { id: 'W6', name: 'Frank' }
  ];
  const stations = [
    { id: 'S1', type: 'Assembly' }, { id: 'S2', type: 'Welding' }, { id: 'S3', type: 'Quality' },
    { id: 'S4', type: 'Packaging' }, { id: 'S5', type: 'Painting' }, { id: 'S6', type: 'Machining' }
  ];

  await Worker.insertMany(workers);
  await Station.insertMany(stations);
  console.log("Database Seeded!");
};
seedDatabase();