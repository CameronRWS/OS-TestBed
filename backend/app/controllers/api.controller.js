const db = require("..");
const Event = db.event;
const Password = db.password;
const Session = db.session;
const Computer = db.computer;
const User = db.user;
const bcrypt = require("bcrypt");
const utils = require("../config/utils.js");
require("dotenv").config();
const exec = require("await-exec");

exports.reboot = async (req, res) => {
  /*
    #swagger.tags = ['api']
    #swagger.description = 'Reboots the PoE for a specific computer by calling a script on the backend.'
    #swagger.parameters['id'] = { 
      in: 'path',
      description: 'The computer id to reboot.' ,
      type: 'integer'
    }
    #swagger.responses[200] = { description: 'Sent when the command was executed successfully.' }
    #swagger.responses[412] = { description: 'Sent when the computer ID specified does not exist.' }
    #swagger.responses[500] = { description: 'Sent when something went wrong with the backend outside of frontend\'s control.' }
  */
  //Get the computer ID to reboot from the request.
  const computerId = req.params.id;
  //Get the computer object from the database (using sequelize).
  let theComputer = await Computer.findByPk(computerId);
  //Checks that the computer requested actually exists.
  if (!theComputer) {
    res.status(412).send({
      message: "Computer ID: " + computerId + " does not exist.",
    });
    return;
  }
  //Get the port ID to reset on the switch from the computer object.
  const portId = theComputer.portId;
  //Execute the reboot script passing in the port ID to reboot.
  let command = ` ./reboot.sh ${portId}`;
  if (process.env.OS.includes("Windows")) {
    command = "cd"; //Windows can't run our command without Windows Subsystem for Linux (WSL) and I can't install it lol.
  }
  return await exec(command)
    .then((r) => {
      if (!r.stderr) {
        res.status(200).send({
          message: "Command executed successfully.",
        });
      } else {
        res.status(500).send({
          message: r.stderr,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err,
      });
    });
};

exports.fileUpload = async (req, res) => {
  /*
    #swagger.tags = ['api']
    #swagger.description = 'Takes an uploaded kernel and stores it on the backend in the folder specific to the computer being used.'
    #swagger.parameters['id'] = { 
      in: 'path',
      description: 'The computer id the kernel belongs to.' ,
      type: 'integer'
    }
    #swagger.responses[200] = { description: 'Sent when the file was uploaded successfully.' }
    #swagger.responses[400] = { description: 'Sent when a file was not sent in the request' }
    #swagger.responses[412] = { description: 'Sent when the computer ID specified does not exist.' }
    #swagger.responses[500] = { description: 'Sent when something went wrong with the backend outside of frontend\'s control.' }
  */
  const computerId = req.params.id;
  let theComputer = await Computer.findByPk(computerId);
  if (!theComputer) {
    res.status(412).send({
      message: "Computer ID: " + computerId + " does not exist.",
    });
    return;
  }

  if (typeof req.file === "undefined") return res.status(400).send({ message: "No file sent" });

  res.status(200).send({ message: "Successful file upload" });
};

exports.login = async (req, res) => {
  /*
    #swagger.tags = ['api']
    #swagger.description = 'Use this to login to the website.'
  
    #swagger.parameters['body'] = { 
      in: 'body',
      schema: {
        email: 'email@email.com',
        password: 'somePassword48$'
      },
      description: 'A json object containing the email and password of a user attempting to log in.'
    }
  
    #swagger.responses[200] = { 
      description: 'Sent when a user successfully logs in.' ,
      schema: {
        "message": "Successfully logged in.",
        "usedAdminPassword": false,
        "isNewUser": true,
        "user": {
          "isAdmin": false,
          "userId": 1,
          "email": "email@email.com",
          "updatedAt": "2022-02-24T02:26:42.581Z",
          "createdAt": "2022-02-24T02:26:42.581Z"
        }
      }
    }
  
    #swagger.responses[401] = { description: 'Sent when the password was incorrect.' }
    #swagger.responses[412] = { description: 'Sent when something is wrong with your request\'s json object.' }
  */
  //Check if the body is valid.
  if (
    !utils.isBodyValid(req, res, {
      email: "string",
      password: "string",
    })
  ) {
    return;
  }
  //Get the normal password and admin password in order to compare against their entered password.
  let passwords = await Promise.all([
    Password.findOne({
      where: {
        isAdminPassword: 0,
      },
      order: [["createdAt", "DESC"]],
    }),
    Password.findOne({
      where: {
        isAdminPassword: 1,
      },
      order: [["createdAt", "DESC"]],
    }),
  ]).then((modelReturn) => {
    return modelReturn.flat();
  });
  //isMatch is true if and only if their entered password matches the normal password.
  const isMatch = await bcrypt.compare(req.body.password, passwords[0].dataValues.password);
  //isMatchAdmin is true if and only if their entered password matches the admin password.
  const isMatchAdmin = await bcrypt.compare(req.body.password, passwords[1].dataValues.password);
  //If both passwords do not match their entered password, let the user know.
  if (!(isMatchAdmin || isMatch)) {
    res.status(401).send({
      message: "Not the password.",
    });
    return;
  }
  //If they got one of the passwords correct, we need to see if this is a new user or an existing user.
  let isNewUser = false;
  let foundUser = await User.findOne({
    where: {
      email: req.body.email,
    },
  }).then((foundUser) => {
    return foundUser;
  });
  //If we could not find a user associated with the email they entered, then this must be a new user and we should create a user in the database.
  if (!foundUser) {
    isNewUser = true;
    foundUser = await User.create({
      email: req.body.email,
    }).then((user) => {
      return user;
    });
  }
  //Check if they are logging in as admin. Since if they entered the admin password and it matches, then they want to be signed in as admin.
  if (isMatchAdmin) {
    //If user is not an admin but used the admin password, then we should update their admin status.
    if (!foundUser.isAdmin) {
      foundUser.isAdmin = 1;
      await foundUser.save();
    }
    //Create admin login event.
    await Event.create({
      eventTypeId: utils.ADMIN_LOGIN_EVENT_ID,
      userId: foundUser.dataValues.userId,
    });
    res.status(200).send({
      message: "Admin successfully logged in.",
      usedAdminPassword: true,
      isNewUser: isNewUser,
      user: foundUser,
    });
  } else {
    //If they are not logging in as admin, they are logging in as a normal user.
    //Create normal login event.
    await Event.create({
      eventTypeId: utils.LOGIN_EVENT_ID,
      userId: foundUser.dataValues.userId,
    });
    res.status(200).send({
      message: "Successfully logged in.",
      usedAdminPassword: false,
      isNewUser: isNewUser,
      user: foundUser,
    });
  }
  return;
};

exports.useComputer = async (req, res) => {
  /*
    #swagger.tags = ['api']
    #swagger.description = 'Use this to use a computer. i.e., Call when a user is attempting to user a pi\'s terminal. Send the user ID who is requesting the computer, and the computer ID they want (not the port ID)'
  
    #swagger.parameters['body'] = { 
      in: 'body',
      schema: {
        userId: 1,
        computerId: 2
      },
      description: ''
    }

    #swagger.responses[200] = { description: 'Sent when the computer is put in use.' }
    #swagger.responses[412] = { description: 'Sent when something is wrong with your request\'s json object.' }
    #swagger.responses[500] = { description: 'Sent when something went wrong with the backend outside of frontend\'s control.' }
  */

  //TODO: Need to setup websockets, end the connection. Might not actually put the logic here, but I will leave the comment.
  //Check that the request body is valid.
  if (
    !utils.isBodyValid(req, res, {
      userId: "integer",
      computerId: "integer",
    })
  ) {
    return;
  }
  const userId = req.body.userId;
  const computerId = req.body.computerId;
  //Get the computer the user is attempting to use.
  let computer = await Computer.findByPk(computerId)
    .then((computer) => {
      if (computer) {
        return computer;
      } else {
        res.status(500).send({
          message: `Cannot find Computer with id=${computerId}.`,
        });
        return;
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Computer with id=" + computerId,
      });
      return;
    });
  //Check if the computer is available.
  if (computer.inUse) {
    res.status(500).send({
      message: "Computer with id=" + computerId + " is in use.",
    });
    return;
  }
  //Check if the user already have a computer (by checking if they have an open session)
  let session = await Session.findOne({
    where: {
      userId: userId,
      endTime: null,
    },
    order: [["startTime", "DESC"]],
  }).then((session) => {
    return session;
  });
  //If we could find an open session then let them know they cannot have the computer they are requesting.
  if (session) {
    res.status(500).send({
      message: `You already have an open session with computerId: ${session.computerId}. You may only have 1 computer at a time.`,
    });
    return;
  }
  //Update the computer to be in use now.
  computer.inUse = true;
  await computer.save();
  //Create a new session now that they have control of the computer.
  let newSession = await Session.create({
    userId: userId,
    computerId: computerId,
    startTime: Date.now(),
  });
  //Create a session start event.
  await Event.create({
    eventTypeId: utils.SESSION_START_EVENT_ID,
    userId: userId,
    newSession,
  });
  res.status(200).send({
    message: `Success! You are now in control of id=${computerId}`,
  });
};

