from .db import db, environment, SCHEMA, add_prefix_for_prod





class Order(db.Model):
    __tablename__ = "orders"
    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    price_purchased = db.Column(db.Float, nullable=False)
    shares_purchased = db.Column(db.Float, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False)
    ticker = db.Column(db.String(100), nullable=False)
    order_type = db.Column(db.String(100), nullable=False)

    owners = db.relationship(
        "User", back_populates="orders", cascade="save-update"
    )
    
    def to_dict(self):
        return {"id": self.id, 
                "price_purchased": self.price_purchased, 
                "shares_purchased": self.shares_purchased,
                "owner_id": self.owner_id,
                "ticker": self.ticker,
                "order_type": self.order_type,
                # "owners": self.owners.to_dict() if self.owners else None 
                }
    # def __repr__(self):
    #     return f"<Stock Owned Ticker {self.ticker}, Owner ID: {self.owner_id}>"
