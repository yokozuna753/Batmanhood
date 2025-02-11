from .db import db, environment, SCHEMA, add_prefix_for_prod


class StocksOwned(db.Model):
    __tablename__ = "stocks_owned"
    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    total_cost = db.Column(db.Float, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False)
    ticker = db.Column(db.String(100), nullable=False)
    shares_owned = db.Column(db.Float, nullable=False)

    owners = db.relationship(
        "User", back_populates="stocks_owned", cascade="save-update"
    )
    
    def to_dict(self):
        return {"id": self.id, 
                "total_cost": self.total_cost, 
                "owner_id": self.owner_id,
                "ticker": self.ticker,
                "shares_owned": self.shares_owned,
                }
    def __repr__(self):
        return f"<StocksOwned(id={self.id}, ticker={self.ticker}, shares_owned={self.shares_owned})>"
