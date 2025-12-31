const { buildConfig } = require('payload/config');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = require('./payload.config').default;

module.exports = config;
