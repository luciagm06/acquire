'use strict';

const axios = require('axios');

const KUNNA_API_URL = process.env.KUNNA_API_URL || 'https://openapi.kunna.es/data';
const KUNNA_TOKEN = process.env.KUNNA_TOKEN || '';
const KUNNA_ALIAS = process.env.KUNNA_ALIAS || '6339651';


async function fetchAndPrepareData() {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    console.log('[KUNNA] Fecha actual completa:', now.toISOString());
    console.log('[KUNNA] Hora actual:', hour);

    let targetDate;
    
    if (hour >= 23) {
      console.log('[KUNNA] Son mas de las 23h: Predecir MAÑANA a las 00:00');
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);  
      targetDate.setHours(0, 0, 0, 0);               
    } else {
      console.log('[KUNNA] Son menos de las 23h. Predecir HOY');
      targetDate = new Date(now); 
    }
    
    const timeEnd = new Date(targetDate);
    timeEnd.setDate(timeEnd.getDate() - 1);
    
   
    const timeStart = new Date(timeEnd);
    timeStart.setDate(timeStart.getDate() - 3);
    
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
    
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[KUNNA] Status:', response.status);
    
   
    const result = response.data.result;
    
    if (!result || !result.values || result.values.length === 0) {
      throw new Error('No se obtuvieron datos de Kunna');
    }
    
    const rawValues = result.values;
    console.log('[KUNNA] Valores recibidos:', rawValues.length, 'filas');
    
    const columns = result.columns;
    const data = rawValues.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    
    console.log('[KUNNA] Datos procesados:', data.length, 'registros');
    if (data.length > 0) {
      console.log('[KUNNA] Primer elemento:', JSON.stringify(data[0]));
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