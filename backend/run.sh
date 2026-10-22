#!/usr/bin/env bash
# Recall backend launcher.
# Boots the Spring Boot jar (building it first if missing) on $SERVER_PORT (default 8080).
set -euo pipefail

cd "$(dirname "$0")"

# Load environment variables from .env if present
if [ -f .env ]; then
  echo "[run.sh] Loading environment variables from backend/.env..."
  set -a
  . ./.env
  set +a
elif [ -f ../.env ]; then
  echo "[run.sh] Loading environment variables from root .env..."
  set -a
  . ../.env
  set +a
fi

if ! command -v java >/dev/null 2>&1 || ! command -v mvn >/dev/null 2>&1; then
  export JAVA_HOME="${JAVA_HOME:-$HOME/tools/jdk21/usr/lib/jvm/java-21-openjdk-amd64}"
  export PATH="$JAVA_HOME/bin:$HOME/tools/apache-maven-3.9.9/bin:$PATH"
fi

JAR="target/recall-backend-1.0.0.jar"

if [ ! -f "$JAR" ]; then
  echo "[run.sh] Jar not found, building (tests skipped)..."
  mvn -q -DskipTests package
fi

mkdir -p data

echo "[run.sh] Starting Recall backend on port ${SERVER_PORT:-8080}..."
exec java -jar "$JAR"
