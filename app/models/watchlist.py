from .db import db, environment, SCHEMA, add_prefix_for_prod


class Watchlist(db.Model):
    __tablename__ = "watchlists"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    watchlist_stocks = db.relationship("WatchlistStock", back_populates="watchlist")

    user = db.relationship(
        "User", back_populates="watchlist", cascade="save-update"
    )

    def to_dict(self):
        return { "id": self.id, "user_id": self.user_id, "name": self.name }
