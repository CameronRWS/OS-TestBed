const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./app/config/swagger_output.json");

const app = express();
var corsOptions = {
  origin: [`http://${process.env.IP}:3000`, `http://localhost:3000`],
};

const db = require("./app");

initializeDb();

app.use(cors(corsOptions));
//app.use(cors({origin: `localhost`}));
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(
  express.urlencoded({
    extended: true,
  })
);
// simple route
app.get("/", (req, res) => {
  res.json({
    message: "Basic app.",
  });
});
require("./app/routes/user.routes")(app);
require("./app/routes/eventType.routes")(app);
require("./app/routes/event.routes")(app);
require("./app/routes/api.routes")(app);
require("./app/routes/password.routes")(app);
require("./app/routes/computer.routes")(app);
require("./app/routes/session.routes")(app);
require("./app/routes/switch.routes")(app);
// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

async function initializeDb() {
  const EventType = db.eventType;
  const Password = db.password;
  const Computer = db.computer;
  const User = db.user;
  const Switch = db.switch;
  //The following is to wipe the database everytime.
  db.sequelize
    .query("SET FOREIGN_KEY_CHECKS = 0", {
      raw: true,
    })
    .then(() =>
      db.sequelize
        .sync({
          force: true,
        })
        .then(async () => {
          console.log("Drop and re-sync db.");
          await User.create({
            userId: 1,
            email: "csmith48@iastate.edu",
            isAdmin: 1,
          });
          //Order in which event types are created matters. See utils file for correct order.
          await EventType.create({
            eventType: "login",
          });
          await EventType.create({
            eventType: "admin login",
          });
          await EventType.create({
            eventType: "changed password",
          });
          await EventType.create({
            eventType: "changed admin password",
          });
          await EventType.create({
            eventType: "session start",
          });
          await EventType.create({
            eventType: "session end",
          });
          await EventType.create({
            eventType: "joined queue",
          });
          await EventType.create({
            eventType: "exited queue",
          });
          await EventType.create({
            eventType: "state of queue logged",
          });
          await EventType.create({
            eventType: "computer added"
          });
          await EventType.create({
            eventType: "computer deleted"
          });
          await EventType.create({
            eventType: "admin kicked user off computer",
          });
          await EventType.create({
            eventType: "admin joined front of queue",
          });
          await EventType.create({
            eventType: "admin cleared queue",
          });
          //Switch stuff?
          await Switch.create({ ipAddress: "192.168.1.140", username: "ostestbed", password: "05testbed!" });
          //Password stuff.
          hashedPassword = await bcrypt.hash("p", 10);
          await Password.create({
            password: hashedPassword,
            isAdminPassword: 0,
          });
          hashedPassword = await bcrypt.hash("ap", 10);
          await Password.create({
            password: hashedPassword,
            isAdminPassword: 1,
          });
          //Computer stuff. inUse is false by default.
          await Computer.create({
            portId: 2,
            switchId: 1,
            serialNumber: "e2f2ecf5",
            model: "Raspberry Pi 4",

          });
          await Computer.create({
            portId: 3,
            switchId: 1,
            serialNumber: "e2f2ecf5",
            model: "Raspberry Pi 3B+",
          });
          // await Computer.create({
          //   portId: 4,
          //   switchId: 1,
          //   serialNumber: "e2f2ecf5",
          //   model: "Raspberry Pi 3 Model B+",
          // });
          // await Computer.create({
          //   portId: 5,
          //   serialNumber: 'e2f2ecf5',
          //   model: "Raspberry Pi 3 Model B+"
          // });
          // await Computer.create({
          //   portId: 6,
          //   serialNumber: 'e2f2ecf5',
          //   model: "Raspberry Pi 3 Model B+"
          // });
          // await Computer.create({
          //   portId: 7,
          //   serialNumber: 'e2f2ecf5',
          //   model: "Raspberry Pi 3 Model B+"
          // });
          // initialize queue and computer websockets
          require("./app/websockets/queueWebsocketServer.js");
          require("./app/websockets/computerWebsocketServer.js");
        })
    );
}
