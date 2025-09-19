#!/bin/bash
# Auto-populate backend/.env from Codespace secrets if present in environment

ENV_FILE="backend/.env"

# List of secrets to inject
declare -a SECRETS=(
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_REGION"
  "AWS_S3_BUCKET"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
  "NODE_ENV"
  "PORT"
)

echo "# Auto-generated .env from Codespace secrets" > "$ENV_FILE"
for SECRET in "${SECRETS[@]}"; do
  VALUE=$(printenv "$SECRET")
  if [ -n "$VALUE" ]; then
    echo "$SECRET=$VALUE" >> "$ENV_FILE"
  else
    echo "$SECRET=" >> "$ENV_FILE"
  fi
done

echo "Populated $ENV_FILE with available secrets."
