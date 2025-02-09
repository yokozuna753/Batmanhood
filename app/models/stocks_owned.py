from .db import db, environment, SCHEMA, add_prefix_for_prod


class StocksOwned(db.Model):
    __tablename__ = "stocks_owned"
    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    estimated_cost = db.Column(db.Float, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False)
    ticker = db.Column(db.String(100), nullable=False)
    shares_owned = db.Column(db.Float, nullable=False)

    owners = db.relationship(
        "User", back_populates="stocks_owned", cascade="save-update"
    )

    # def __repr__(self):
    #     return f"<Stock Owned Ticker {self.ticker}, Owner ID: {self.owner_id}>"
