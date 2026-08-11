FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
# Install gunicorn along with other requirements
RUN pip install --no-cache-dir gunicorn && pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port the backend runs on
EXPOSE 8000

# The command to run the application will be specified in docker-compose.yml