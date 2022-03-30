const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const webSocket = require('ws');

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./app/config/swagger_output.json");

const app = express();
var corsOptions = {
  origin: `http://${process.env.IP}:3000`,
};

const db = require("./app");

initializeDb();

// create websocket server
const wsServer = new webSocket.Server({ port: 9000 });

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Basic app." });
});
require("./app/routes/user.routes")(app);
require("./app/routes/eventType.routes")(app);
require("./app/routes/event.routes")(app);
require("./app/routes/api.routes")(app);
require("./app/routes/password.routes")(app);
require("./app/routes/computer.routes")(app);
require("./app/routes/session.routes")(app);
// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// create websocket connection
wsServer.on('connection', ws => {
	ws.on('message', message => {
		ws.send('Message received: ' + message);
	});
	ws.send('Successful connection');
});

async function initializeDb() {
  const EventType = db.eventType;
  const Password = db.password;
  const Computer = db.computer;
  //The following is to wipe the database everytime.
  db.sequelize.sync({ force: true }).then(async () => {
    console.log("Drop and re-sync db.");
    //Order in which event types are created matters. See utils file for correct order.
    await EventType.create({ eventType: "login" });
    await EventType.create({ eventType: "admin login" });
    await EventType.create({ eventType: "changed password" });
    await EventType.create({ eventType: "changed admin password" });
    await EventType.create({ eventType: "session start" });
    await EventType.create({ eventType: "session end" });
    //Password stuff.
    hashedPassword = await bcrypt.hash("password", 10);
    await Password.create({ password: hashedPassword, isAdminPassword: 0 });
    hashedPassword = await bcrypt.hash("adminpassword", 10);
    await Password.create({ password: hashedPassword, isAdminPassword: 1 });
    //Computer stuff. inUse is false by default.
    await Computer.create({ portId: 2, model: "Raspberry Pi 3 Model B+" });
    await Computer.create({ portId: 3, model: "Raspberry Pi 3 Model B+" });
    await Computer.create({ portId: 4, model: "Raspberry Pi 3 Model B+" });
    await Computer.create({ portId: 5, model: "Raspberry Pi 3 Model B+" });
    await Computer.create({ portId: 6, model: "Raspberry Pi 3 Model B+" });
    await Computer.create({ portId: 7, model: "Raspberry Pi 3 Model B+" });
  });
}
