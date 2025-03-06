from app.models import db, StocksOwned, environment, SCHEMA
from sqlalchemy.sql import text


# Adds a demo user, you can add other users here if you want
def seed_stocks_owned():
    # Original stocks
    apple = StocksOwned(
        total_cost=22740, owner_id=1, ticker='AAPL', shares_owned=100)
    netflix = StocksOwned(
        total_cost=101491, owner_id=2, ticker='NFLX', shares_owned=100)
    ford = StocksOwned(
        total_cost=923, owner_id=2, ticker='F', shares_owned=100)
    amazon = StocksOwned(
        total_cost=22858, owner_id=3, ticker='AMZN', shares_owned=100)

    # Additional stocks for owner_id 1
    microsoft = StocksOwned(
        total_cost=39850, owner_id=1, ticker='MSFT', shares_owned=100)
    google = StocksOwned(
        total_cost=16430, owner_id=1, ticker='GOOGL', shares_owned=100)
    tesla = StocksOwned(
        total_cost=24500, owner_id=1, ticker='TSLA', shares_owned=100)
    nvidia = StocksOwned(
        total_cost=58700, owner_id=1, ticker='NVDA', shares_owned=100)
    meta = StocksOwned(
        total_cost=41150, owner_id=1, ticker='META', shares_owned=100)
    jpmorgan = StocksOwned(
        total_cost=19240, owner_id=1, ticker='JPM', shares_owned=100)
    visa = StocksOwned(
        total_cost=26450, owner_id=1, ticker='V', shares_owned=100)
    walmart = StocksOwned(
        total_cost=7130, owner_id=1, ticker='WMT', shares_owned=100)
    disney = StocksOwned(
        total_cost=10480, owner_id=1, ticker='DIS', shares_owned=100)
    coca_cola = StocksOwned(
        total_cost=6220, owner_id=1, ticker='KO', shares_owned=100)
    paypal = StocksOwned(
        total_cost=6530, owner_id=1, ticker='PYPL', shares_owned=100)
    intel = StocksOwned(
        total_cost=4120, owner_id=1, ticker='INTC', shares_owned=100)
    amd = StocksOwned(
        total_cost=16240, owner_id=1, ticker='AMD', shares_owned=100)

    # Additional stocks for owner_id 2
    costco = StocksOwned(
        total_cost=73820, owner_id=2, ticker='COST', shares_owned=100)
    target = StocksOwned(
        total_cost=17080, owner_id=2, ticker='TGT', shares_owned=100)
    home_depot = StocksOwned(
        total_cost=38520, owner_id=2, ticker='HD', shares_owned=100)
    boeing = StocksOwned(
        total_cost=18140, owner_id=2, ticker='BA', shares_owned=100)
    pfizer = StocksOwned(
        total_cost=2840, owner_id=2, ticker='PFE', shares_owned=100)
    merck = StocksOwned(
        total_cost=12730, owner_id=2, ticker='MRK', shares_owned=100)
    johnson = StocksOwned(
        total_cost=15510, owner_id=2, ticker='JNJ', shares_owned=100)
    mastercard = StocksOwned(
        total_cost=43520, owner_id=2, ticker='MA', shares_owned=100)
    adobe = StocksOwned(
        total_cost=51140, owner_id=2, ticker='ADBE', shares_owned=100)
    salesforce = StocksOwned(
        total_cost=27380, owner_id=2, ticker='CRM', shares_owned=100)
    verizon = StocksOwned(
        total_cost=4120, owner_id=2, ticker='VZ', shares_owned=100)
    atnt = StocksOwned(
        total_cost=1740, owner_id=2, ticker='T', shares_owned=100)
    exxon = StocksOwned(
        total_cost=12040, owner_id=2, ticker='XOM', shares_owned=100)
    chevron = StocksOwned(
        total_cost=15380, owner_id=2, ticker='CVX', shares_owned=100)

    # Additional stocks for owner_id 3
    starbucks = StocksOwned(
        total_cost=9970, owner_id=3, ticker='SBUX', shares_owned=100)
    nike = StocksOwned(
        total_cost=9380, owner_id=3, ticker='NKE', shares_owned=100)
    mcdonalds = StocksOwned(
        total_cost=30650, owner_id=3, ticker='MCD', shares_owned=100)
    pepsi = StocksOwned(
        total_cost=17320, owner_id=3, ticker='PEP', shares_owned=100)
    procter_gamble = StocksOwned(
        total_cost=16540, owner_id=3, ticker='PG', shares_owned=100)
    amex = StocksOwned(
        total_cost=22640, owner_id=3, ticker='AXP', shares_owned=100)
    bank_of_america = StocksOwned(
        total_cost=3890, owner_id=3, ticker='BAC', shares_owned=100)
    goldman_sachs = StocksOwned(
        total_cost=42960, owner_id=3, ticker='GS', shares_owned=100)
    caterpillar = StocksOwned(
        total_cost=35720, owner_id=3, ticker='CAT', shares_owned=100)
    ibm = StocksOwned(
        total_cost=18750, owner_id=3, ticker='IBM', shares_owned=100)
    cisco = StocksOwned(
        total_cost=5430, owner_id=3, ticker='CSCO', shares_owned=100)
    ups = StocksOwned(
        total_cost=15230, owner_id=3, ticker='UPS', shares_owned=100)
    fedex = StocksOwned(
        total_cost=28630, owner_id=3, ticker='FDX', shares_owned=100)
    american_airlines = StocksOwned(
        total_cost=1270, owner_id=3, ticker='AAL', shares_owned=100)
    abbvie = StocksOwned(
        total_cost=18090, owner_id=3, ticker='ABBV', shares_owned=100)

    # Original stocks
    db.session.add(apple)
    db.session.add(netflix)
    db.session.add(amazon)
    db.session.add(ford)
    
    # Add new stocks for owner_id 1
    db.session.add(microsoft)
    db.session.add(google)
    db.session.add(tesla)
    db.session.add(nvidia)
    db.session.add(meta)
    db.session.add(jpmorgan)
    db.session.add(visa)
    db.session.add(walmart)
    db.session.add(disney)
    db.session.add(coca_cola)
    db.session.add(paypal)
    db.session.add(intel)
    db.session.add(amd)
    
    # Add new stocks for owner_id 2
    db.session.add(costco)
    db.session.add(target)
    db.session.add(home_depot)
    db.session.add(boeing)
    db.session.add(pfizer)
    db.session.add(merck)
    db.session.add(johnson)
    db.session.add(mastercard)
    db.session.add(adobe)
    db.session.add(salesforce)
    db.session.add(verizon)
    db.session.add(atnt)
    db.session.add(exxon)
    db.session.add(chevron)
    
    # Add new stocks for owner_id 3
    db.session.add(starbucks)
    db.session.add(nike)
    db.session.add(mcdonalds)
    db.session.add(pepsi)
    db.session.add(procter_gamble)
    db.session.add(amex)
    db.session.add(bank_of_america)
    db.session.add(goldman_sachs)
    db.session.add(caterpillar)
    db.session.add(ibm)
    db.session.add(cisco)
    db.session.add(ups)
    db.session.add(fedex)
    db.session.add(american_airlines)
    db.session.add(abbvie)
    
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