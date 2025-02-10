from app.models import db, environment, SCHEMA
from app.models.orders import Order
from sqlalchemy.sql import text


# Adds a demo user, you can add other users here if you want
def seed_orders():
    apple = Order(
        price_purchased=227.40,shares_purchased=100, owner_id=1,ticker='AAPL', order_type='Market')
    netflix = Order(
        price_purchased=227.40,shares_purchased=100, owner_id=2,ticker='NFLX', order_type='Market')
    amazon = Order(
        price_purchased=227.40,shares_purchased=100, owner_id=3,ticker='AMZN', order_type='Market')

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
def undo_orders():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.orders RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM orders"))
        
    db.session.commit()
