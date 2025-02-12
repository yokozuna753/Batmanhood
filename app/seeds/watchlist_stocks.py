from app.models import db, WatchlistStock, environment, SCHEMA
from sqlalchemy.sql import text


# Adds a demo user, you can add other users here if you want
def seed_watchlist_stocks():
    apple = WatchlistStock(
        watchlist_id=1, ticker='AAPL')
    netflix = WatchlistStock(
        watchlist_id=2, ticker='NFLX')
    amazon = WatchlistStock(
        watchlist_id=3, ticker='AMZN')

    db.session.add(apple)
    db.session.add(netflix)
    db.session.add(amazon)
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
