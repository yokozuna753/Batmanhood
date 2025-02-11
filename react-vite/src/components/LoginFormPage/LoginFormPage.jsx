import { useState, useEffect } from "react";
import { thunkLogin } from "../../redux/session";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import "./LoginForm.css";

function LoginFormPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.session.user); // Getting the logged-in user from the Redux store
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  // If user is logged in, navigate to portfolio page
  if (sessionUser) return <Navigate to="/portfolio" replace={true} />;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Dispatch login action to authenticate user
    const serverResponse = await dispatch(
      thunkLogin({
        email,
        password,
      })
    );

    // If there are errors, update the state and show them
    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      // If login is successful, redirect to portfolio page
      navigate("/portfolio");
    }
  };

  return (
    <>
      <h1>Log In</h1>
      {errors.length > 0 &&
        errors.map((message) => <p key={message}>{message}</p>)}
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {errors.email && <p>{errors.email}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {errors.password && <p>{errors.password}</p>}
        <button type="submit">Log In</button>
      </form>
    </>
  );
}

export default LoginFormPage;