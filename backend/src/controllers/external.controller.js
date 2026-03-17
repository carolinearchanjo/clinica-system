const axios = require('axios');

// CEP Controller
const buscarCep = async (req, res) => {
  try {
    const { cep } = req.params;
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return res.status(400).json({ success: false, message: 'CEP inválido' });
    }

    const resp = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`, { timeout: 5000 });

    if (resp.data.erro) {
      return res.status(404).json({ success: false, message: 'CEP não encontrado' });
    }

    res.json({
      success: true,
      endereco: {
        cep: resp.data.cep,
        logradouro: resp.data.logradouro,
        bairro: resp.data.bairro,
        cidade: resp.data.localidade,
        uf: resp.data.uf
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao consultar CEP' });
  }
};

// Clima Controller
const buscarClima = async (req, res) => {
  try {
    const { data, cidade } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const cidadeBusca = cidade || process.env.OPENWEATHER_CITY || 'São Paulo';

    if (!apiKey) {
      return res.status(503).json({ success: false, message: 'API de clima não configurada' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidadeBusca)}&appid=${apiKey}&units=metric&lang=pt_br&cnt=40`;
    const resp = await axios.get(url, { timeout: 8000 });

    const dataAlvo = data ? new Date(data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const previsoesData = resp.data.list.filter((item) => item.dt_txt.startsWith(dataAlvo));

    if (!previsoesData.length) {
      return res.status(404).json({
        success: false,
        message: 'Previsão não disponível para esta data (máximo 5 dias)'
      });
    }

    const previsao = previsoesData.find((p) => p.dt_txt.includes('12:00')) || previsoesData[0];

    const temChuva = previsao.weather.some((w) =>
      ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.main)
    );

    const temperaturaMax = Math.max(...previsoesData.map((p) => p.main.temp_max));
    const temperaturaMin = Math.min(...previsoesData.map((p) => p.main.temp_min));

    res.json({
      success: true,
      clima: {
        cidade: resp.data.city.name,
        data: dataAlvo,
        descricao: previsao.weather[0].description,
        icone: `https://openweathermap.org/img/wn/${previsao.weather[0].icon}@2x.png`,
        temperatura: Math.round(previsao.main.temp),
        temperaturaMax: Math.round(temperaturaMax),
        temperaturaMin: Math.round(temperaturaMin),
        umidade: previsao.main.humidity,
        chuva: temChuva,
        alertaChuva: temChuva
          ? '⚠️ Previsão de chuva para o dia da consulta. Leve um guarda-chuva!'
          : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao consultar previsão do tempo' });
  }
};

module.exports = { buscarCep, buscarClima };