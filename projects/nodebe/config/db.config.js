module.exports = {
  HOST: 'localhost',
  HOST2: 'host.docker.internal',
  USER: 'fofgit',
  PASSWORD: 'parolafofgit',
  DB: "fofgit",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
