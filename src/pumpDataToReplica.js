const axios = require("axios");

pumpDataToReplica = async (replica, packet) => {
  return axios
    .post(`http://localhost:${replica}/add`, packet)
    .then(response => {
      return {status: response.status === 200 ? true : false, replica: String(replica), id: packet.id};
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

startReplica = async replica => {
  return axios
    .get(`http://localhost:${replica}/start`)
    .then(response => {
      const report = response.data;
      return report;
    })
    .catch(function(error) {
      return { status: false, message: error };
    });
};

stopReplica = async replica => {
  return axios
    .get(`http://localhost:${replica}/stop`)
    .then(response => {
      const report = response.data;
      return report;
    })
    .catch(function(error) {
      return { status: false, message: error };
    });
};

module.exports = { pingReplica, pumpDataToReplica, startReplica, stopReplica };
