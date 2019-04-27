const axios = require("axios");

pumpDataToReplica = async (replica, payload) => {
  return axios
    .post(`http://localhost:${replica}/add`, payload)
    .then(response => {
      return response.status === 200 ? { status: true } : {status: false};
    })
    .catch(function(error) {
      return { status: false };
    });
};

pingReplica = async replica => {
  return axios
    .get(`http://localhost:${replica}/report`)
    .then(response => {
      const report = response.data;
      return report;
    })
    .catch(function(error) {
      return { status: false, message: error };
    });
};

module.exports = { pingReplica, pumpDataToReplica };
