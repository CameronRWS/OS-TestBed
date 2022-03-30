import React, { useEffect } from 'react'
import { XTerm } from 'xterm-for-react'
 
function Terminal() {
  const XTermRef = React.useRef();
  const XTermOpt = {
    cursorBlink:true
  }

  let messageString = "";

  const prompt = (firstLine) => {
    if(firstLine) {
      XTermRef.current.terminal.write('$ ');
    }else{
      XTermRef.current.terminal.write('\r\n$ ');
    }
  };

  const onKey = (event) => {

  const code = event.key.charCodeAt(0);

    if(event.key === '\r') {
      //send through websocket
      console.log("sending msg...");
      ws.send(messageString);
      messageString = "";
      prompt(false);
    }

    if(code === 127) {
    messageString = messageString.slice(0, -1);
    XTermRef.current.terminal.write("\b \b");
    }

    else {
      console.log(event.key);
      messageString += event.key;
      XTermRef.current.terminal.write(event.key);
    }
  };

  const ws = new WebSocket("ws://localhost:9000");
  const msg = "frontend WebSocket is now open"

  React.useEffect(() => {
      //initialize websocket
    ws.addEventListener("open", () =>{
      console.log("connected to server");
      ws.send(msg);
    });
    prompt(true);
  });

    //websocket on message
    ws.onmessage = function (event) {
      console.log(event.data);
      XTermRef.current.terminal.write(event.data);
      prompt(false);
    };

    //websocket for closing
//        ws.addEventListener("close", function () {
//          console.log("closing");
//          prompt(false);
//        });

  let content = (
    <div>
      <XTerm
        ref = { XTermRef }
        options = { XTermOpt }
        onKey = { onKey }
      />
    </div>
  );
  return content;
}
export default Terminal;