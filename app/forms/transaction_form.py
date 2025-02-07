from flask_wtf import FlaskForm
from wtforms import SelectField, FloatField, IntegerField
from wtforms.validators import DataRequired


class TransactionForm(FlaskForm):
    order_type = SelectField(
        "Order Type",
        validators=[DataRequired()],
        choices=[("Market Order", "Market Order"), ("Limit Order", "Limit Order")],
    )
    limit_price = FloatField(
        "Limit Price",
        validators=[DataRequired()],
    )
    shares = IntegerField(
        "Shares",
        validators=[DataRequired()],
    )
    buy_in = SelectField(
        "Buy In",
        validators=[DataRequired()],
        choices=[("Shares", "Shares"), ("Dollars", "Dollars")],
    )
    amount = FloatField(
        "Amount",
        validators=[DataRequired()],
    )
