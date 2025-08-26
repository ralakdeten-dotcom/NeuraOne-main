#!/bin/bash

# Complete setup script for NeuraCRM3 with sudo password support
set -e

echo "🚀 NeuraCRM3 New System Setup"
echo "============================="

# Check if sudo password is provided
if [ -z "$SUDO_PASSWORD" ]; then
    echo "⚠️  SUDO_PASSWORD environment variable not set"
    echo "Usage: SUDO_PASSWORD=your_password ./scripts/setup-with-sudo.sh"
    echo "Or you can run: make setup (and enter password when prompted)"
    exit 1
fi

# Check Python version
echo "🐍 Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ required. Current: $python_version"
    echo "Please install Python 3.11 or higher"
    exit 1
fi
echo "✅ Python $python_version detected"

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    echo "Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

node_version=$(node --version | cut -d'v' -f2 | cut -d. -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: v$node_version"
    exit 1
fi
echo "✅ Node.js $(node --version) detected"

# Setup environment file
echo "⚙️  Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "⚠️  Please create .env file with database configuration"
    echo "📝 Created .env file from template"
    echo "⚠️  Please update database credentials in .env file if needed"
else
    echo "✅ .env file already exists"
fi

# Create Python virtual environment
echo "🐍 Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
echo "✅ Virtual environment activated"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements/dev.txt
echo "✅ Python dependencies installed"
cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
npm install @heroicons/react
echo "✅ Node.js dependencies installed"
cd ..

# Initialize database with sudo password
echo "🗄️  Initializing database..."
chmod +x scripts/db-init-with-sudo.sh
SUDO_PASSWORD="$SUDO_PASSWORD" ./scripts/db-init-with-sudo.sh

# Run migrations
echo "🔄 Running database migrations..."
cd backend
python manage.py migrate_schemas --shared
python manage.py migrate_schemas --tenant
echo "✅ Migrations completed"
cd ..

# Seed demo data
echo "🌱 Seeding demo data..."
python scripts/seed-dev-data.py

echo ""
echo "🎉 Setup completed successfully!"
echo "=========================="
echo ""
echo "🔑 Login Credentials:"
echo "   Super Admin: admin@neuracrm.com / admin123"
echo "   Demo Manager: manager@demo.com / demo123"
echo "   Demo Sales: sales@demo.com / demo123"
echo "   Demo Support: support@demo.com / demo123"
echo "   Demo Viewer: viewer@demo.com / demo123"
echo ""
echo "🌐 Access URLs:"
echo "   Super Admin: http://127.0.0.1:8000/superadmin/"
echo "   Demo Admin: http://demo.localhost:8000/admin/"
echo "   Frontend: http://localhost:3000"
echo ""
echo "🚀 To start development:"
echo "   make dev"
echo ""
echo "⚠️  Don't forget to add to /etc/hosts:"
echo "   127.0.0.1 demo.localhost"