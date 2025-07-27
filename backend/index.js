require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const config = require('./config/config');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Database setup
const sequelize = new Sequelize(config.development);

// Define Temperature model
const Temperature = require('./models/temperature')(sequelize);

// Sync database and handle migrations
sequelize.sync().then(async () => {
  console.log('Database synced');

  // Check if 'location' column exists and add it if not
  const queryInterface = sequelize.getQueryInterface();
  const tableDescription = await queryInterface.describeTable('Temperatures');

  if (!tableDescription.location) {
    console.log('Adding location column to Temperatures table...');
    await queryInterface.addColumn('Temperatures', 'location', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log('Location column added.');
  }

  // Update existing records with random locations
  const locations = ['SR6', 'SR8', 'SRMain'];
  const existingTemperatures = await Temperature.findAll({ where: { location: null } });
  if (existingTemperatures.length > 0) {
    console.log(`Updating ${existingTemperatures.length} existing records with locations...`);
    for (const temp of existingTemperatures) {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      await temp.update({ location: randomLocation });
    }
    console.log('Existing records updated.');
  }

  

}).catch(err => console.error('Error syncing database:', err));

// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    const payload = {
      user: {
        id: 'admin',
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } else {
    res.status(400).json({ msg: 'Invalid Credentials' });
  }
});

app.get('/api/temperature', auth, async (req, res) => {
  try {
    const temperatures = await Temperature.findAll({ order: [['timestamp', 'DESC']], limit: 100 });
    res.json(temperatures);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));