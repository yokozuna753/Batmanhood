import { useState } from "react";
import { thunkLogin, thunkUpdateUserInfo } from "../../redux/session";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
// import OpenModalButton from "../OpenModalButton";
// import SignupFormModal from "../SignupFormModal";
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
      dispatch(thunkUpdateUserInfo(sessionUser.id));
      navigate("/portfolio");
    }
  };

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    await dispatch(
      thunkLogin({
        email: "demo@aa.io",
        password: "password",
      })
    );
    await dispatch(thunkUpdateUserInfo(sessionUser.id));
  };

  return (
    <div className="container">
      <div className="left-half">
        <img
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2xlM2o1cTJ6aDZ5MmUzMG9zMXplMXBydXV2Y2t1NGptZXd4aXhlNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kg4e4Wksv20eY/giphy.gif"
          alt="Animated Image"
        ></img>
      </div>
      <div className="right-half">
        <div className="login">Log In to Batmanhood</div>
        {errors.length > 0 &&
          errors.map((message) => <p key={message}>{message}</p>)}
        <form className="form" onSubmit={handleSubmit}>
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
          <button type="button" onClick={handleDemoLogin}>
            Log In as Demo
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginFormPage;
