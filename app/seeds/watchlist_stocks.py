from app.models import db, WatchlistStock, environment, SCHEMA
from sqlalchemy.sql import text


def seed_watchlist_stocks():

    # Watchlist 1 owned by user 1
    apple00 = WatchlistStock(
        watchlist_id=1, symbol='AAPL')
    
    # Watchlist 2 owned by user 2
    netflix = WatchlistStock(
        watchlist_id=2, symbol='NFLX')
    zillow = WatchlistStock(
        watchlist_id=2, symbol='Z')
    sofi = WatchlistStock(
        watchlist_id=2, symbol='SOFI')
    apple02 = WatchlistStock(
        watchlist_id=2, symbol='AAPL')
    nvidia00 = WatchlistStock(
        watchlist_id=2, symbol='NVDA'
    )

    # Watchlist 3 owned by user 3
    duolingo = WatchlistStock(
        watchlist_id=3, symbol='DUOL'
    ) 

    # Watchlist 4 owned by user 2
    wix = WatchlistStock(
        watchlist_id=4, symbol='WIX'
    )

    # Watchlist 5 owned by user 2
    nvidia01 = WatchlistStock(
        watchlist_id=5, symbol='NVDA')

    # Watchlist 6 owned by user 2
    nvidia02  = WatchlistStock(
        watchlist_id=6, symbol='NVDA')
    apple03 = WatchlistStock(
        watchlist_id=6, symbol='AAPL')
    draftkings = WatchlistStock(
        watchlist_id=6, symbol='DKNG')
    expedia = WatchlistStock(
        watchlist_id=6, symbol='EXPE')

    db.session.add(apple00)
    db.session.add(netflix)
    db.session.add(zillow)
    db.session.add(sofi)
    db.session.add(apple02)
    db.session.add(nvidia00)
    db.session.add(duolingo)
    db.session.add(wix)
    db.session.add(nvidia01)
    db.session.add(nvidia02)
    db.session.add(apple03)
    db.session.add(draftkings)
    db.session.add(expedia)
    db.session.commit()


# Uses a raw SQL query to TRUNCATE or DELETE the users table. SQLAlchemy doesn't
# have a built in function to do this. With postgres in production TRUNCATE
# removes all the data from the table, and RESET IDENTITY resets the auto
# incrementing primary key, CASCADE deletes any dependent entities.  With
# sqlite3 in development you need to instead use DELETE to remove all data and
# it will reset the primary keys for you as well.
def undo_watchlist_stocks():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.watchlist_stocks RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM watchlist_stocks"))
        
    db.session.commit()
