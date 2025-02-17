import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ModalProvider, Modal } from "../context/Modal";
import { thunkAuthenticate } from "../redux/session";
import Navigation from "../components/Navigation/Navigation";

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);
  
  
  const user = useSelector(state => state.session.user);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isLoaded) {
        await dispatch(thunkAuthenticate());
        setIsLoaded(true);
      }
    };

    initializeAuth();
  }, [dispatch, isLoaded]);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/login');
    } else if (isLoaded && user && location.pathname === '/') {
      navigate('/portfolio');
    }
  }, [isLoaded, user, location.pathname, navigate]);

  if (!isLoaded) return null;

  return (
    <>
      <ModalProvider>
        <Navigation />
        <Outlet />
        <Modal />
      </ModalProvider>
    </>
  );
}