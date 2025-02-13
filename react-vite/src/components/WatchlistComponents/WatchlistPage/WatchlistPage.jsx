import { useParams } from "react-router-dom";


const WatchlistPage = () => {

    const { watchlist_id } = useParams()


    return (
        <>
            <p> Welcome to the Watchlist Page</p>
        </>
    )
}

export default WatchlistPage;