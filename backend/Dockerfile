# Use Python as the base image
FROM python:3.12-slim

# Prevent Python from generating .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Display Python output immediately
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Copy the dependency list
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django application
COPY . .

# Expose the Django application port
EXPOSE 8000

# Apply migrations and start Django
CMD ["sh", "-c", "python manage.py migrate --noinput && exec python manage.py runserver 0.0.0.0:8000"]