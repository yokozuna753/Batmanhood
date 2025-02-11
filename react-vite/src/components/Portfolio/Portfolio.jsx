import { loadPortfolio } from "../../redux/portfolio";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "./Portfolio.css";
import { useEffect } from "react";

//  grab the user id from redux store
//

function Portfolio() {
  const sessionUser = useSelector((state) => state.session.user); // Access the user from Redux state
  const portfolio = useSelector((state) => state.portfolio)
  const dispatch = useDispatch();



  useEffect(() => {
    if (sessionUser) {
      dispatch(loadPortfolio(sessionUser.id));
    }
  }, [sessionUser, dispatch ]);

  // If the user is not logged in, redirect to the login page
  if (!sessionUser) {
    return <Navigate to="/login" replace={true} />;
  }

  console.log('              THIS IS PORTFOLIO ==>    ', Object.entries(portfolio));

  return (
    <div id="portfolio-base">
      <h1>THIS IS PORTFOLIO</h1>
      {/* Add the rest of your portfolio content here */}
    </div>
  );
}

export default Portfolio;
