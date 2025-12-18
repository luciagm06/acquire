'use strict';

const externalApiService = require('../services/externalApiService');
const PreparedSample = require('../models/preparedSample');

function health(req, res) {
  res.json({
    status: 'ok',
    service: 'acquire'
  });
}

async function getData(req, res) {
  try {
    console.log('[ACQUIRE] POST /data - Iniciando obtencion de datos...');

    const {
      rawData,
      features,
      targetDate,
      dailyValues,
      kunnaMeta,
      daysUsed,
      fetchMeta
    } = await externalApiService.fetchAndPrepareData();

    console.log('[ACQUIRE] Features generadas:', features);

    const saved = await PreparedSample.create({
      timeStart: new Date(fetchMeta.timeStart),
      timeEnd: new Date(fetchMeta.timeEnd),
      timeAsk: new Date(),
      features: features
    });

    console.log('[ACQUIRE] Datos guardados en MongoDB. ID:', saved._id);
    console.log('[ACQUIRE] timeAsk guardado:', saved.timeAsk);

    res.status(201).json({
      dataId: saved._id,
      features: saved.features,
      featureCount: 7,
      scalerVersion: 'v1',
      createdAt: saved.timeAsk
    });

  } catch (err) {
    console.error('[ACQUIRE] Error en /data:', err.message);
    console.error('[ACQUIRE] Stack:', err.stack);
    res.status(500).json({
      error: 'Internal error',
      message: err.message
    });
  }
}

module.exports = {
  health,
  getData
};
