import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import "./Login.css";

function Login({ setPage, setUserId, setIsAdmin}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function validateForm() {
    return email.length > 0 && password.length > 0;
  }

  function handleSubmit(event) {
    sendCredentials(email, password);
    event.preventDefault();
  }

  function sendCredentials(email,password)
  {
    const login = { email, password};
    fetch(`http://${process.env.REACT_APP_IP}:8080/api/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(login)
    }).then(async (response) => {
      if (response.status === 200) {
        let json = await response.json();
        setUserId(json.user.userId);
        if (json.usedAdminPassword) {
          setIsAdmin(true);
          setPage("AdminDashboard");
        } else {
          setIsAdmin(false);
          setPage("Dashboard");
        }
      } else {
        document.getElementById("fail_message").innerHTML = "<p><small>Login Failed</small></p> <p><small>Please Try again</small></p>";
      }
    });
  }

  let content = (
    <div className="Login">
      <h1>OS Test Bed</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Label className="input_field_label">Email: </Form.Label>
        <Form.Group size="lg" controlId="email">
          <Form.Control
            autoFocus
            className="input_field"
            pattern=".+@iastate\.edu"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>
        <Form.Label className="input_field_label">Password: </Form.Label>
        <Form.Group size="lg" controlId="password">
          <Form.Control
            className="input_field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        <Button class="button button1" size="lg" type="submit" disabled={!validateForm()}>
          Login
        </Button>{' '}
      </Form>
      <div id="fail_message"></div>
    </div>
  );

  return content;
}

export default Login;
