'use strict';

const axios = require('axios');

const KUNNA_API_URL = process.env.KUNNA_API_URL;
const KUNNA_TOKEN = process.env.KUNNA_TOKEN;
const KUNNA_METER = process.env.KUNNA_METER;

async function fetchAndPrepareData() {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    // PASO i: Buscar target_date
    let targetDate;
    if (hour >= 23) {
      // Si son más de las 23, predecimos mañana
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(0, 0, 0, 0);
    } else {
      // Si no, predecimos hoy
      targetDate = new Date(now);
      targetDate.setHours(targetDate.getHours() + 1, 0, 0, 0);
    }

    // PASO ii: time_end = target_date - 1
    const timeEnd = new Date(targetDate);
    timeEnd.setHours(timeEnd.getHours() - 1);

    // PASO iii: time_start = time_end - 3
    const timeStart = new Date(timeEnd);
    timeStart.setHours(timeStart.getHours() - 3);

    console.log('[KUNNA] Hora actual:', hour);
    console.log('[KUNNA] target_date:', targetDate.toISOString());
    console.log('[KUNNA] time_end (target_date - 1):', timeEnd.toISOString());
    console.log('[KUNNA] time_start (time_end - 3):', timeStart.toISOString());

    // Llamar a Kunna API
    const response = await axios.post(
      KUNNA_API_URL,
      {
        time_start: timeStart.toISOString(),
        time_end: timeEnd.toISOString(),
        filters: [
          {
            filter: "name",
            values: ["1d"]
          },
          {
            filter: "uid",
            values: [KUNNA_METER]
          }
        ],
        limit: 100,
        count: false,
        order: "DESC"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KUNNA_TOKEN}`
        }
      }
    );

    console.log('[KUNNA] Datos recibidos:', response.data.length, 'registros');

    const data = response.data;
    
    if (!data || data.length < 3) {
      throw new Error(`No hay suficientes datos. Recibidos: ${data?.length || 0}`);
    }

    // Extraer últimos 3 consumos (ordenados DESC, así [0] es el más reciente)
    const consumo_t = data[0]?.value || 0;
    const consumo_t1 = data[1]?.value || 0;
    const consumo_t2 = data[2]?.value || 0;

    console.log('[KUNNA] consumo_t:', consumo_t);
    console.log('[KUNNA] consumo_t-1:', consumo_t1);
    console.log('[KUNNA] consumo_t-2:', consumo_t2);

    // Extraer features temporales del target_date
    const hora = targetDate.getHours();
    const dia_semana = targetDate.getDay();
    const mes = targetDate.getMonth() + 1;
    const dia_mes = targetDate.getDate();

    console.log('[KUNNA] Features temporales - hora:', hora, 'dia_semana:', dia_semana, 'mes:', mes, 'dia_mes:', dia_mes);

    // Construir vector de features
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

    // Preparar datos adicionales para guardar
    const dailyValues = [consumo_t, consumo_t1, consumo_t2];
    
    const kunnaMeta = {
      alias: data[0]?.alias || KUNNA_METER,
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
