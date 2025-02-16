from flask_wtf import FlaskForm
from wtforms import SelectField, FloatField, IntegerField
from wtforms.validators import DataRequired, Optional, NumberRange


class TransactionForm(FlaskForm):
    order_type = SelectField(
        "Order Type",
        validators=[DataRequired()],
        choices=[("Market Order", "Market Order"), ("Limit Order", "Limit Order")],
    )

    limit_price = FloatField(
        "Limit Price",
        validators=[
            Optional(),
            NumberRange(min=0, message="Limit price must be at least 0."),
        ],
    )

    shares = IntegerField(
        "Shares",
        validators=[Optional()],  # ✅ Allow shares to be optional
    )

    buy_in = SelectField(
        "Buy In",
        validators=[DataRequired()],
        choices=[("Shares", "Shares"), ("Dollars", "Dollars")],
    )

    amount = FloatField(
        "Amount",
        validators=[
            Optional(),
            NumberRange(min=0, message="Amount must be at least 0."),
        ],
    )
