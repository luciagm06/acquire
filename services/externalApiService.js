'use strict';

const axios = require('axios');

const KUNNA_API_URL = process.env.KUNNA_API_URL;
const KUNNA_TOKEN = process.env.KUNNA_TOKEN;
const KUNNA_ALIAS = process.env.KUNNA_ALIAS;  

async function fetchAndPrepareData() {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    let targetDate;
    if (hour >= 23) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(0, 0, 0, 0);
    } else {
      targetDate = new Date(now);
      targetDate.setHours(targetDate.getHours() + 1, 0, 0, 0);
    }

    const timeEnd = new Date(targetDate);
    timeEnd.setHours(timeEnd.getHours() - 1);

    const timeStart = new Date(timeEnd);
    timeStart.setDate(timeStart.getDate() - 3);

    console.log('[KUNNA] Hora actual:', hour);
    console.log('[KUNNA] target_date:', targetDate.toISOString());
    console.log('[KUNNA] time_end:', timeEnd.toISOString());
    console.log('[KUNNA] time_start:', timeStart.toISOString());

    const url = `${KUNNA_API_URL}/${KUNNA_TOKEN}`;
    
    console.log('[KUNNA] URL:', url);

    const requestBody = {
      time_start: timeStart.toISOString(),
      time_end: timeEnd.toISOString(),
      filters: [
        { filter: "name", values: ["1d"] },
        { filter: "alias", values: [KUNNA_ALIAS] }  
      ],
      limit: 100,
      count: false,
      order: "DESC"  
    };

    console.log('[KUNNA] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      url,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[KUNNA] Status:', response.status);
    console.log('[KUNNA] Response:', JSON.stringify(response.data, null, 2));

    const result = response.data.result;
    
    if (!result || !result.values || !Array.isArray(result.values)) {
      throw new Error('Formato de respuesta inesperado');
    }

    const rawValues = result.values;
    
    console.log('[KUNNA] Valores recibidos:', rawValues.length, 'filas');

    if (rawValues.length === 0 || (rawValues.length === 1 && rawValues[0].length === 0)) {
      throw new Error('La API no devolvio datos para el rango especificado');
    }

    const columns = result.columns;
    const data = rawValues.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    console.log('[KUNNA] Datos procesados:', data.length, 'registros');
    console.log('[KUNNA] Primer elemento:', JSON.stringify(data[0]));

    if (data.length < 3) {
      throw new Error(`No hay suficientes datos. Recibidos: ${data.length}`);
    }

    const consumo_t = data[0]?.value || 0;
    const consumo_t1 = data[1]?.value || 0;
    const consumo_t2 = data[2]?.value || 0;

    console.log('[KUNNA] consumo_t:', consumo_t);
    console.log('[KUNNA] consumo_t-1:', consumo_t1);
    console.log('[KUNNA] consumo_t-2:', consumo_t2);

    const hora = targetDate.getHours();
    const dia_semana = targetDate.getDay();
    const mes = targetDate.getMonth() + 1;
    const dia_mes = targetDate.getDate();

    console.log('[KUNNA] Features temporales - hora:', hora, 'dia_semana:', dia_semana, 'mes:', mes, 'dia_mes:', dia_mes);

    const features = [
      consumo_t,
      consumo_t1,
      consumo_t2,
      hora,
      dia_semana,
      mes,
      dia_mes
    ];

    console.log('[KUNNA] Features completas:', features);

    const dailyValues = [consumo_t, consumo_t1, consumo_t2];
    
    const kunnaMeta = {
      alias: data[0]?.alias || KUNNA_ALIAS,
      name: data[0]?.name || "1d"
    };

    const daysUsed = data.slice(0, 3).map(d => d.timestamp || d.time);

    const fetchMeta = {
      timeStart: timeStart.toISOString(),
      timeEnd: timeEnd.toISOString()
    };

    return {
      rawData: data.slice(0, 3),
      features,
      targetDate,
      dailyValues,
      kunnaMeta,
      daysUsed,
      fetchMeta
    };

  } catch (err) {
    console.error('[KUNNA] Error al obtener datos:', err.message);
    if (err.response) {
      console.error('[KUNNA] Response status:', err.response.status);
      console.error('[KUNNA] Response data:', JSON.stringify(err.response.data));
    }
    throw err;
  }
}

module.exports = {
  fetchAndPrepareData
};