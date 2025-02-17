from app.models import db, Watchlist, environment, SCHEMA
from sqlalchemy.sql import text


# Adds a demo user, you can add other users here if you want

## Retirement list should remain empty for testing empty list edge case
## Lists owned by user 2 should be used to test watchlist with matching stocks

def seed_watchlist():
    trending = Watchlist(
        user_id=1,name='Trending')
    popular = Watchlist(
        user_id=2,name='Popular')
    retirement = Watchlist(
        user_id=2,name='Retirement')
    rocket = Watchlist(
        user_id=2,name='Rocket')
    innovative = Watchlist(
        user_id=2,name='Innovative')
    long_term = Watchlist(
        user_id=3,name='Long Term'
    )

    db.session.add(trending)
    db.session.add(popular)
    db.session.add(long_term)
    db.session.add(retirement)
    db.session.add(rocket)
    db.session.add(innovative)
    db.session.commit()


# Uses a raw SQL query to TRUNCATE or DELETE the users table. SQLAlchemy doesn't
# have a built in function to do this. With postgres in production TRUNCATE
# removes all the data from the table, and RESET IDENTITY resets the auto
# incrementing primary key, CASCADE deletes any dependent entities.  With
# sqlite3 in development you need to instead use DELETE to remove all data and
# it will reset the primary keys for you as well.
def undo_watchlist():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.watchlists RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM watchlists"))
        
    db.session.commit()
