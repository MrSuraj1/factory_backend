require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Event = require('./model/Event');
const Worker = require('./model/Worker');
const Station = require('./model/Station');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/factory_db')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Mongo Error:', err));

/* =========================
   1️⃣ SEED API
========================= */
app.post('/api/seed', async (req, res) => {
  try {
    await Promise.all([Worker.deleteMany({}), Station.deleteMany({}), Event.deleteMany({})]);

    const workers = [
      { worker_id:'W1', name:'Suresh' }, { worker_id:'W2', name:'Boby' },
      { worker_id:'W3', name:'remesh' }, { worker_id:'W4', name:'deepak' },
      { worker_id:'W5', name:'ritik' }, { worker_id:'W6', name:'ranjit' }
    ];

    const stations = [
      { station_id:'S1', type:'Assembly' }, { station_id:'S2', type:'Welding' },
      { station_id:'S3', type:'Quality' }, { station_id:'S4', type:'Packaging' },
      { station_id:'S5', type:'Painting' }, { station_id:'S6', type:'Machining' }
    ];
    

    await Promise.all([Worker.insertMany(workers), Station.insertMany(stations)]);
    res.json({ message: 'Database Seeded Successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   2️⃣ INGEST API
========================= */
app.post('/api/ingest', async (req, res) => {
  try {
    const { timestamp, worker_id, event_type, count } = req.body;
    
    // UPSERT logic: Agar same worker, same time aur same event type hai, toh naya mat banao
    const query = { timestamp, worker_id, event_type };
    const update = { ...req.body };
    const options = { upsert: true, new: true };

    const event = await Event.findOneAndUpdate(query, update, options);
    res.status(201).json({ status: 'success', data: event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
/* =========================
   3️⃣ METRICS API (Updated for Assessment)
========================= */
app.get('/api/metrics', async (req, res) => {
  try {
    const [workers, stations, events] = await Promise.all([
      Worker.find(), Station.find(), Event.find().sort({ timestamp: 1 })
    ]);

    // Assumption: Each status event represents 10 minutes of activity
    const SLOT_TIME = 10; 

    // Calculate Worker Metrics
    const workerMetrics = workers.map(w => {
      const wEvents = events.filter(e => e.worker_id === w.worker_id);
      const workingMins = wEvents.filter(e => e.event_type === 'working').length * SLOT_TIME;
      const idleMins = wEvents.filter(e => e.event_type === 'idle').length * SLOT_TIME;
      const units = wEvents.filter(e => e.event_type === 'product_count').reduce((s, e) => s + (e.count || 0), 0);

      const totalTime = workingMins + idleMins;
      return {
        id: w.worker_id,
        name: w.name,
        utilization: totalTime > 0 ? Math.round((workingMins / totalTime) * 100) : 0,
        units: units,
        uph: totalTime > 0 ? ((units / totalTime) * 60).toFixed(2) : 0 // Units Per Hour
      };
    });

    // Calculate Station Metrics
    const stationMetrics = stations.map(s => {
      const sEvents = events.filter(e => e.workstation_id === s.station_id);
      const units = sEvents.filter(e => e.event_type === 'product_count').reduce((s, e) => s + (e.count || 0), 0);
      
      return {
        station_id: s.station_id,
        name: `${s.station_id}: ${s.type}`,
        status: sEvents.length > 0 ? sEvents[sEvents.length - 1].event_type : 'idle',
        units: units
      };
    });

    res.json({
      factory: {
        totalProduction: workerMetrics.reduce((s, w) => s + w.units, 0),
        avgUtilization: workerMetrics.length > 0 
          ? Math.round(workerMetrics.reduce((s, w) => s + w.utilization, 0) / workers.length)
          : 0,
        activeWorkers: workerMetrics.filter(w => w.utilization > 0).length
      },
      workers: workerMetrics,
      stations: stationMetrics
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.send(`
    <h2>Factory API Tester</h2>

    <form method="POST" action="/api/seed">
      <button type="submit">Seed Database</button>
    </form>

    <br/>

    <form method="POST" action="/api/ingest">
      <input name="timestamp" placeholder="timestamp" />
      <input name="worker_id" placeholder="worker_id (W1)" />
      <input name="event_type" placeholder="event_type (working)" />
      <input name="count" placeholder="count" />
      <button type="submit">Send Event</button>
    </form>
  `);
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));