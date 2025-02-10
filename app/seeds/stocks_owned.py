from app.models import db, StocksOwned, environment, SCHEMA
from sqlalchemy.sql import text


# Adds a demo user, you can add other users here if you want
def seed_stocks_owned():
    apple = StocksOwned(
        estimated_cost=22740,owner_id=1, ticker='AAPL',shares_owned=100)
    netflix = StocksOwned(
        estimated_cost=101491,owner_id=2, ticker='NFLX',shares_owned=100)
    amazon = StocksOwned(
        estimated_cost=22858,owner_id=3, ticker='AMZN',shares_owned=100)

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
def undo_stocks_owned():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.stocks_owned RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM stocks_owned"))
        
    db.session.commit()
