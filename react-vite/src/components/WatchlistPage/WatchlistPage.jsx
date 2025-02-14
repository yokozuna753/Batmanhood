import { useParams } from "react-router-dom";


const WatchlistPage = () => {

    console.log("*****HIT WATCHLIST PAGE!*****")

    const { watchlist_id } = useParams()

    return (
        <div>
            <div>
                <h1> {`Welcome to the Watchlist Page ${watchlist_id}!`} </h1>
            </div>

            <table>
                Table goes here.
            </table>

        </div>

    )
}

export default WatchlistPage;