exports.releaseComputer = async (req, res) => {
  /*
    #swagger.tags = ['api']
    #swagger.description = 'Use this to release a computer. i.e., A user\'s session with the terminal has ended.'
  
    #swagger.parameters['body'] = { 
      in: 'body',
      schema: {
        userId: 1,
        computerId: 2
      },
      description: ''
    }

    #swagger.responses[200] = { description: 'Sent when the computer is released.' }
    #swagger.responses[412] = { description: 'Sent when something is wrong with your request\'s json object.' }
    #swagger.responses[500] = { description: 'Sent when something went wrong with the backend outside of frontend\'s control.' }
  */

  //TODO: Need to setup websockets, end the connection. Might not actually put the logic here, but I will leave the comment.
  //Check that the request body is valid.
  if (
    !utils.isBodyValid(req, res, {
      userId: "integer",
      computerId: "integer",
    })
  ) {
    return;
  }
  const userId = req.body.userId;
  const computerId = req.body.computerId;
  //Get the computer the user wants to release (allow to no longer be in use)
  let computer = await Computer.findByPk(computerId)
    .then((computer) => {
      if (computer) {
        return computer;
      } else {
        res.status(500).send({
          message: `Cannot find Computer with id=${computerId}.`,
        });
        return;
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Computer with id=" + computerId,
      });
      return;
    });
  //If the computer is not in use, let the user know and exit.
  if (!computer.inUse) {
    res.status(200).send({
      message: "Computer with id=" + computerId + " is not in use.",
    });
    return;
  }
  //Attempt to find an open session associated with the user requesting to release a computer.
  let session = await Session.findOne({
    where: {
      userId: userId,
      endTime: null,
    },
    order: [["startTime", "DESC"]],
  }).then((session) => {
    return session;
  });
  //If a session didn't exist then release the computer anyways. Hopefully shouldn't happen if we manage the socket properly.
  if (session) {
    session.endTime = Date.now();
    await session.save();
  }
  //Create a session end event.
  await Event.create({
    eventTypeId: utils.SESSION_END_EVENT_ID,
    userId: userId,
  });
  //Update the computer to not longer be in use.
  computer.inUse = false;
  await computer.save();
  res.status(200).send({
    message: `Success! Computer id=${computerId} has been released.`,
  });
};

exports.userActivity = async (req,res) => {
  /*
    #swagger.tags = ['api']
    #swagger.description = 'Use this to get the amount of activity on the website.'

    #swagger.responses[200] = { description: 'Sent when the data is sent.' }
    #swagger.responses[412] = { description: 'Sent when something is wrong with your request\'s json object.' }
    #swagger.responses[500] = { description: 'Sent when something went wrong with the backend outside of frontend\'s control.' }
  */
 let eventTimes = await Event.findAll({
   attributes: [
     'eventTypeId',
     [db.sequelize.fn('hour', db.sequelize.col('createdAt')), 'hour']
    ],
    where: {
      eventTypeId: {
        [db.Sequelize.Op.or]: [1,2]
      }
    }
  }).then((eventTimes) => {
    if(eventTimes)
      res.send(eventTimes);
    else{
      res.status(500).send({
        message: "Something went wrong in getting events",
      })
    }
  }).catch((err) => {
    res.status(500).send({
      message: "Error: "+err,
    });
  });;

}