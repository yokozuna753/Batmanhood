from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.engine import Engine
import os

environment = os.getenv("FLASK_ENV")
SCHEMA = os.environ.get("SCHEMA", "bat_schema")  # Default schema

db = SQLAlchemy()

# Helper function to add prefix to foreign key column references in production
def add_prefix_for_prod(attr):
    if environment == "production":
        return f"{SCHEMA}.{attr}"
    else:
        return attr

# Event listener to set schema on each connection
@event.listens_for(Engine, 'connect')
def set_search_path(dbapi_connection, connection_record):
    # cursor = dbapi_connection.cursor()
    # cursor.execute(f'SET search_path TO {SCHEMA}, public')  # This sets the schema dynamically
    # cursor.close() #! COMMENT IN FOR PRODUCTION AND DELETE BELOW - MAYBE NOT, TO BE TESTED
    if os.getenv('DATABASE_URL', '').startswith('postgresql://'):
        cursor = dbapi_connection.cursor()
        cursor.execute(f'SET search_path TO {SCHEMA}, public')  # This sets the schema dynamically
        cursor.close()