import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModalProvider, Modal } from "../context/Modal";
import { thunkAuthenticate } from "../redux/session";
import Navigation from "../components/Navigation/Navigation";

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Dispatch the action to check if the user is authenticated
    dispatch(thunkAuthenticate()).then((user) => {
      setIsLoaded(true);
      if (user) {
        // Redirect to the portfolio page if the user is logged in
        navigate("/portfolio");
      } else {
        // Otherwise, stay on the login page or display modal for login
        navigate("/login");
      }
    });
  }, [dispatch, navigate]);

  return (
    <>
      <ModalProvider>
        {/* <Navigation /> */}
        {isLoaded && <Outlet />}
        <Modal />
      </ModalProvider>
    </>
  );
}
