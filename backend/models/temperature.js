const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Temperature = sequelize.define('Temperature', {
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true, // Temporarily allow null for migration
    },
  });
  return Temperature;
};