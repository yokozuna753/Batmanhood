from .db import db, environment, SCHEMA, add_prefix_for_prod


class WatchlistStock(db.Model):
    __tablename__ = "watchlist_stocks"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    watchlist_id = db.Column(db.Integer, nullable=False)
    ticker = db.Column(db.Varchar(100), nullable=False)

    watchlist = db.relationship(
        "Watchlist", back_populates="watchlist_stocks", cascade="save-update"
    )
