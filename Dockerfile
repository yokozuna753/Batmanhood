# FROM python:3.9.18-alpine3.18

# RUN apk add build-base

# RUN apk add postgresql-dev gcc python3-dev musl-dev

# ARG FLASK_APP
# ARG FLASK_ENV
# ARG DATABASE_URL
# ARG SCHEMA
# ARG SECRET_KEY

# # Set environment variables
# ENV FLASK_APP=${FLASK_APP}
# ENV FLASK_ENV=${FLASK_ENV}
# ENV DATABASE_URL=${DATABASE_URL}
# ENV SCHEMA=${SCHEMA}
# ENV SECRET_KEY=${SECRET_KEY}

# WORKDIR /var/www

# COPY requirements.txt .

# RUN pip install -r requirements.txt
# RUN pip install psycopg2

# COPY . .

# RUN flask db upgrade
# RUN flask seed all
# CMD gunicorn app:app

#! old code ABOVE

FROM python:3.9.18-alpine3.18

# Install required build dependencies
# RUN apk add --no-cache build-base postgresql-dev gcc python3-dev musl-dev
RUN apk add --no-cache build-base postgresql-dev gcc python3-dev musl-dev postgresql-client


# Set up environment variables
ARG FLASK_APP
ARG FLASK_ENV
ARG DATABASE_URL
ARG SCHEMA
ARG SECRET_KEY
ARG DATABASE_PASSWORD
ARG DATABASE_HOST
ARG DATABASE_USER
ARG DATABASE_NAME

# Set environment variables in Docker
ENV FLASK_APP=${FLASK_APP}
ENV FLASK_ENV=${FLASK_ENV}
ENV DATABASE_URL=${DATABASE_URL}
ENV SCHEMA=${SCHEMA}
ENV SECRET_KEY=${SECRET_KEY}
ENV DATABASE_PASSWORD=${DATABASE_PASSWORD}
ENV DATABASE_HOST=${DATABASE_HOST}
ENV DATABASE_USER=${DATABASE_USER}
ENV DATABASE_NAME=${DATABASE_NAME}

# Set working directory
WORKDIR /var/www

# Copy requirements.txt and install dependencies
COPY requirements.txt .

RUN pip install -r requirements.txt
RUN pip install psycopg2
RUN pip install yfinance --upgrade

# Copy the rest of the app files
COPY . .

# Run migrations and set schema before starting the app
# CMD ["sh", "-c", "PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c 'SET search_path TO bat_schema;' && flask db upgrade && flask seed all && gunicorn app:app"]
CMD sh -c 'PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SET search_path TO $SCHEMA;" && flask db upgrade && flask seed all && gunicorn app:app'
