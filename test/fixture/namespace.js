const express = require('express');
const http = require('http');

const socketIo = require('socket.io');
const socketio_jwt = require('../../lib');

const jwt = require('jsonwebtoken');
const enableDestroy = require('server-destroy');
const bodyParser = require('body-parser');

let sio;

/**
 * This is an example server that shows how to do namespace authentication.
 *
 * The /admin namespace is protected by JWTs while the global namespace is public.
 */
exports.start = function (callback) {

  const options = {
    secret: 'aaafoo super sercret',
    timeout: 1000,
    handshake: false
  };

  const app = express();
  const server = http.createServer(app);
  sio = socketIo.listen(server);

  app.use(bodyParser.json());
  app.post('/login', function (req, res) {
    const profile = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      id: 123
    };

    // We are sending the profile inside the token
    const token = jwt.sign(profile, options.secret, { expiresIn: 60*60*5 });
    res.json({ token: token });
  });



  sio.on('connection', function (socket) {
    socket.emit('hi');
  });

  const admin_nsp = sio.of('/admin');

  admin_nsp.on('connection', socketio_jwt.authorize(options))
           .on('authenticated', function (socket) {
              socket.emit('hi admin');
            });


  server.listen(9000, callback);
  enableDestroy(server);
};

exports.stop = function (callback) {
  sio.close();
  try {
    server.destroy();
  } catch (er) {}
  callback();
};
