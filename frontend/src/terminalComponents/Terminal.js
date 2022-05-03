import React from "react";
import { XTerm } from "xterm-for-react";

var ws;

function Terminal({ setPage, computerId, userId, isAdmin }) {
  let messageString = "";

  const XTermRef = React.useRef();
  const XTermOpt = { cursorBlink: true };

  React.useEffect(() => {
    initWebSocket();
  }, []);

  async function initWebSocket() {
    ws = new WebSocket(`ws://${process.env.REACT_APP_IP}:9000`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ messageType: "websocket-initialization-message", computerId: computerId, userId: userId }));
      printToTerminal("You are now in control of computerId=" + computerId);
    };

    ws.onmessage = (messageFromBackend) => {
      var message = JSON.parse(messageFromBackend.data.toString());
      if (message.messageType === "admin-kicked-user") {
        ws.close(); //Backend handles session being released.
      } else if (message.messageType === "terminal-message") {
        printToTerminal(message.text);
      }
    };

    ws.onclose = () => {
      printToTerminal("Session closed. You will be redirected shortly.");
      setTimeout(function () {
        if (isAdmin) {
          setPage("AdminDashboard");
        } else {
          setPage("Dashboard");
        }
      }, 1000);
    };
  }

  function clearTerminal() {
    XTermRef.current.terminal.clear();
  }

  function printToTerminal(str) {
    if (XTermRef.current) {
      XTermRef.current.terminal.write("\x1B[1;32m" + str + "\r\n$ ");
    }
  }

  const onKey = (event) => {
    const code = event.key.charCodeAt(0);

    // //for finding regex
    console.log(event.key);

    if (event.key === "\u001b[A") {
      XTermRef.current.terminal.write(" " + "\r\r\n$ ");
    }

    if ( event.key === "\u001b[B") {
      XTermRef.current.terminal.write("\b" + "\r\n$ ");
    }

    if (event.key === "\u001b[C" ) {
      XTermRef.current.terminal.write("\b");
    }

    if (event.key === "\u001b[D"){
      if (messageString.length <= 0) {
        messageString = messageString.slice(0, 0);
        XTermRef.current.terminal.write("\b");
      }
      else {
      XTermRef.current.terminal.write("\b");
      }
    }

    if (code === 127) {
      if (messageString.length > 0) {
        messageString = messageString.slice(0, -1);
        XTermRef.current.terminal.write("\b \b");
      }
    }
    else {
      if (code !== 127) {
        messageString += event.key;
        XTermRef.current.terminal.write(event.key);
      }
    }

    if (event.key === "\r") {
      ws.send(JSON.stringify({ messageType: "terminal-message", body: messageString }));
      messageString = "";
      XTermRef.current.terminal.write("\r\n$ ");
    }


  };

  let content = (
    <div>
      <XTerm ref={XTermRef} options={XTermOpt} onKey={onKey}/>
      <button onClick={() => ws.close()}>Close terminal</button>
      <button onClick={() => clearTerminal()}>Clear terminal</button>
    </div>
  );

  return content;
}
export default Terminal;
